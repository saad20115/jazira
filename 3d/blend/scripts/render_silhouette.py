# Background job: blender -b aljazira_tower.blend -P render_silhouette.py -- <out.png> [res]
# Flat white architecture on black from CAM_hero (Workbench), for edge_overlay.ps1 against ref\tower-render.png.
import bpy, sys
args = sys.argv[sys.argv.index('--') + 1:]
out = args[0]; res = int(args[1]) if len(args) > 1 else 1024
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sh = sc.display.shading
sh.light = 'FLAT'; sh.color_type = 'SINGLE'; sh.single_color = (1, 1, 1); sh.background_type = 'VIEWPORT'
sh.background_color = (0, 0, 0); sh.show_shadows = False; sh.show_cavity = False; sh.show_object_outline = False
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
for c in bpy.data.collections:
    keep = c.name.startswith('ARCH_') or c.name in ('CAMERAS',)
    for o in c.objects: o.hide_render = not keep
sc.camera = bpy.data.objects['CAM_hero']
sc.render.resolution_x = sc.render.resolution_y = res; sc.render.resolution_percentage = 100
sc.render.film_transparent = False
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print('SILHOUETTE', out)
