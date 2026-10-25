# Background job, AFTER the bakes:  blender -b work.blend -P build_city.py
# v022 (owner 2026-10-24: "the city back in v022: full in the stills, a light backdrop in the live model").
# Builds collection CITY (root empty CITY), rebuilt from scratch every run (build_site.py drops it before the bakes):
#   CITY_stills: everything the Cycles stills see around the plot:
#     - street grid continuing the ring arms (asphalt, kerbs, lane paint), lit by street lamps (point lights within
#       STREET_LIGHT_R, emissive heads beyond), parked and moving cars;
#     - buildings on lots of varied size: 2-6 storeys near, taller far away, a few towers on the horizon; L-shapes and
#       courtyards; roof clutter (AC units, tanks, stair huts) so the roofs read from the hero's down view;
#       warm windows, 10-20 % lit in clusters by floor and unit, ~35 % of buildings dark (QA mock notes 1-2);
#     - street trees (Poly Haven island_tree_02), palms along streets and medians (VEG_palmA / D), shrubs (shrub_02);
#     - a sea plane toward the sunset and a low haze layer that fades to the horizon sky colour;
#     - lane paint on the ring road. SITE_ground (the live fade disc) is hidden from render: the city ground replaces it.
#   CITY_live: what the GLB gets (hidden from render): the near ring of low blocks (CITY_ring_*, one instanced mesh,
#     MAT_city_ring) - the horizon-band card CITY_card is added by bake_city_band.py.
# export_glb.py drops CITY_stills.
import bpy, bmesh, math, random, os, time
import numpy as np
from mathutils import Vector, Matrix
exec(open(r'C:\aljazira-3d\blend\scripts\lib.py').read())
T0 = time.time()
TEX = os.environ.get('AJ_TEX', r'C:\aljazira-3d\textures')
PH = r'C:\aljazira-3d\assets\polyhaven'
GZ = -0.6
RING_C, RING_R = Vector((4.0, -40.0)), (44.0, 56.0)
PLOT_C = Vector((0.0, -25.0))
CITY_R = 1750.0                     # city radius around the plot
COAST_Y = 820.0                     # sea beyond (toward the sunset, +Y)
STREET_LIGHT_R = 380.0              # real point lights inside this radius, emissive heads beyond
CAM = bpy.data.objects['CAM_hero'].matrix_world.translation.copy()
rng = random.Random(2201)

# ---- reset
if 'CITY' in bpy.data.collections:
    for o in list(bpy.data.collections['CITY'].all_objects): bpy.data.objects.remove(o, do_unlink=True)
    for c in list(bpy.data.collections['CITY'].children_recursive): bpy.data.collections.remove(c)
    bpy.data.collections.remove(bpy.data.collections['CITY'])
for me in [m for m in bpy.data.meshes if m.users == 0]: bpy.data.meshes.remove(me)
CITY = bpy.data.collections.new('CITY'); bpy.context.scene.collection.children.link(CITY)
STILLS = bpy.data.collections.new('CITY_stills'); CITY.children.link(STILLS)
LIVE = bpy.data.collections.new('CITY_live'); CITY.children.link(LIVE)
ROOT = bpy.data.objects.new('CITY', None); CITY.objects.link(ROOT)

def obj(name, me, coll=STILLS):
    o = bpy.data.objects.new(name, me); coll.objects.link(o); o.parent = ROOT; return o
def bm_obj(name, bm, mat, coll=STILLS):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(mat)
    return obj(name, me, coll)

# ---- materials (stills; procedural)
def node_mat(name):
    m = bpy.data.materials.get(name)
    if m: bpy.data.materials.remove(m)
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    return m, m.node_tree.nodes, m.node_tree.links, b
def lin(c): return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

def mat_building():
    """Plaster walls + window grid (bay 3.0 m, storey 3.3 m). Per building (face attribute 'bid' in 0..1):
    plaster tint, dark building (bid2 < 0.35) or a lit fraction 8-28 %; lit windows cluster by unit (3 bays) and
    floor, warm 2700-3500 K. Roofs (normal.z > 0.5) get no windows."""
    m, N, L, b = node_mat('MAT_city_bldg')
    geo = N.new('ShaderNodeNewGeometry'); P = N.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Position'], P.inputs[0])
    Nn = N.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Normal'], Nn.inputs[0])
    def M(op, a, b_=None, c=None):
        n = N.new('ShaderNodeMath'); n.operation = op
        for i, v in enumerate((a, b_, c)):
            if v is None: continue
            if isinstance(v, (int, float)): n.inputs[i].default_value = v
            else: L.new(v, n.inputs[i])
        return n.outputs[0]
    u = M('ADD', M('MULTIPLY', P.outputs['Y'], Nn.outputs['X']), M('MULTIPLY', M('MULTIPLY', P.outputs['X'], Nn.outputs['Y']), -1.0))
    z = P.outputs['Z']
    bay = M('FLOOR', M('DIVIDE', u, 3.0)); fu = M('FRACT', M('DIVIDE', u, 3.0))
    flo = M('FLOOR', M('DIVIDE', z, 3.3)); fz = M('FRACT', M('DIVIDE', z, 3.3))
    win = M('MULTIPLY', M('MULTIPLY', M('GREATER_THAN', fu, 0.22), M('LESS_THAN', fu, 0.78)),
            M('MULTIPLY', M('GREATER_THAN', fz, 0.30), M('LESS_THAN', fz, 0.78)))
    vert = M('LESS_THAN', M('ABSOLUTE', Nn.outputs['Z']), 0.5)
    above = M('GREATER_THAN', z, 1.2)                                   # no windows in the ground course
    win = M('MULTIPLY', M('MULTIPLY', win, vert), above)
    at = N.new('ShaderNodeAttribute'); at.attribute_type = 'GEOMETRY'; at.attribute_name = 'bid'
    bid = at.outputs['Fac']
    unit = M('FLOOR', M('DIVIDE', bay, 3.0))
    wn = N.new('ShaderNodeTexWhiteNoise'); wn.noise_dimensions = '4D'
    cv = N.new('ShaderNodeCombineXYZ'); L.new(unit, cv.inputs['X']); L.new(flo, cv.inputs['Y']); L.new(M('MULTIPLY', bid, 997.0), cv.inputs['Z'])
    L.new(cv.outputs[0], wn.inputs['Vector']); wn.inputs['W'].default_value = 0.37
    wn2 = N.new('ShaderNodeTexWhiteNoise'); wn2.noise_dimensions = '4D'                 # per-window jitter inside lit units
    cv2 = N.new('ShaderNodeCombineXYZ'); L.new(bay, cv2.inputs['X']); L.new(flo, cv2.inputs['Y']); L.new(M('MULTIPLY', bid, 991.0), cv2.inputs['Z'])
    L.new(cv2.outputs[0], wn2.inputs['Vector'])
    bid2 = M('FRACT', M('MULTIPLY', bid, 7.31))
    frac = M('MULTIPLY', M('GREATER_THAN', bid2, 0.35), M('ADD', 0.08, M('MULTIPLY', M('FRACT', M('MULTIPLY', bid, 3.17)), 0.20)))
    lit = M('MULTIPLY', M('LESS_THAN', wn.outputs['Value'], frac), M('GREATER_THAN', wn2.outputs['Value'], 0.25))
    litw = M('MULTIPLY', lit, win)
    warm = N.new('ShaderNodeMix'); warm.data_type = 'RGBA'; L.new(wn2.outputs['Value'], warm.inputs['Factor'])
    warm.inputs['A'].default_value = (*lin((1.0, 0.62, 0.30)), 1); warm.inputs['B'].default_value = (*lin((1.0, 0.78, 0.52)), 1)
    # v022 QA: warm street-light spill on the lower walls (fades over ~6 m), added to the window light
    spill = M('MULTIPLY', M('MULTIPLY', M('SUBTRACT', 1.0, win), vert), M('EXPONENT', M('DIVIDE', M('SUBTRACT', GZ, z), 6.0)))
    we = N.new('ShaderNodeVectorMath'); we.operation = 'SCALE'; L.new(warm.outputs['Result'], we.inputs[0]); L.new(M('MULTIPLY', litw, 2.2), we.inputs['Scale'])
    se = N.new('ShaderNodeVectorMath'); se.operation = 'SCALE'; se.inputs[0].default_value = lin((1.0, 0.70, 0.42)); L.new(M('MULTIPLY', spill, 0.10), se.inputs['Scale'])
    ee = N.new('ShaderNodeVectorMath'); ee.operation = 'ADD'; L.new(we.outputs[0], ee.inputs[0]); L.new(se.outputs[0], ee.inputs[1])
    L.new(ee.outputs[0], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = 1.0
    tint = M('ADD', 0.66, M('MULTIPLY', M('FRACT', M('MULTIPLY', bid, 13.7)), 0.28))      # plaster value 0.66..0.94
    pl = N.new('ShaderNodeCombineColor'); L.new(M('MULTIPLY', tint, 0.98), pl.inputs[0]); L.new(M('MULTIPLY', tint, 0.88), pl.inputs[1]); L.new(M('MULTIPLY', tint, 0.72), pl.inputs[2])   # warm beige (QA: city mean near the ref's)
    grime = N.new('ShaderNodeTexNoise'); grime.inputs['Scale'].default_value = 0.35; L.new(geo.outputs['Position'], grime.inputs['Vector'])
    pg = N.new('ShaderNodeMix'); pg.data_type = 'RGBA'; pg.blend_type = 'MULTIPLY'; pg.inputs['Factor'].default_value = 0.35
    L.new(pl.outputs[0], pg.inputs['A']); L.new(grime.outputs['Fac'], pg.inputs['B'])
    roof = N.new('ShaderNodeMix'); roof.data_type = 'RGBA'; L.new(M('GREATER_THAN', Nn.outputs['Z'], 0.5), roof.inputs['Factor'])
    L.new(pg.outputs['Result'], roof.inputs['A']); roof.inputs['B'].default_value = (*lin((0.42, 0.41, 0.39)), 1)
    glass = N.new('ShaderNodeMix'); glass.data_type = 'RGBA'; L.new(win, glass.inputs['Factor'])
    L.new(roof.outputs['Result'], glass.inputs['A']); glass.inputs['B'].default_value = (*lin((0.05, 0.055, 0.06)), 1)
    L.new(glass.outputs['Result'], b.inputs['Base Color'])
    rr = N.new('ShaderNodeMix'); rr.data_type = 'FLOAT'; L.new(win, rr.inputs['Factor']); rr.inputs['A'].default_value = 0.85; rr.inputs['B'].default_value = 0.12
    L.new(rr.outputs['Result'], b.inputs['Roughness'])
    return m

def mat_flat(name, base, rough=0.8, emit=None, strength=0.0, metal=0.0):
    m, N, L, b = node_mat(name)
    b.inputs['Base Color'].default_value = (*lin(base), 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*lin(emit), 1); b.inputs['Emission Strength'].default_value = strength
    return m

def mat_car():
    m, N, L, b = node_mat('MAT_city_car')
    oi = N.new('ShaderNodeObjectInfo'); L.new(oi.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.25; b.inputs['Coat Weight'].default_value = 0.6
    return m

def mat_ph_ground(name, asset, tile, tint, rough_k=1.0):
    m, N, L, b = node_mat(name)
    geo = N.new('ShaderNodeNewGeometry'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1 / tile,) * 3
    L.new(geo.outputs['Position'], mp.inputs['Vector'])
    d = N.new('ShaderNodeTexImage'); d.image = bpy.data.images.load(os.path.join(PH, asset, asset + '_diff_1k.jpg'), check_existing=True)
    L.new(mp.outputs['Vector'], d.inputs['Vector'])
    mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1.0
    L.new(d.outputs['Color'], mx.inputs['A']); mx.inputs['B'].default_value = (*tint, 1); L.new(mx.outputs['Result'], b.inputs['Base Color'])
    r = N.new('ShaderNodeTexImage'); r.image = bpy.data.images.load(os.path.join(PH, asset, asset + '_rough_1k.jpg'), check_existing=True)
    r.image.colorspace_settings.name = 'Non-Color'; L.new(mp.outputs['Vector'], r.inputs['Vector'])
    rk = N.new('ShaderNodeMath'); rk.operation = 'MULTIPLY'; rk.inputs[1].default_value = rough_k
    L.new(r.outputs['Color'], rk.inputs[0]); L.new(rk.outputs[0], b.inputs['Roughness'])
    return m

MB = mat_building()
M_ROAD = mat_ph_ground('MAT_city_road', 'asphalt_01', 2.08, (1.0, 1.0, 1.0))
M_WALK = mat_ph_ground('MAT_city_walk', 'rectangular_paving', 2.0, (1.1, 1.05, 1.0))
M_LOT = mat_flat('MAT_city_lot', (0.30, 0.29, 0.27), 0.9)
M_GREEN = mat_ph_ground('MAT_city_green', 'leafy_grass', 2.0, (0.9, 1.0, 0.85))
M_PAINT = mat_flat('MAT_city_paint', (0.85, 0.85, 0.82), 0.6)
M_LAMP = mat_flat('MAT_city_lamp', (1.0, 0.85, 0.65), 0.5, (1.0, 0.74, 0.46), 30.0)
M_POLE = mat_flat('MAT_city_pole', (0.12, 0.12, 0.13), 0.5, metal=0.6)
M_CAR = mat_car()
M_HEAD = mat_flat('MAT_city_headlight', (1, 1, 1), 0.5, (1.0, 0.92, 0.8), 25.0)
M_TAIL = mat_flat('MAT_city_taillight', (1, 0, 0), 0.5, (1.0, 0.08, 0.04), 12.0)
M_ROOFX = mat_flat('MAT_city_roofkit', (0.55, 0.55, 0.54), 0.6, metal=0.2)
M_SEA = mat_flat('MAT_city_sea', (0.012, 0.025, 0.05), 0.05)

# ---- street grid: x lines (north-south streets) and y lines (east-west), the ring arms are two of the x lines
def lines(c0, step, lo, hi):
    out, v = [c0], c0
    while v < hi: v += step * rng.uniform(0.8, 1.25); out.append(v)
    v = c0
    while v > lo: v -= step * rng.uniform(0.8, 1.25); out.append(v)
    return sorted(out)
XL = sorted(set([-46.0, 54.0] + [x for x in lines(54.0, 92.0, -CITY_R, CITY_R) if x > 100] + [x for x in lines(-46.0, 92.0, -CITY_R, CITY_R) if x < -100]))
YL = sorted([-122.0] + [y for y in lines(-122.0, 88.0, -CITY_R, COAST_Y) if y != -122.0 and y < COAST_Y - 30])
W_MAIN, W_ST = 16.0, 11.0
def width(v, arms=(-46.0, 54.0)): return W_MAIN if v in arms or v == -122.0 else W_ST
def in_city(x, y): return Vector((x, y)).length - 0 < CITY_R and y < COAST_Y
def in_plot(x, y, m=0.0): return (Vector((x, y)) - RING_C).length < RING_R[1] + 6 + m

road = bmesh.new(); walk = bmesh.new(); paint = bmesh.new()
def strip(bm, a, b, w, z):
    d = (b - a).normalized(); s = Vector((-d.y, d.x)) * (w / 2)
    bm.faces.new([bm.verts.new((*(a - s), z)), bm.verts.new((*(b - s), z)), bm.verts.new((*(b + s), z)), bm.verts.new((*(a + s), z))])
def segs_x(x):                         # pieces of the north-south street at x, outside the plot / ring disc
    pts = []; y = -CITY_R
    while y < COAST_Y - 10:
        y1 = min(y + 40.0, COAST_Y - 10)
        m = Vector((x, (y + y1) / 2))
        if m.length < CITY_R and not in_plot(m.x, m.y): pts.append((Vector((x, y)), Vector((x, y1))))
        y = y1
    return pts
def segs_y(y):
    pts = []; x = -CITY_R
    while x < CITY_R:
        x1 = x + 40.0; m = Vector(((x + x1) / 2, y))
        if m.length < CITY_R and not in_plot(m.x, m.y): pts.append((Vector((x, y)), Vector((x1, y))))
        x = x1
    return pts
STREETS = []
for x in XL:
    for a, b in segs_x(x): STREETS.append((a, b, width(x)))
for y in YL:
    for a, b in segs_y(y): STREETS.append((a, b, width(y)))
for a, b, w in STREETS:
    strip(road, a, b, w, GZ - 0.03)
    d = (b - a).normalized(); s = Vector((-d.y, d.x))
    for side in (-1, 1): strip(walk, a + s * side * (w / 2 + 1.6), b + s * side * (w / 2 + 1.6), 3.2, GZ + 0.12)
    L_ = (b - a).length; t = 0.0                                   # centre dashes
    while t + 3 < L_:
        strip(paint, a + d * t, a + d * (t + 3), 0.15, GZ - 0.015); t += 9.0
for r in (47.0, 50.0, 53.0):                                       # lane dashes on the ring road
    for k in range(0, 180, 2):
        a0, a1 = math.radians(180 + k), math.radians(180 + k + 0.9)
        strip(paint, RING_C + Vector((math.cos(a0), math.sin(a0))) * r, RING_C + Vector((math.cos(a1), math.sin(a1))) * r, 0.15, GZ + 0.005)
bm_obj('CITY_roads', road, M_ROAD); bm_obj('CITY_walks', walk, M_WALK); bm_obj('CITY_paint', paint, M_PAINT)
gr = bmesh.new()                                                   # lot ground under everything (replaces SITE_ground)
bmesh.ops.create_circle(gr, cap_ends=True, segments=96, radius=CITY_R + 300)
for v in gr.verts: v.co.z = GZ - 0.06
bm_obj('CITY_ground', gr, M_LOT)
sea = bmesh.new(); vs = [sea.verts.new(v) for v in ((-6000, COAST_Y, -1.2), (6000, COAST_Y, -1.2), (6000, 6000, -1.2), (-6000, 6000, -1.2))]
sea.faces.new(vs); bm_obj('CITY_sea', sea, M_SEA)
bpy.data.objects['SITE_ground'].hide_render = True                  # the live fade disc: the city ground takes over

# ---- lots and buildings (cells between street lines)
def storeys(d):
    if d < 320: return rng.choice([2, 2, 3, 3, 4, 4, 5, 6])
    if d < 750: return rng.choice([3, 4, 4, 5, 5, 6, 7, 8])
    if d > 650 and rng.random() < 0.035: return rng.randint(14, 36)        # horizon towers
    return rng.choice([4, 5, 6, 6, 7, 8, 9, 10])
def box(bm, cx, cy, w, d_, z0, z1, rot, bid_layer, bid):
    c, s = math.cos(rot), math.sin(rot)
    vs = [bm.verts.new((cx + x * c - y * s, cy + x * s + y * c, z)) for z in (z0, z1) for (x, y) in ((-w, -d_), (w, -d_), (w, d_), (-w, d_))]
    for f in ((4, 5, 6, 7), (0, 4, 5, 1)[::-1], (1, 5, 6, 2)[::-1], (2, 6, 7, 3)[::-1], (3, 7, 4, 0)[::-1]):
        fc_ = bm.faces.new([vs[i] for i in f]); fc_[bid_layer] = bid
def roof_kit(bm, cx, cy, w, d_, top, rot, bid_layer):
    c, s = math.cos(rot), math.sin(rot)
    def at(x, y): return cx + x * c - y * s, cy + x * s + y * c
    for _ in range(rng.randint(2, 7)):                              # AC units
        x, y = rng.uniform(-w + 1.5, w - 1.5), rng.uniform(-d_ + 1.5, d_ - 1.5)
        box(bm, *at(x, y), 0.7, 0.5, top, top + 0.9, rot, bid_layer, 0.0)
    if rng.random() < 0.7:                                          # water tanks
        x, y = rng.uniform(-w + 2, w - 2), rng.uniform(-d_ + 2, d_ - 2); px, py = at(x, y)
        add_cyl(bm, px, py, top, top + 1.4, 0.7, 8)
    if w > 5 and rng.random() < 0.6:                                # stair hut
        box(bm, *at(rng.uniform(-w + 2, w - 2), rng.uniform(-d_ + 2, d_ - 2)), 1.6, 1.4, top, top + 2.8, rot, bid_layer, 0.0)
BLD = []                                                    # every building box (live city: same city)
def bbox(bm, cx, cy, w, d_, z0, z1, rot, bl, bid):
    box(bm, cx, cy, w, d_, z0, z1, rot, bl, bid); BLD.append((cx, cy, w, d_, z1, rot, bid))
nb = 0; kit = bmesh.new(); kit_bid = kit.faces.layers.float.new('bid')
for i in range(len(XL) - 1):
    for j in range(len(YL) - 1):
        x0 = XL[i] + width(XL[i]) / 2 + 3.2; x1 = XL[i + 1] - width(XL[i + 1]) / 2 - 3.2
        y0 = YL[j] + width(YL[j]) / 2 + 3.2; y1 = YL[j + 1] - width(YL[j + 1]) / 2 - 3.2
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        if x1 - x0 < 12 or y1 - y0 < 12 or Vector((cx, cy)).length > CITY_R: continue
        bm = bmesh.new(); bl = bm.faces.layers.float.new('bid')
        # split the cell into lots: strips along the longer side, lot frontage 14-34 m (bigger far away)
        dist = (Vector((cx, cy)) - PLOT_C).length
        f0 = 14 if dist < 500 else 22
        along_x = (x1 - x0) >= (y1 - y0)
        A0, A1, B0, B1 = (x0, x1, y0, y1) if along_x else (y0, y1, x0, x1)
        rows = [(B0, (B0 + B1) / 2), ((B0 + B1) / 2, B1)] if B1 - B0 > 40 else [(B0, B1)]
        for r0, r1 in rows:
            a = A0
            while a < A1 - 8:
                a1 = min(A1, a + rng.uniform(f0, f0 * 2.4))
                lx0, lx1, ly0, ly1 = (a, a1, r0, r1) if along_x else (r0, r1, a, a1)
                lc = Vector(((lx0 + lx1) / 2, (ly0 + ly1) / 2))
                a = a1
                if in_plot(lc.x, lc.y, 12) or lc.y > COAST_Y - 25: continue
                if (lc - CAM.xy).length < 45 or (lc - Vector(TOWER_POS)).length < 75: continue
                if rng.random() < 0.08:                              # empty lot / small park
                    continue
                d = (lc - PLOT_C).length
                n = storeys(d) if lc.y < COAST_Y - 160 else min(storeys(d), 4)
                h = n * 3.3 + rng.uniform(0.3, 1.0)
                sb = rng.uniform(1.5, 4.0)                           # setback
                w = (lx1 - lx0) / 2 - sb; dd = (ly1 - ly0) / 2 - sb
                if w < 3 or dd < 3: continue
                rot = rng.uniform(-0.03, 0.03); bid = rng.random(); nb += 1
                kind = rng.random()
                if kind < 0.55 or min(w, dd) < 8:
                    bbox(bm, lc.x, lc.y, w, dd, GZ, GZ + h, rot, bl, bid)
                    roof_kit(kit, lc.x, lc.y, w, dd, GZ + h, rot, kit_bid)
                elif kind < 0.85:                                    # L-shape: a deep wing + a lower wing
                    bbox(bm, lc.x - w * 0.35, lc.y, w * 0.65, dd, GZ, GZ + h, rot, bl, bid)
                    bbox(bm, lc.x + w * 0.4, lc.y - dd * 0.45, w * 0.6, dd * 0.55, GZ, GZ + h - 3.3 * rng.randint(0, 2), rot, bl, bid)
                    roof_kit(kit, lc.x - w * 0.35, lc.y, w * 0.65, dd, GZ + h, rot, kit_bid)
                else:                                                # courtyard block
                    t_ = min(6.0, w * 0.35, dd * 0.35)
                    for ox, oy, ww, ddd in ((0, -dd + t_, w, t_), (0, dd - t_, w, t_), (-w + t_, 0, t_, dd - 2 * t_), (w - t_, 0, t_, dd - 2 * t_)):
                        bbox(bm, lc.x + ox, lc.y + oy, ww, ddd, GZ, GZ + h, rot, bl, bid)
                    roof_kit(kit, lc.x, lc.y - dd + t_, w, t_, GZ + h, rot, kit_bid)
        if len(bm.faces): bm_obj('CITY_blk_%03d_%03d' % (i, j), bm, MB)
        else: bm.free()
bm_obj('CITY_roofkit', kit, M_ROOFX)
print('CITY buildings %d, streets %d (%.0fs)' % (nb, len(STREETS), time.time() - T0), flush=True)

# ---- street lamps: poles + heads every ~34 m both sides; point lights near the plot
lamps = []
for a, b, w in STREETS:
    d = (b - a).normalized(); s = Vector((-d.y, d.x)); L_ = (b - a).length; t = rng.uniform(0, 34)
    while t < L_:
        for side in (-1, 1): lamps.append((a + d * t + s * side * (w / 2 + 0.6), -side * s))
        t += 34.0
pole_bm = bmesh.new(); head_bm = bmesh.new()
for p, toward in lamps:
    add_cyl(pole_bm, p.x, p.y, GZ, GZ + 7.5, 0.09, 5, caps=False)
    q = p + toward * 1.2
    add_box(head_bm, q.x - 0.35, q.y - 0.2, GZ + 7.3, q.x + 0.35, q.y + 0.2, GZ + 7.45)
bm_obj('CITY_lamp_poles', pole_bm, M_POLE); bm_obj('CITY_lamp_heads', head_bm, M_LAMP)
ld = bpy.data.lights.get('LGT_city') or bpy.data.lights.new('LGT_city', 'SPOT')
ld.energy = 2600.0; ld.color = (1.0, 0.76, 0.48); ld.spot_size = math.radians(120); ld.spot_blend = 0.5; ld.shadow_soft_size = 0.2
nl = 0
for p, toward in lamps:
    if (p - PLOT_C).length > STREET_LIGHT_R: continue
    q = p + toward * 1.2
    lo = bpy.data.objects.new('LGT_city_%04d' % nl, ld); STILLS.objects.link(lo); lo.parent = ROOT
    lo.location = (q.x, q.y, GZ + 7.2); lo.visible_glossy = False; nl += 1
print('CITY lamps %d, point lights %d' % (len(lamps), nl), flush=True)

# ---- cars: parked along kerbs, moving ones with head / tail lights (stills only)
car_bm = bmesh.new()
add_box(car_bm, -2.2, -0.9, 0.25, 2.2, 0.9, 1.0); add_box(car_bm, -1.2, -0.82, 1.0, 1.0, 0.82, 1.5)
car_me = bpy.data.meshes.new('CITY_car'); car_bm.to_mesh(car_me); car_bm.free(); car_me.materials.append(M_CAR)
lt = bmesh.new(); add_box(lt, 2.18, -0.8, 0.6, 2.25, -0.5, 0.75); add_box(lt, 2.18, 0.5, 0.6, 2.25, 0.8, 0.75)
head_me = bpy.data.meshes.new('CITY_carhead'); lt.to_mesh(head_me); lt.free(); head_me.materials.append(M_HEAD)
lt = bmesh.new(); add_box(lt, -2.25, -0.8, 0.65, -2.18, -0.5, 0.8); add_box(lt, -2.25, 0.5, 0.65, -2.18, 0.8, 0.8)
tail_me = bpy.data.meshes.new('CITY_cartail'); lt.to_mesh(tail_me); lt.free(); tail_me.materials.append(M_TAIL)
CAR_COLS = [(0.85, 0.85, 0.85), (0.05, 0.05, 0.06), (0.4, 0.42, 0.45), (0.6, 0.6, 0.62), (0.25, 0.05, 0.05), (0.1, 0.15, 0.3), (0.75, 0.72, 0.65)]
nc = 0
for a, b, w in STREETS:
    if (((a + b) / 2) - PLOT_C).length > 700: continue
    d = (b - a).normalized(); s = Vector((-d.y, d.x)); L_ = (b - a).length; ang = math.atan2(d.y, d.x)
    t = rng.uniform(0, 8)
    while t < L_:
        r_ = rng.random()
        if r_ < 0.35:                                                # parked, kerb side
            side = rng.choice((-1, 1)); p = a + d * t + s * side * (w / 2 - 1.2)
            o = obj('CITY_car_%04d' % nc, car_me); o.location = (p.x, p.y, GZ); o.rotation_euler = (0, 0, ang)
            o.color = (*lin(rng.choice(CAR_COLS)), 1); nc += 1
        elif r_ < 0.47:                                              # moving, lights on
            side = rng.choice((-1, 1)); p = a + d * t + s * side * (w / 4); heading = ang if side < 0 else ang + math.pi
            for me in (car_me, head_me, tail_me):
                o = obj('CITY_car_%04d' % nc, me); o.location = (p.x, p.y, GZ); o.rotation_euler = (0, 0, heading)
                o.color = (*lin(rng.choice(CAR_COLS)), 1)
            nc += 1
        t += rng.uniform(7, 14)
print('CITY cars %d' % nc, flush=True)

# ---- trees: Poly Haven island_tree_02 on sidewalks and lots, palms on main streets / medians, shrubs near the plot
def import_gltf(path, tag):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == 'MESH']
    bpy.context.view_layer.update()
    mws = [o.matrix_world.copy() for o in meshes]                     # before anything is unparented / removed
    for o in [o for o in new if o.type != 'MESH']: bpy.data.objects.remove(o, do_unlink=True)
    tdir = os.path.join(os.path.dirname(path), 'textures')            # the importer can leave an image on a broken
    for im in bpy.data.images:                                        # relative path (shrub_02_diff): point every
        f = os.path.join(tdir, os.path.basename(im.filepath.replace(chr(92), '/')))   # unpacked one at its file
        if im.packed_file is None and im.source == 'FILE' and os.path.exists(f) and not os.path.exists(bpy.path.abspath(im.filepath)):
            im.filepath = f; im.reload()
    return [o.data for o in meshes], mws, meshes
tree_data, tree_mw, tree_objs = import_gltf(os.path.join(PH, 'island_tree_02', 'island_tree_02_1k.gltf'), 'tree')
shrub_data, shrub_mw, shrub_objs = import_gltf(os.path.join(PH, 'shrub_02', 'shrub_02_1k.gltf'), 'shrub')
for o in tree_objs + shrub_objs: bpy.data.objects.remove(o, do_unlink=True)
def plant(datas, mws, name, p, rot, s):
    for k, (me, mw) in enumerate(zip(datas, mws)):
        o = obj('%s_%s' % (name, k), me)
        o.matrix_world = Matrix.Translation((p.x, p.y, GZ)) @ Matrix.Rotation(rot, 4, 'Z') @ Matrix.Scale(s, 4) @ mw
nt = 0; npalm = 0
palm_meshes = [bpy.data.meshes.get('VEG_palmA'), bpy.data.meshes.get('VEG_palmD')]
for a, b, w in STREETS:
    mid = (a + b) / 2; dist = (mid - PLOT_C).length
    main = w >= W_MAIN
    if dist > (900 if main else 620): continue
    d = (b - a).normalized(); s = Vector((-d.y, d.x)); L_ = (b - a).length
    t = rng.uniform(2, 10)
    while t < L_:
        for side in (-1, 1):
            p = a + d * t + s * side * (w / 2 + 2.6)
            if in_plot(p.x, p.y, 4): continue
            if main:
                me = rng.choice(palm_meshes)
                if me:
                    o = obj('CITY_palm_%04d' % npalm, me); o.location = (p.x, p.y, GZ)
                    o.rotation_euler = (0, 0, rng.uniform(0, 6.28)); sc_ = rng.uniform(0.85, 1.2); o.scale = (sc_, sc_, sc_ * rng.uniform(0.95, 1.2)); npalm += 1
            elif rng.random() < (0.6 if dist < 400 else 0.3):
                plant(tree_data, tree_mw, 'CITY_tree_%04d' % nt, p, rng.uniform(0, 6.28), rng.uniform(0.9, 1.4)); nt += 1
        t += rng.uniform(9, 15) if main else rng.uniform(8, 14)
pm = bpy.data.objects['SITE_planting']                                # v022 QA: shrub borders break the bed edges
tops = [w for w in (pm.matrix_world @ v.co for v in pm.data.vertices) if w.z > GZ + 0.2]
for k, p in enumerate(tops[::2]):
    plant(shrub_data, shrub_mw, 'CITY_bedshrub_%03d' % k, p.xy, rng.uniform(0, 6.28), rng.uniform(0.28, 0.45))
for k in range(140):                                                  # shrubs around the plot edge
    a_ = rng.uniform(0, 2 * math.pi); r_ = rng.uniform(RING_R[1] + 3, RING_R[1] + 12)
    p = RING_C + Vector((math.cos(a_), math.sin(a_))) * r_
    if p.y > RING_C.y + 10 and abs(p.x - RING_C.x) < RING_R[1] + 14: continue
    plant(shrub_data, shrub_mw, 'CITY_shrub_%03d' % k, p, rng.uniform(0, 6.28), rng.uniform(1.2, 2.0))
print('CITY trees %d, palms %d, shrubs 140' % (nt, npalm), flush=True)

# ---- haze: a low volume layer (0-160 m) fading to the horizon sky colour (sky.py stop 0 deg = (0.23, 0.30, 0.47))
hm, N, L, _ = node_mat('MAT_city_haze')
for n in list(N):
    if n.type != 'OUTPUT_MATERIAL': N.remove(n)
v = N.new('ShaderNodeVolumePrincipled'); v.inputs['Density'].default_value = 0.0003
v.inputs['Color'].default_value = (0.62, 0.68, 0.80, 1); v.inputs['Anisotropy'].default_value = 0.35
v.inputs['Emission Strength'].default_value = 0.0003
# v022 QA: the haze takes the horizon sky colour by direction: warm peach toward the sunset (sky.py glow_dir, Blender
# (-0.087, 0.996)), the dusk blue elsewhere, so the low band behind the city stays warm on both sides of the tower
hg = N.new('ShaderNodeNewGeometry'); hs = N.new('ShaderNodeVectorMath'); hs.operation = 'SUBTRACT'
L.new(hg.outputs['Position'], hs.inputs[0]); hs.inputs[1].default_value = (CAM.x, CAM.y, CAM.z)
hm_ = N.new('ShaderNodeVectorMath'); hm_.operation = 'MULTIPLY'; L.new(hs.outputs[0], hm_.inputs[0]); hm_.inputs[1].default_value = (1, 1, 0)
hn = N.new('ShaderNodeVectorMath'); hn.operation = 'NORMALIZE'; L.new(hm_.outputs[0], hn.inputs[0])
hd = N.new('ShaderNodeVectorMath'); hd.operation = 'DOT_PRODUCT'; L.new(hn.outputs[0], hd.inputs[0]); hd.inputs[1].default_value = (-0.087, 0.996, 0)
hp = N.new('ShaderNodeMath'); hp.operation = 'POWER'; hp.use_clamp = True; L.new(hd.outputs['Value'], hp.inputs[0]); hp.inputs[1].default_value = 3.0
hc = N.new('ShaderNodeMix'); hc.data_type = 'RGBA'; L.new(hp.outputs[0], hc.inputs['Factor'])
hc.inputs['A'].default_value = (0.23, 0.30, 0.47, 1); hc.inputs['B'].default_value = (0.95, 0.52, 0.28, 1)
L.new(hc.outputs['Result'], v.inputs['Emission Color'])
L.new(v.outputs[0], next(n for n in N if n.type == 'OUTPUT_MATERIAL').inputs['Volume'])
hz = bmesh.new(); bmesh.ops.create_cube(hz, size=1.0)
for vv in hz.verts: vv.co = Vector((vv.co.x * 7000, vv.co.y * 7000, vv.co.z * 160 + 79))
bm_obj('CITY_haze', hz, hm)

# ---- CITY_live: the near ring of low blocks for the GLB (one instanced unit box, MAT_city_ring), hidden from render
def ring_tex():
    n = 256; img = np.zeros((n, n, 4), np.float32); img[..., 3] = 1
    yy, xx = np.mgrid[0:n, 0:n] / n
    plaster = np.array([0.46, 0.43, 0.39]); img[..., :3] = plaster
    fu, fz = (xx * 8) % 1, (yy * 4) % 1
    win = (fu > 0.22) & (fu < 0.78) & (fz > 0.3) & (fz < 0.78)
    r = np.random.default_rng(7).random((4, 8)).repeat(n // 4, 0).repeat(n // 8, 1)
    img[win] = [0.05, 0.055, 0.06, 1]
    lit = win & (r < 0.18); img[lit] = [1.0, 0.68, 0.38, 1]
    path = os.path.join(TEX, 'tex_city_ring.png')
    im = bpy.data.images.new('tex_city_ring', n, n); im.pixels.foreach_set(img[::-1].ravel()); im.filepath_raw = path; im.file_format = 'PNG'; im.save()
    bpy.data.images.remove(im); return bpy.data.images.load(path)
rt = ring_tex()
rm, N, L, b = node_mat('MAT_city_ring')                               # unlit (KHR_materials_unlit via Mix(alpha 1,
for n in list(N):                                                     # Transparent, colour)): the ring shows the
    if n.type != 'OUTPUT_MATERIAL': N.remove(n)                       # same baked tone as the card (bake_city_band.py
t = N.new('ShaderNodeTexImage'); t.image = rt                         # re-tones tex_city_ring from the band)
tr_ = N.new('ShaderNodeBsdfTransparent'); mx_ = N.new('ShaderNodeMixShader')     # opaque: the exporter's light-path
lp_ = N.new('ShaderNodeLightPath'); L.new(lp_.outputs['Is Camera Ray'], mx_.inputs['Fac'])   # unlit pattern (an alpha-1 mix
L.new(tr_.outputs[0], mx_.inputs[1]); L.new(t.outputs['Color'], mx_.inputs[2])               # lost the texture on export)
L.new(mx_.outputs[0], next(n for n in N if n.type == 'OUTPUT_MATERIAL').inputs['Surface'])
ub = bmesh.new(); add_box(ub, -0.5, -0.5, 0.0, 0.5, 0.5, 1.0, bottom=False)
uvl = ub.loops.layers.uv.new('UVMap')
for f in ub.faces:
    n_ = f.normal
    for l in f.loops:
        p = l.vert.co
        l[uvl].uv = ((p.x + p.y + 1) * 0.5 if abs(n_.z) < 0.5 else 0.0, p.z if abs(n_.z) < 0.5 else 0.02)
ring_me = bpy.data.meshes.new('CITY_ring_box'); ub.to_mesh(ring_me); ub.free(); ring_me.materials.append(rm)
ring_parent = bpy.data.objects.new('CITY_inst_ring', None); LIVE.objects.link(ring_parent); ring_parent.parent = ROOT
k = 0; tries = 0
while k < 34 and tries < 3000:
    tries += 1
    a_ = rng.uniform(0, 2 * math.pi); r_ = rng.uniform(150, 228)
    p = PLOT_C + Vector((math.cos(a_), math.sin(a_))) * r_
    if any(abs(p.x - x) < width(x) / 2 + 10 for x in XL) or any(abs(p.y - y) < width(y) / 2 + 10 for y in YL): continue
    if (p - CAM.xy).length < 60: continue
    o = bpy.data.objects.new('CITY_ring_%02d' % k, ring_me); LIVE.objects.link(o); o.parent = ring_parent
    o.location = (p.x, p.y, GZ); o.rotation_euler = (0, 0, rng.uniform(-0.05, 0.05))
    o.scale = (rng.uniform(14, 30), rng.uniform(14, 30), 3.3 * rng.randint(2, 5) + 0.5)
    o.hide_render = True; k += 1
print('CITY ring blocks %d' % k, flush=True)
bpy.ops.wm.save_mainfile()
print('CITY_DONE %.0fs' % (time.time() - T0), flush=True)
