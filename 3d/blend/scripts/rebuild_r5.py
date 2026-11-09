# Background job: blender -b aljazira_tower.blend -P rebuild_r5.py -- <increment_name>
# R5 (tower-only scope) rebuild on the existing master: textures -> architecture -> site (no city; fading ground
# disc; plot-only palms / lamps / ring trails) -> MEP (system geometry) -> materials -> view rig (CAM / PIVOT / PATH /
# HOT from build_views.SYSTEMS) -> AO bake, then save the master and a copy as blend\<increment_name>.blend.
import bpy, sys, time
S = r'C:\aljazira-3d\blend\scripts'
args = sys.argv[sys.argv.index('--') + 1:]
t0 = time.time()
for step in ('build_textures', 'build_arch', 'build_site', 'build_mep', 'build_materials', 'build_views', 'build_studio', 'bake_ao'):   # v022: + studio maquette
    t = time.time()
    exec(open(S + '\\' + step + '.py', encoding='utf-8').read())
    print('STEP %s %.1fs' % (step, time.time() - t), flush=True)
exec(open(S + r'\render_setup.py', encoding='utf-8').read())
setup_world(1.0)                                     # the saved file carries the R5 world (sky.py)
for w in [w for w in bpy.data.worlds if w.users == 0]: bpy.data.worlds.remove(w)
for im in bpy.data.images:
    if im.name.startswith('LM_') and im.is_dirty: im.save()
    if im.users == 0: bpy.data.images.remove(im)
bpy.ops.wm.save_mainfile()
if args:
    bpy.ops.wm.save_as_mainfile(filepath=r'C:\aljazira-3d\blend\%s.blend' % args[0], copy=True)
print('REBUILD_DONE %.1fs' % (time.time() - t0), flush=True)
