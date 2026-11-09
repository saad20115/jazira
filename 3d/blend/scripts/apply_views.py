# Background job: blender -b aljazira_tower.blend -P apply_views.py -- [increment_name]
# Re-runs build_views.py (cameras, pivots, HOT_/PATH_ empties, enter extras) on the master and saves it.
import bpy, sys
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
exec(open(r'C:\aljazira-3d\blend\scripts\build_views.py', encoding='utf-8').read())
bpy.ops.wm.save_mainfile()
if args:
    bpy.ops.wm.save_as_mainfile(filepath=r'C:\aljazira-3d\blend\%s.blend' % args[0], copy=True)
print('VIEWS_DONE', flush=True)
