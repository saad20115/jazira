# Background job: blender -b aljazira_tower.blend -P hot_project.py -- <out.json>
# Corner proof, point 1 of the QA gate: HOT_<s>_1 / HOT_<s>_2 world positions (glTF axes: x, z, -y) and their
# projection through CAM_<s> (square frame, 0-1, origin top-left). The viewer projects the same nodes from the GLB
# and the two are compared. Read-only.
import bpy, sys, json
from bpy_extras.object_utils import world_to_camera_view
out = sys.argv[sys.argv.index('--') + 1:][0]
sc = bpy.context.scene; sc.render.resolution_x = sc.render.resolution_y = 1024
O = bpy.data.objects; res = {}
for s in ('hvac', 'fire', 'plumbing', 'power', 'smart'):
    cam = O['CAM_' + s]
    for n in (1, 2):
        h = O['HOT_%s_%d' % (s, n)]; p = h.matrix_world.translation
        v = world_to_camera_view(sc, cam, p)
        res[h.name] = {'gltf_world': [round(p.x, 3), round(p.z, 3), round(-p.y, 3)],
                       'xy': [round(v.x, 4), round(1 - v.y, 4)]}
json.dump(res, open(out, 'w'), indent=1)
print('HOT_PROJECT_DONE', len(res))
