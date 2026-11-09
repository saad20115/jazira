# Background job: blender -b aljazira_tower.blend -P entry_search.py -- [systems]
# R5 entry framing: for each system, search CAM_<s> / PIVOT_<s> so that, in the entered state (facade and other
# systems faded, section cut), >= 3 HOT anchors are in frame (8 % margin) and the system FILLS >= 30 % of the frame:
# coverage = share of a 20 x 20 screen grid hit by points sampled over the system's surfaces (area-weighted).
# Prints the best candidates; build_views.py SYSTEMS takes the chosen pivot / eye / lens.
import bpy, sys, math, random, itertools
exec(open(r"C:\aljazira-3d\blend\scripts\lib.py").read())   # to_local(): the tower is turned (corner revision)
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
systems = args[0].split(',') if args else ['hvac', 'fire', 'plumbing', 'power', 'smart']
O = bpy.data.objects; sc = bpy.context.scene
sc.render.resolution_x = sc.render.resolution_y = 1000
dg = bpy.context.evaluated_depsgraph_get()
rng = random.Random(1)
hero_dir = (O['CAM_hero'].matrix_world.translation - O['PIVOT_hero'].matrix_world.translation); hero_dir.z = 0; hero_dir.normalize()
# QA (real-equipment phase): hvac pulled back so the roof edge, crown and tower top frame the plant; smart not
# from ground level
DMIN = {"hvac": 48}
EL = {"smart": (26, 34, 42, 50)}
# smart: the pivot sits on the data room (QA: a 180 deg orbit about the pivot must keep the system >= 25 % of the frame)
PIV = {"smart": [(-27.5, 10.5, 6.3)]}

def samples(s, n=1500):
    tris = []
    for o in bpy.data.collections['SYS_' + s].objects:
        if o.type != 'MESH': continue
        me = o.evaluated_get(dg).to_mesh(); me.calc_loop_triangles(); mw = o.matrix_world
        for t in me.loop_triangles:
            a, b, c = (mw @ me.vertices[i].co for i in t.vertices)
            tris.append((a, b, c, ((b - a).cross(c - a)).length / 2))
        o.evaluated_get(dg).to_mesh_clear()
    tot = sum(t[3] for t in tris); pts = []
    for a, b, c, ar in tris:
        k = ar / tot * n; m = int(k) + (1 if rng.random() < k - int(k) else 0)
        for _ in range(m):
            u, v = rng.random(), rng.random()
            if u + v > 1: u, v = 1 - u, 1 - v
            pts.append(a + (b - a) * u + (c - a) * v)
    return pts

def inside_building(p):
    q = to_local(p)
    return -38 < q.x < 28 and -25 < q.y < 25 and q.z < 92

cam = bpy.data.objects.new('ES_cam', bpy.data.cameras.new('ES_cam')); sc.collection.objects.link(cam)
cam.data.sensor_fit = 'HORIZONTAL'; cam.data.sensor_width = 36.0; cam.rotation_mode = 'QUATERNION'
for s in systems:
    hots = [(o.get('label', o.name), o.matrix_world.translation.copy()) for o in O if o.name.startswith('HOT_%s_' % s)]
    pts = samples(s)
    pivots = [sum((h[1] for h in hots), Vector()) / len(hots)]
    for combo in itertools.combinations(hots, 3):
        pivots.append(sum((h[1] for h in combo), Vector()) / 3)
    if s in PIV: pivots = [to_world(p) for p in PIV[s]]
    best = []
    for piv in pivots:
        for az in range(0, 360, 30):
            for el in EL.get(s, (10, 18, 26, 34, 42)):
                for dist in range(DMIN.get(s, 18), 106, 10):
                    a, e = math.radians(az), math.radians(el)
                    d = Vector((math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e)))
                    eye = piv + d * dist
                    if eye.z < 3 or inside_building(eye): continue
                    for lens in (24, 32):
                        cam.location = eye; cam.rotation_quaternion = (piv - eye).to_track_quat('-Z', 'Y'); cam.data.lens = lens
                        bpy.context.view_layer.update()
                        n_in = 0
                        for _, h in hots:
                            v = world_to_camera_view(sc, cam, h)
                            n_in += (0.08 <= v.x <= 0.92 and 0.08 <= v.y <= 0.92 and v.z > 0)
                        if n_in < 3: continue
                        cells = set()
                        for p in pts:
                            v = world_to_camera_view(sc, cam, p)
                            if 0 <= v.x < 1 and 0 <= v.y < 1 and v.z > 0: cells.add((int(v.x * 20), int(v.y * 20)))
                        cov = len(cells) / 400.0
                        hd = d.copy(); hd.z = 0; hd.normalize()
                        score = n_in + 3.0 * min(cov, 0.45) - 0.002 * dist + 0.2 * max(0.0, hd.dot(hero_dir))
                        best.append((round(score, 3), n_in, round(cov, 3), dist, el, az, lens,
                                     tuple(round(c, 1) for c in to_local(piv)), tuple(round(c, 1) for c in to_local(eye))))   # tower frame (build_views)
    best.sort(reverse=True)
    ok = [b for b in best if b[2] >= 0.30]
    if not ok:                                   # nothing reaches 30 %: show the best coverage with >= 3 anchors
        for b in sorted([b for b in best if b[1] >= 3], key=lambda b: -b[2])[:4]: print("ENTRY_COV", s, b)
    print('ENTRY %s candidates %d, with coverage >= 0.30: %d' % (s, len(best), len(ok)))
    for b in (ok or best)[:6]: print('ENTRY', s, b)
