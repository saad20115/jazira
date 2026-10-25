# Workbench clay render settings + still/animation helpers.
import bpy

def setup_workbench(res=1024):
    sc = bpy.context.scene
    try:
        sc.render.engine = 'BLENDER_WORKBENCH'
    except TypeError as e:
        print('engine error', e)
    sh = sc.display.shading
    sh.light = 'STUDIO'
    sh.color_type = 'OBJECT'
    sh.show_cavity = True
    sh.cavity_type = 'WORLD'
    sh.show_shadows = True
    sh.show_object_outline = False
    sh.background_type = 'WORLD' if hasattr(sh, 'background_type') else sh.background_type
    sc.display.shadow_focus = 0.5
    sc.render.resolution_x = res; sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGB'
    sc.display_settings.display_device = sc.display_settings.display_device
    sc.view_settings.view_transform = 'Standard'
    if sc.world is None:
        sc.world = bpy.data.worlds.new('World')
    sc.world.color = (0.72, 0.75, 0.8)

def still(path, cam=None, frame=None, res=1024):
    sc = bpy.context.scene
    setup_workbench(res)
    if cam: sc.camera = bpy.data.objects[cam]
    if frame is not None: sc.frame_set(frame)
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
