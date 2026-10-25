# Background job: blender -b aljazira_tower.blend -P aim_search.py -- <system> [min_in_frame]
# Searches entry views for CAM_<system>: an anchor counts only if it is in frame (6 % margin) AND the
# sight line to it is not blocked by opaque geometry (facade, slabs/core and the system itself are see-through).
import bpy, sys, math
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
args = sys.argv[sys.argv.index('--') + 1:]
s = args[0]; need = int(args[1]) if len(args) > 1 else 4
O = bpy.data.objects; sc = bpy.context.scene; dg = bpy.context.evaluated_depsgraph_get()
see_through = {o.name for c in ('ARCH_facade', 'ARCH_core', 'SYS_' + s) for o in bpy.data.collections[c].objects}
hots = [O[n].matrix_world.translation.copy() for n in sorted(o.name for o in O if o.name.startswith('HOT_%s_' % s))]
cam = O['CAM_' + s]; cam.rotation_mode = 'QUATERNION'

def visible(eye, p):
    d = p - eye; L = d.length; d.normalize(); start = eye.copy()
    while True:
        ok, loc, n, i, ob, m = sc.ray_cast(dg, start, d, distance=L - (start - eye).length - 0.3)
        if not ok: return True
        if ob.name not in see_through: return False
        start = loc + d * 0.05

def score(eye, piv, lens, margin=0.06):
    cam.location = eye; cam.rotation_quaternion = (piv - eye).to_track_quat('-Z', 'Y'); cam.data.lens = lens
    bpy.context.view_layer.update(); n = 0
    for h in hots:
        v = world_to_camera_view(sc, cam, h)
        if margin <= v.x <= 1 - margin and margin <= v.y <= 1 - margin and v.z > 0 and visible(eye, h): n += 1
    return n

centre = sum(hots, Vector()) / len(hots)
res = []
for piv in (centre, centre.lerp(hots[0], 0.5), Vector((centre.x, centre.y, min(centre.z, 12)))):
    for az in range(0, 360, 15):
        for el in (6, 12, 18, 26, 34):
            for dist in (40, 55, 70, 85):
                for lens in (24, 28):
                    a, e = math.radians(az), math.radians(el)
                    eye = piv + Vector((math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e))) * dist
                    if eye.z < 3: continue
                    n = score(eye, piv, lens)
                    if n >= need: res.append((n, -dist, el, az, lens, tuple(round(c, 1) for c in piv), tuple(round(c, 1) for c in eye)))
res.sort(reverse=True)
print('AIM', s, len(res))
for r in res[:10]: print('AIM', r)
low = sorted([r for r in res if r[2] <= 18], key=lambda r: (-r[1], -r[0]))   # closest low views first
for r in low[:8]: print('AIM_LOW', r)
