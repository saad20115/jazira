# Background job: blender -b aljazira_tower.blend -P render_elevation.py -- <out_dir> [res]
# v018 crown proof: orthographic clay (Workbench) elevations of the two camera faces, square-on to each face (S face
# = left in the hero, E face = right), so a level parapet and planar crown can be checked by eye. Temporary camera.
import bpy, sys, math, os
from mathutils import Vector
exec(open(r'C:\aljazira-3d\blend\scripts\lib.py').read())
args = sys.argv[sys.argv.index('--') + 1:]
out_dir = args[0]; res = int(args[1]) if len(args) > 1 else 1600
os.makedirs(out_dir, exist_ok=True)
sc = bpy.context.scene
try: sc.render.engine = 'BLENDER_WORKBENCH'
except TypeError: sc.render.engine = 'BLENDER_WORKBENCH_NEXT'
sh = sc.display.shading; sh.light = 'STUDIO'; sh.color_type = 'MATERIAL'; sh.show_cavity = True; sh.show_shadows = False
sc.render.film_transparent = False
for o in sc.objects:                                         # tower only: hide the site, systems and lights
    if o.name.startswith(('SITE_', 'SYS_', 'HVAC_', 'FIRE_', 'PLUMB_', 'POWER_', 'SMART_', 'LGT_')): o.hide_render = True
cd = bpy.data.cameras.new('EL_cam'); cd.type = 'ORTHO'; cd.ortho_scale = 100.0
cam = bpy.data.objects.new('EL_cam', cd); sc.collection.objects.link(cam); sc.camera = cam
sc.render.resolution_x = res; sc.render.resolution_y = res; sc.render.resolution_percentage = 100
centre = to_world((0.0, 0.0, 45.0))
for face, n_local in (('S_face_left', (0.0, -1.0)), ('E_face_right', (1.0, 0.0))):
    n = (to_world((n_local[0], n_local[1], 0.0)) - to_world((0.0, 0.0, 0.0))).normalized()
    cam.location = centre + n * 200.0
    cam.rotation_mode = 'QUATERNION'; cam.rotation_quaternion = (-n).to_track_quat('-Z', 'Y')
    sc.render.filepath = os.path.join(out_dir, 'elevation_%s.png' % face)
    bpy.ops.render.render(write_still=True)
    print('ELEVATION', face, sc.render.filepath)
