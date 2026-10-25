# Background job: blender -b aljazira_tower.blend -P preview_top.py -- <out_dir>
# Quick owner-confirmation preview of the tower top (no bakes, nothing saved): rebuilds the architecture in memory from
# build_arch.py, then clay (Workbench) views: a 3/4 from above the camera corner, a close 3/4 of the crown, and the
# orthographic S elevation.
import bpy, sys, os, math
args = sys.argv[sys.argv.index('--') + 1:]
out_dir = args[0]; os.makedirs(out_dir, exist_ok=True)
exec(open(r'C:\aljazira-3d\blend\scripts\build_arch.py', encoding='utf-8').read())
exec(open(r'C:\aljazira-3d\blend\scripts\build_materials.py', encoding='utf-8').read())
sc = bpy.context.scene
try: sc.render.engine = 'BLENDER_WORKBENCH'
except TypeError: sc.render.engine = 'BLENDER_WORKBENCH_NEXT'
sh = sc.display.shading; sh.light = 'STUDIO'; sh.color_type = 'MATERIAL'; sh.show_cavity = True; sh.show_shadows = True
for o in sc.objects:
    if o.name.startswith(('SITE_', 'HVAC_', 'FIRE_', 'PLUMB_', 'POWER_', 'SMART_', 'LGT_')): o.hide_render = True
cd = bpy.data.cameras.new('PV_cam'); cam = bpy.data.objects.new('PV_cam', cd); sc.collection.objects.link(cam); sc.camera = cam
sc.render.resolution_x = sc.render.resolution_y = 1400
corner = to_world((CX, CY, 0.0)); diag = (to_world((1.0, -1.0, 0.0)) - to_world((0.0, 0.0, 0.0))).normalized()
def shoot(name, eye, target, lens=35.0, ortho=None):
    if ortho: cd.type = 'ORTHO'; cd.ortho_scale = ortho
    else: cd.type = 'PERSP'; cd.lens = lens
    cam.location = eye; cam.rotation_mode = 'QUATERNION'; cam.rotation_quaternion = (target - eye).to_track_quat('-Z', 'Y')
    sc.render.filepath = os.path.join(out_dir, name); bpy.ops.render.render(write_still=True); print('PREVIEW', name)
top = Vector((corner.x, corner.y, 84.0))
shoot('top_3q_above_corner.png', top + diag * 48 + Vector((0, 0, 38)), to_world((-4.0, -6.0, 82.0)), 35)
shoot('top_3q_close.png', top + diag * 26 + Vector((-6, 0, 14)), to_world((-6.0, -12.0, 82.5)), 35)
n = (to_world((0.0, -1.0, 0.0)) - to_world((0.0, 0.0, 0.0))).normalized()
shoot('elevation_S_face_left.png', to_world((0.0, 0.0, 45.0)) + n * 200, to_world((0.0, 0.0, 45.0)), ortho=100.0)
# close 3/4 views of every inner junction of the gold frame (owner v019b: clean 90 deg stops, nothing crossing)
for name, p, off in (('junction_left_return.png', (-20.2, -15.6, 81.6), (-6.0, -7.0, 4.0)),
                     ('junction_band_east_end.png', (-0.6, -16.8, 81.6), (6.0, -7.0, 4.0)),
                     ('junction_ring_notch_inner.png', (-0.6, -3.6, 88.3), (7.0, -6.0, 3.0)),
                     ('junction_ring_notch_outer.png', (-0.6, -15.5, 88.3), (6.0, -7.0, 3.5))):
    tgt = to_world(p); eye = to_world((p[0] + off[0], p[1] + off[1], p[2] + off[2]))
    shoot(name, eye, tgt, 28)
