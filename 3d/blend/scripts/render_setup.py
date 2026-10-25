# Cycles look-dev setup (render-time only parts are applied by apply_render_overrides()).
import bpy, math

def setup_world(strength=1.0):
    """R5: the dusk gradient world from sky.py (same stops as extras.sky in the GLB). strength 0 = black."""
    exec(open(r'C:\aljazira-3d\blend\scripts\sky.py', encoding='utf-8').read(), globals())
    return build_world(strength)

def setup_cycles(res=2048, samples=256, threshold=0.02):
    sc = bpy.context.scene
    try:
        sc.render.engine = 'CYCLES'
    except TypeError as e:
        print('engine', e)
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'
    prefs.get_devices()
    for d in prefs.devices: d.use = (d.type == 'OPTIX')
    sc.cycles.device = 'GPU'
    sc.cycles.samples = samples
    sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = threshold
    sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPTIX'
    sc.cycles.max_bounces = 6; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 3
    sc.cycles.transparent_max_bounces = 16; sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
    sc.cycles.sample_clamp_indirect = 10.0
    sc.render.resolution_x = res; sc.render.resolution_y = res; sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGB'
    sc.view_settings.view_transform = 'AgX'
    try: sc.view_settings.look = 'AgX - Medium High Contrast'
    except TypeError: pass
    sc.view_settings.exposure = float(sc.get('aj_exposure', 0.0))     # v022: build_studio night = +0.35

def apply_render_overrides():
    """Render-only (never saved). R5 crossfade rule: the live model's glass reflects only the environment (the sky),
    so in the stills no object is visible to glossy rays either; trails, lamps and the podium don't mirror in the
    curtain wall in one and not the other."""
    for o in bpy.data.objects:
        if o.type in ('MESH', 'LIGHT') and not o.name.startswith(('MAQ_room', 'MAQ_softbox_', 'MAQ_glow', 'MAQ_moon')): o.visible_glossy = False
        # (v022 studio: the glass and gold reflect the room + softbox panels, which is also the live environment)
        # system glow (LEDs, screens, gold accents) shows only for an entered system, like the live model
        # (render_ends.py turns the entered system's glow back on)
        if o.type == 'MESH' and o.name.endswith('_glow') and o.users_collection and \
                o.users_collection[0].name.startswith('SYS_'):
            o.hide_render = True
