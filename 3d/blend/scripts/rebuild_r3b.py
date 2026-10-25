# Background job: blender -b aljazira_tower.blend -P rebuild_r3b.py -- <increment_name>
# R3b rebuild of the look on the existing master: textures -> site (+ trails, instanced palms/trees/lamps)
# -> materials -> AO bake, then save the master and a copy as blend\<increment_name>.blend.
import bpy, sys, time
S = r'C:\aljazira-3d\blend\scripts'
args = sys.argv[sys.argv.index('--') + 1:]
t0 = time.time()
for step in ('build_textures', 'build_site', 'build_materials', 'bake_ao'):
    t = time.time()
    exec(open(S + '\\' + step + '.py', encoding='utf-8').read())
    print('STEP %s %.1fs' % (step, time.time() - t), flush=True)
for im in bpy.data.images:
    if im.name.startswith('LM_') and im.is_dirty: im.save()
bpy.ops.wm.save_mainfile()
if args:
    bpy.ops.wm.save_as_mainfile(filepath=r'C:\aljazira-3d\blend\%s.blend' % args[0], copy=True)
print('REBUILD_DONE %.1fs' % (time.time() - t0), flush=True)
