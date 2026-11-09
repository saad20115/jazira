# Background job: blender -b aljazira_tower.blend -P render_workbench_view.py -- <out.png> <eye x,y,z> <target x,y,z> [lens] [res]
# Clay (Workbench, studio light, cavity) view of the architecture from a temporary camera: form review only.
import bpy, sys
from mathutils import Vector
args = sys.argv[sys.argv.index('--') + 1:]
out = args[0]
eye = Vector([float(v) for v in args[1].split(',')]); tgt = Vector([float(v) for v in args[2].split(',')])
lens = float(args[3]) if len(args) > 3 else 35.0; res = int(args[4]) if len(args) > 4 else 1400
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sh = sc.display.shading
sh.light = 'STUDIO'; sh.color_type = 'MATERIAL'; sh.show_cavity = True; sh.show_shadows = True
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
for c in bpy.data.collections:
    keep = c.name.startswith(('ARCH_', 'SYS_')) or c.name == 'SITE'
    for o in c.objects: o.hide_render = not keep or o.name.startswith('SITE_ground')
cd = bpy.data.cameras.new('WB_cam'); cd.lens = lens; cd.clip_end = 5000
cam = bpy.data.objects.new('WB_cam', cd); sc.collection.objects.link(cam)
cam.location = eye; cam.rotation_mode = 'QUATERNION'; cam.rotation_quaternion = (tgt - eye).to_track_quat('-Z', 'Y')
sc.camera = cam
sc.render.resolution_x = sc.render.resolution_y = res; sc.render.resolution_percentage = 100
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print('WB', out)
