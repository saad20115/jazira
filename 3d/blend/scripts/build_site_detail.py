# R3b site detail, exec'd at the end of build_site.py (uses its GZ, RING_C, RING_R, ring_pts, inside_building).
# - SITE_trails_white / SITE_trails_red: static emissive light-trail streaks (long-exposure look of the ref).
# - Vegetation: 3 variant meshes (palm A, palm B, broadleaf tree C) with vertex colours and one material,
#   placed as linked duplicates under SITE_inst_<variant> empties -> exported with EXT_mesh_gpu_instancing.
# - Lamps: pole + head meshes instanced the same way, plus warm point lights in LIGHTS (offline render only).
import random

for o in [o for o in bpy.data.objects if o.name.startswith(('SITE_palm', 'SITE_lamp', 'SITE_tree', 'SITE_inst_', 'SITE_bollard', 'LGT_bollard_',
                                                           'SITE_trails', 'LGT_lamp_'))]:
    bpy.data.objects.remove(o, do_unlink=True)
for m in [m for m in bpy.data.meshes if m.users == 0]:
    bpy.data.meshes.remove(m)

# ---------------- light trails
def ribbon(bm, pts, z, w):
    """'Plus'-profile ribbon along a 3D polyline (horizontal + vertical strip), visible from any angle."""
    for k in range(len(pts) - 1):
        a, b = Vector((*pts[k], z)), Vector((*pts[k + 1], z))
        d = (b - a).normalized(); side = Vector((-d.y, d.x, 0)) * (w / 2); up = Vector((0, 0, w / 2))
        for off in (side, up):
            bm.faces.new([bm.verts.new(a - off), bm.verts.new(b - off), bm.verts.new(b + off), bm.verts.new(a + off)])

def arc_streaks(bm, r, rng, cover=0.7):
    a = 180.0
    while a < 360.0:
        span = rng.uniform(25, 80)
        if rng.random() < cover:
            a1 = min(360.0, a + span)
            n = max(2, int((a1 - a) / 3))
            ribbon(bm, ring_pts(r, a, a1, n), GZ + rng.uniform(0.55, 0.85), rng.uniform(0.12, 0.22))
        a += span + rng.uniform(4, 18)

def line_streaks(bm, x, y0, y1, rng, cover=0.7):
    y = y0
    while y < y1:
        L = rng.uniform(30, 120)
        if rng.random() < cover:
            ribbon(bm, [(x, y), (x, min(y1, y + L))], GZ + rng.uniform(0.55, 0.85), rng.uniform(0.12, 0.22))
        y += L + rng.uniform(5, 25)

rng = random.Random(5)
def f_trails_white(bm):                       # headlights: inner lanes of the ring (R5: ring only)
    for r in (45.0, 46.2, 47.4, 48.6, 49.6):
        arc_streaks(bm, r, rng, 0.8)
def f_trails_red(bm):                         # tail lights: outer lanes of the ring (R5: ring only)
    for r in (52.4, 54.2):
        arc_streaks(bm, r, rng, 0.45)
if not FULL_RING:                             # v022 maquette (daylight): no light trails (a night effect)
    build('SITE_trails_white', 'SITE', f_trails_white)
    build('SITE_trails_red', 'SITE', f_trails_red)

# ---------------- vegetation variant meshes (vertex colours, built at the origin, base at z = 0)
TRUNK, TRUNK_DARK = (0.30, 0.22, 0.15, 1), (0.22, 0.16, 0.11, 1)
LEAF = [(0.16, 0.30, 0.12, 1), (0.20, 0.36, 0.14, 1), (0.13, 0.25, 0.10, 1)]

def colour_faces(bm, faces, col, layer):
    for f in faces:
        for l in f.loops: l[layer] = col

# v022 (realism C): textured palms on tex_vegetation (build_textures.vegetation(), MAT_vegetation alpha MASK).
# The trunk is a tapered, slightly curved 8-sided tube with a swollen base and a boot of old frond stubs under the
# crown; each frond is a V-folded strip (two halves 25 deg up from the rachis) that arches out and droops, carrying
# the pinnate leaflet picture of the atlas, plus a few young upright fronds and dead hanging ones. UVs: trunk u 0..0.125,
# fronds u 0.25..1 (v crown -> tip), canopy u 0.125..0.25.
U_BARK, U_LEAF, U_FROND = (0.005, 0.12), (0.13, 0.245), (0.255, 0.995)

def palm_mesh(name, h, lean, n_fronds, frond_len, seed):
    rnd = random.Random(seed)
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap')
    def face(vs, uvs):
        f = bm.faces.new(vs)
        for l, t in zip(f.loops, uvs): l[uv].uv = t
        return f
    seg, rings = 8, 10
    centres = [Vector((lean * (k / rings) ** 2, 0.15 * lean * math.sin(3 * k / rings), h * k / rings)) for k in range(rings + 1)]
    radii = [0.42 if k == 0 else 0.30 - 0.08 * k / rings for k in range(rings + 1)]
    vs = [[bm.verts.new(c + Vector((r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), 0)))
           for i in range(seg)] for c, r in zip(centres, radii)]
    for k in range(rings):
        for i in range(seg):
            j = (i + 1) % seg
            u0 = U_BARK[0] + (U_BARK[1] - U_BARK[0]) * i / seg; u1 = U_BARK[0] + (U_BARK[1] - U_BARK[0]) * (i + 1) / seg
            face([vs[k][i], vs[k][j], vs[k + 1][j], vs[k + 1][i]], [(u0, k / rings), (u1, k / rings), (u1, (k + 1) / rings), (u0, (k + 1) / rings)])
    top = centres[-1] + Vector((0, 0, 0.3))
    def frond(a, elev, droop, L, width):
        d = Vector((math.cos(a), math.sin(a), 0)); s = Vector((-d.y, d.x, 0))
        ts = (0.0, 0.15, 0.32, 0.5, 0.68, 0.84, 1.0)
        pts = [top + d * L * t * math.cos(elev) + Vector((0, 0, L * (t * math.sin(elev) - droop * t * t))) for t in ts]
        fold = math.radians(25)
        for side in (-1, 1):                                          # two halves, V-folded upward
            off = [s * side * width * math.cos(fold) + Vector((0, 0, width * math.sin(fold))) for _ in ts]
            uc = 0.5 * (U_FROND[0] + U_FROND[1]); ue = U_FROND[0] if side < 0 else U_FROND[1]
            for k in range(len(ts) - 1):
                a0, a1 = pts[k], pts[k + 1]
                vv = [bm.verts.new(a0), bm.verts.new(a1), bm.verts.new(a1 + off[k + 1]), bm.verts.new(a0 + off[k])]
                face(vv, [(uc, ts[k]), (uc, ts[k + 1]), (ue, ts[k + 1]), (ue, ts[k])])
    for n in range(n_fronds):                                         # main crown
        frond(2 * math.pi * n / n_fronds + rnd.uniform(-0.25, 0.25), math.radians(rnd.uniform(20, 45)),
              rnd.uniform(0.75, 1.05), frond_len * rnd.uniform(0.85, 1.1), frond_len * 0.24)
    for n in range(3):                                                # young fronds, near upright
        frond(rnd.uniform(0, 2 * math.pi), math.radians(rnd.uniform(60, 75)), 0.3, frond_len * 0.6, frond_len * 0.16)
    for n in range(rnd.randint(1, 3)):                                # dead fronds hanging against the trunk
        frond(rnd.uniform(0, 2 * math.pi), math.radians(-70), 0.0, frond_len * 0.45, frond_len * 0.14)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    return me

def tree_mesh(name):
    bm = bmesh.new()
    add_cyl(bm, 0, 0, 0, 3.2, 0.22, 6)
    for c, r, sq in (((0, 0, 4.6), 2.4, 0.75), ((0.8, 0.4, 5.6), 1.7, 0.8)):
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r,
                                   matrix=Matrix.Translation(c) @ Matrix.Diagonal((1, 1, sq, 1)))
    uv = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:                                                 # trunk -> bark strip, canopy -> mottled greens
        canopy = f.calc_center_median().z > 3.0
        u0, u1 = U_LEAF if canopy else U_BARK
        for l in f.loops:
            p = l.vert.co
            l[uv].uv = (u0 + (u1 - u0) * (0.5 + 0.5 * math.atan2(p.y, p.x) / math.pi), min(1.0, max(0.0, p.z / 8.0)))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    return me

random.seed(9)
VEG = {'palmA': palm_mesh('VEG_palmA', 10.5, 0.5, 13, 4.4, 11),       # tall, gently curved
       'palmB': palm_mesh('VEG_palmB', 7.0, 1.5, 11, 3.8, 12),        # short, leaning
       'palmD': palm_mesh('VEG_palmD', 13.5, 0.9, 15, 4.8, 13),       # tallest (v022)
       'treeC': tree_mesh('VEG_treeC')}

def instances(kind, mesh, positions, scale=(0.85, 1.15)):
    parent = bpy.data.objects.new('SITE_inst_' + kind, None)
    coll('SITE').objects.link(parent); parent.parent = root('SITE'); parent.empty_display_size = 3
    for i, (x, y) in enumerate(positions):
        o = bpy.data.objects.new('SITE_%s_%02d' % (kind, i), mesh)
        coll('SITE').objects.link(o); o.parent = parent
        o.location = (x, y, GZ); o.rotation_euler = (0, 0, random.uniform(0, 2 * math.pi))
        o.scale = (random.uniform(*scale),) * 3
    return parent

def ok(x, y, m=3.0):
    return in_plot(x, y) and not inside_building(x, y, m) and not (abs(fc_of(x, y)[1]) < 9 and fc_of(x, y)[0] > 0)   # keep the walk clear

def off_walk(p, deg):                       # not on the entrance walk's line across the inner palm ring
    return abs((math.degrees(math.atan2(p[1] - RING_C[1], p[0] - RING_C[0])) - AV_ANG + 180) % 360 - 180) > deg
if FULL_RING:                               # v022 owner: the road and the trees wrap the whole building (ref)
    palms_a = [p for p in ring_pts(RING_R[1] + 3.5, 0, 360, 40)[:-1] if ok(*p)] + \
              [p for p in ring_pts(RING_R[0] - 4.0, 0, 360, 32)[:-1] if ok(*p) and off_walk(p, 12)]
else:
    palms_a = [p for p in ring_pts(RING_R[1] + 5, 188, 352, 16) if ok(*p)] + \
              [p for p in ring_pts(RING_R[0] - 5, 196, 344, 10) if ok(*p) and off_walk(p, 15)]
palms_b = [(cx + dx, cy + dy) for cx, cy in ISLANDS for dx, dy in ((-3, 1), (2.5, -1), (0, 2))]
if FULL_RING:                               # garden palms in the lawn beds round the tower
    palms_b += [p for p in ring_pts(57.0, AV_ANG + 58, AV_ANG + 302, 12) if ok(*p)]
trees_c = [(x, y) for x in (-64, 68) for y in range(-24, 60, 14)] + [(x, -112) for x in range(-60, 70, 18) if abs(x) > 12]
if FULL_RING:                               # keep them off the (larger) ring road
    trees_c = [p for p in trees_c if not RING_R[0] - 3 < math.hypot(p[0] - RING_C[0], p[1] - RING_C[1]) < RING_R[1] + 3]
palms_d = palms_a[1::3]; palms_a = [p for p in palms_a if p not in palms_d]   # v022: every third outer-ring palm is the tall variant
instances('palmA', VEG['palmA'], palms_a)
instances('palmB', VEG['palmB'], palms_b)
instances('palmD', VEG['palmD'], palms_d)
instances('treeC', VEG['treeC'], [p for p in trees_c if ok(*p)])

# ---------------- lamps (instanced pole + head) and their offline point lights
def lamp_pole_mesh():
    bm = bmesh.new(); add_cyl(bm, 0, 0, 0, 4.6, 0.1, 6); add_box(bm, -0.05, -0.05, 4.5, 0.6, 0.05, 4.6)
    me = bpy.data.meshes.new('VEG_lamp_pole'); bm.to_mesh(me); bm.free(); return me
def lamp_head_mesh():
    bm = bmesh.new(); add_box(bm, 0.35, -0.22, 4.3, 0.85, 0.22, 4.5)
    me = bpy.data.meshes.new('VEG_lamp_head'); bm.to_mesh(me); bm.free(); return me

LAMPS = [p for p in (ring_pts(RING_R[0] - 2.0, 0, 360, 28)[:-1] if FULL_RING else ring_pts(RING_R[0] - 2.0, 186, 354, 16))
         if ok(*p, 2.0)] + \
        [fc(a, s) for a in ((10, 18, 26, 34) if FULL_RING else (12, 22, 32, 42)) for s in (-8, 8)]
pole_m, head_m = lamp_pole_mesh(), lamp_head_mesh()
random.seed(3)
for kind, mesh in (('lamp_pole', pole_m), ('lamp_head', head_m)):
    p = instances(kind, mesh, LAMPS, (1.0, 1.0))
    for o, (x, y) in zip(sorted(p.children, key=lambda c: c.name), LAMPS):   # arms point towards the plaza centre
        o.rotation_euler = (0, 0, math.atan2(RING_C[1] - y, RING_C[0] - x))
ld = bpy.data.lights.get('LGT_lamp') or bpy.data.lights.new('LGT_lamp', 'POINT')
ld.energy = 1200.0; ld.color = (1.0, 0.78, 0.5); ld.shadow_soft_size = 0.3
for i, (x, y) in enumerate(LAMPS):
    a = math.atan2(RING_C[1] - y, RING_C[0] - x)
    lo = bpy.data.objects.new('LGT_lamp_%02d' % i, ld); coll('LIGHTS').objects.link(lo)
    lo.location = (x + 0.6 * math.cos(a), y + 0.6 * math.sin(a), GZ + 4.2); lo.parent = root('LIGHTS')
    lo.visible_glossy = False          # R5: no lamp highlights in the glass (the live model has no lights: no crossfade jump)
# v022 (realism B): light bollards (0.9 m) lining the entrance walk and the bed edges; instanced body + glowing head,
# with a low warm point light each (offline only, like the lamps)
def bollard_mesh():
    bm = bmesh.new(); add_cyl(bm, 0, 0, 0, 0.75, 0.09, 8)
    me = bpy.data.meshes.new('VEG_bollard'); bm.to_mesh(me); bm.free(); return me
def bollard_head_mesh():
    bm = bmesh.new(); add_cyl(bm, 0, 0, 0.75, 0.9, 0.095, 8)
    me = bpy.data.meshes.new('VEG_bollard_head'); bm.to_mesh(me); bm.free(); return me
BOLLARDS = [fc(a, s) for a in range(6, 37 if FULL_RING else 47, 5) for s in (-3.2, 3.2)]
BOLLARDS = [p for p in BOLLARDS if ok(*p, 1.0) or abs(fc_of(*p)[1]) < 4]
random.seed(4)
instances('bollard', bollard_mesh(), BOLLARDS, (1.0, 1.0))
instances('bollardh', bollard_head_mesh(), BOLLARDS, (1.0, 1.0))
bd = bpy.data.lights.get('LGT_bollard') or bpy.data.lights.new('LGT_bollard', 'POINT')
bd.energy = 40.0; bd.color = (1.0, 0.76, 0.48); bd.shadow_soft_size = 0.1
for i, (x, y) in enumerate(BOLLARDS):
    lo = bpy.data.objects.new('LGT_bollard_%02d' % i, bd); coll('LIGHTS').objects.link(lo)
    lo.location = (x, y, GZ + 0.95); lo.parent = root('LIGHTS'); lo.visible_glossy = False
print('site detail: palmsA %d, palmsB %d, palmsD %d, trees %d, lamps %d, bollards %d'
      % (len(palms_a), len(palms_b), len(palms_d), len(trees_c), len(LAMPS), len(BOLLARDS)))
