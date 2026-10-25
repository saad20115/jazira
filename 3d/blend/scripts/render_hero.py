# Background job: blender -b aljazira_tower.blend -P render_hero.py -- <out.png> [res] [samples]
import bpy, sys, time
exec(open(r'C:\aljazira-3d\blend\scripts\render_setup.py', encoding='utf-8').read())
args = sys.argv[sys.argv.index('--') + 1:]
out = args[0]; res = int(args[1]) if len(args) > 1 else 2048; spp = int(args[2]) if len(args) > 2 else 256
setup_world(1.0); setup_cycles(res, spp, 0.02); apply_render_overrides()
sc = bpy.context.scene; sc.camera = bpy.data.objects['CAM_hero']; sc.frame_set(1)
sc.render.filepath = out
t = time.time(); bpy.ops.render.render(write_still=True)
print('RENDER_SECONDS %.1f' % (time.time() - t), flush=True)
