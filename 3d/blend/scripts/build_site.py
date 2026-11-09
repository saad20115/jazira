# SITE: the plot only (R5, tower-only scope): ring road + plaza + forecourt, ground disc that fades out, palms,
# lamps. No city: the CONTEXT collection is deleted; the sky is the world gradient (sky.py), not geometry.
exec(open(r'C:\aljazira-3d\blend\scripts\lib.py').read())
import random

GZ = -0.6                       # plaza / street level (top of plinth is 0.0)
RING_C = (4.0, -40.0)           # ring road centre, fitted to the light-trail circle in tower-render.png
RING_R = (44.0, 56.0)           # inner / outer road edge
# v022 maquette variant "full ring" (AJ_RING=full, QA / owner choice pending): a closed roundabout round the tower and
# the plaza, centred near the tower so the turntable axis passes through the model: plinth (maquette) on the same centre
FULL_RING = __import__("os").environ.get("AJ_RING", "full") == "full"   # v022 owner: the full ring is the default (AJ_RING=u: the old U)
if FULL_RING: RING_C, RING_R = (-1.2, -3.9), (70.0, 82.0)   # owner: tower at the disc centre (footprint centre), ring concentric
PLOT_C = (0.0, -25.0)           # plot centre (tower + ring)
GROUND_R = (205.0, 240.0)       # ground disc: opaque to 205 m, vertex alpha falls to 0 at 240 m (v022: carries the baked city
                                # ground in the live model, bake_city_ground.py; v021: 95 / 140)
GROUND_COL = (0.40, 0.43, 0.50)   # sRGB (the Col byte layer stores sRGB): dusk blue-grey (v021 N-5), carried with the fade alpha
ASPHALT_COL = (0.26, 0.27, 0.29)   # sRGB #42454A (v021 N-5; was #2A2C30) (MAT_asphalt is white x Col, so the arms can fade out)

def ring_pts(r, a0, a1, n):
    return [(RING_C[0] + r*math.cos(math.radians(a0 + (a1-a0)*i/n)),
             RING_C[1] + r*math.sin(math.radians(a0 + (a1-a0)*i/n))) for i in range(n+1)]

# ---- R5: remove the city (CONTEXT collection, its root empty) and the old city-lights ground
for name in ('CTX_blocks', 'CTX_skydome', 'CTX_skyline', 'CTX_sea', 'SITE_ground'):
    replace(name)
if 'CONTEXT' in bpy.data.collections:
    c = bpy.data.collections['CONTEXT']
    for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.collections.remove(c)
replace('CONTEXT')

def f_ground(bm):
    """Concentric rings around PLOT_C; per-loop colour 'Col' = (GROUND_COL, alpha) with a smoothstep falloff."""
    col = bm.loops.layers.color.new('Col')
    radii = [0.0, 40.0, 80.0, 120.0, 160.0, GROUND_R[0], 215.0, 225.0, GROUND_R[1]]
    seg = 64
    def alpha(r):
        t = min(1.0, max(0.0, (r - GROUND_R[0]) / (GROUND_R[1] - GROUND_R[0])))
        return 1.0 - t * t * (3 - 2 * t)
    rings = [[bm.verts.new((PLOT_C[0] + r * math.cos(2 * math.pi * i / seg), PLOT_C[1] + r * math.sin(2 * math.pi * i / seg),
                            GZ - 0.15)) for i in range(seg)] if r > 0 else None for r in radii]
    centre = bm.verts.new((PLOT_C[0], PLOT_C[1], GZ - 0.15))   # 13 cm under the roads: no depth fight at hero distance
    for k in range(len(radii) - 1):
        for i in range(seg):
            j = (i + 1) % seg
            vs = [centre, rings[1][i], rings[1][j]] if k == 0 else [rings[k][i], rings[k + 1][i], rings[k + 1][j], rings[k][j]]
            if k > 0: vs = vs[::-1]
            f = bm.faces.new(vs if k == 0 else vs)
            f.normal_update()                    # (a new face has no normal yet: without this the disc faced down,
            if f.normal.z < 0: f.normal_flip()   #  which three.js culls; Cycles drew it anyway)
            for l in f.loops:
                r = math.hypot(l.vert.co.x - PLOT_C[0], l.vert.co.y - PLOT_C[1])
                l[col] = (*GROUND_COL, alpha(r))
if not FULL_RING: build('SITE_ground', 'SITE', f_ground)   # v022 maquette: the plinth top is the ground (no fade disc)

def f_roads(bm):
    # ring arc around the front of the tower (180 deg -> 360 deg), road surface 12 m wide, faces up. Colour + alpha
    # in 'Col' (MAT_asphalt is white x Col): the ring is solid, its two arms fade out northwards instead of ending in
    # a hard dark rectangle (corner proof L-5)
    col = bm.loops.layers.color.new('Col')
    def quad(ps, alphas):
        f = bm.faces.new([bm.verts.new((x, y, GZ - 0.02)) for x, y in ps]); f.normal_update()
        if f.normal.z < 0: f.normal_flip()
        for l in f.loops:
            k = min(range(4), key=lambda i: (ps[i][0] - l.vert.co.x) ** 2 + (ps[i][1] - l.vert.co.y) ** 2)
            l[col] = (*ASPHALT_COL, alphas[k])
    a0_, a1_, n_ = (0, 360, 72) if FULL_RING else (180, 360, 36)
    inner = ring_pts(RING_R[0], a0_, a1_, n_); outer = ring_pts(RING_R[1], a0_, a1_, n_)
    for i in range(n_):
        quad([inner[i], outer[i], outer[i+1], inner[i+1]], [1.0] * 4)
    def fade(y):                                   # v022 maquette: the arms run solid to the plinth edge (no fade-out)
        return 1.0
    xl0, xl1 = RING_C[0] - RING_R[1], RING_C[0] - RING_R[0]
    xr0, xr1 = RING_C[0] + RING_R[0], RING_C[0] + RING_R[1]
    ys = [RING_C[1] + 4.0 * k for k in range(18)]   # v022 maquette: up to y = 28, the plinth edge (PL_R 78 round (4, -25))
    for x0, x1 in ([] if FULL_RING else [(xl0, xl1), (xr0, xr1)]):   # the arms only on the U
        for ya, yb in zip(ys, ys[1:]):
            quad([(x0, ya), (x1, ya), (x1, yb), (x0, yb)], [fade(ya), fade(ya), fade(yb), fade(yb)])
build('SITE_roads', 'SITE', f_roads)

# R5 corner revision: the forecourt walk runs out from the lobby corner along its diagonal (the tower is turned,
# lib.py), so the islands, the walk lamps and the gap in the inner palm ring are laid out on that axis:
# fc(a, s) = a metres out from the corner along the diagonal, s metres to its side.
FC_O = to_world((21.0, -18.0)); FC_U = (to_world((1.0, -1.0)) - to_world((0.0, 0.0))).normalized()
FC_V = Vector((-FC_U.y, FC_U.x, 0.0))
def fc(a, s):
    p = FC_O + FC_U * a + FC_V * s; return (p.x, p.y)
def fc_of(x, y):
    d = Vector((x, y, 0.0)) - FC_O; return d.dot(FC_U), d.dot(FC_V)
ISLANDS = ([fc(16, -15), fc(16, 15), fc(28, -10), fc(28, 10)] if FULL_RING      # full ring: pulled in to clear the ring
           else [fc(20, -16), fc(20, 16), fc(36, -11), fc(36, 11)])
_g = Vector(fc(49, 0)) - Vector(RING_C)
AV_ANG = math.degrees(math.atan2(_g.y, _g.x)) % 360     # where the walk crosses the inner palm ring
def f_plaza(bm):
    poly_slab(bm, ring_pts(RING_R[0] - 0.5, 0, 360, 48)[:-1], GZ - 0.04, GZ)
build('SITE_plaza', 'SITE', f_plaza)

def f_planting(bm):
    # planted islands (low kerbed beds) either side of the entrance walk. v022 (realism B): organic outlines (two
    # low harmonics per bed) instead of perfect ellipses, plus a narrow bed along the inner edge of the ring
    for i, (cx, cy) in enumerate(ISLANDS):
        r_ = random.Random(40 + i); p1, p2 = r_.uniform(0, 6.28), r_.uniform(0, 6.28)
        poly_slab(bm, [(cx + 7.5 * (1 + 0.16 * math.sin(2 * t + p1) + 0.08 * math.sin(3 * t + p2)) * math.cos(t),
                        cy + 5.2 * (1 + 0.16 * math.sin(2 * t + p1) + 0.08 * math.sin(3 * t + p2)) * math.sin(t))
                       for t in [k * math.pi / 12 for k in range(24)]], GZ, GZ + 0.45)
    if FULL_RING:                                                # owner: a garden all round inside the ring (the ref):
        a = AV_ANG + 50                                          # lawn beds between the tower and the inner palm ring,
        while a < AV_ANG + 310:                                  # paths every ~40 deg, the front sector (walk + islands)
            a1 = min(a + 36, AV_ANG + 310)                       # left as plaza
            o = ring_pts(RING_R[0] - 2.5, a, a1, 12); n = ring_pts(48.0, a, a1, 12)
            poly_slab(bm, o + n[::-1], GZ, GZ + 0.3)
            a = a1 + 5
    else:
        for a0, a1 in ((196, 250), (290, 344)):                  # inner verge beds, clear of the walk
            o = ring_pts(RING_R[0] - 1.0, a0, a1, 18); n = ring_pts(RING_R[0] - 3.4, a0, a1, 18)
            poly_slab(bm, o + n[::-1], GZ, GZ + 0.3)
build('SITE_planting', 'SITE', f_planting)

# v022 (realism B): the stills-only city (build_city.py, run after the bakes) is rebuilt every chain: drop it here so
# the bakes never see it
if 'CITY' in bpy.data.collections:
    for o in list(bpy.data.collections['CITY'].all_objects): bpy.data.objects.remove(o, do_unlink=True)
    for c in list(bpy.data.collections['CITY'].children_recursive): bpy.data.collections.remove(c)
    bpy.data.collections.remove(bpy.data.collections['CITY'])

def inside_building(x, y, m=3.0):                # the plinth, in the tower plan frame (the tower is turned, lib.py)
    p = to_local((x, y))
    return -37.5 - m < p.x < 27 + m and -24 - m < p.y < 24 + m

def in_plot(x, y, r=None):                       # nothing tall near the ground fade (it would float against the sky)
    r = r if r is not None else (RING_R[1] + 6.0 if FULL_RING else 55.0)   # full ring: the whole plinth
    return math.hypot(x - PLOT_C[0], y - PLOT_C[1]) < r

# ---- light trails (ring only), instanced palms / trees / lamps, lamp point lights
exec(open(r'C:\aljazira-3d\blend\scripts\build_site_detail.py', encoding='utf-8').read())
