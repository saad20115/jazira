# Background job: blender -b aljazira_tower.blend -P bake_site_light.py
# Corner proof L-5 (still -> live match): the live model is lit by the sky environment only, so upward-facing stone /
# paving / bronze / concrete read NAVY there, while in Cycles the lobby glow, canopy downlights and lamps warm them.
# Bake the Cycles diffuse light (direct + indirect, x albedo) of those surfaces on their LM UV; export_glb.py makes it
# their emissive and zeroes their occlusion, so live shows the Cycles diffuse. One image per LM atlas layout:
#   tex_sitelight: plinth, canopies, plaza, planting (LM_site packing, bake_ao.py SITE_LIGHT); the lamp-pool bake is
#                  included, so those surfaces no longer need it;
#   tex_slablight: the floor slabs systems stand on, MAT_concrete_floor (LM_arch packing; QA: navy roof deck in the
#                  entered hvac / smart views).
# 1024 samples + a masked blur (QA: grain on the plinth, blotchy decks in the entered views). Saves the master (only the
# bake image nodes change).
import bpy, os, sys, time
import numpy as np
exec(open(r'C:\aljazira-3d\blend\scripts\render_setup.py', encoding='utf-8').read())
TEX = __import__('os').environ.get('AJ_TEX', r'C:\aljazira-3d\textures') + r''
BAKES = [('tex_sitelight', ['POD_plinth', 'POD_canopies', 'SITE_plaza', 'SITE_planting'], 1024, 2, ()),
         ('tex_slablight', ['CORE_slab_GF', 'CORE_slab_L01', 'CORE_slab_L22', 'CORE_slab_RF'], 1024, 4,
          ('CORE_', 'FAC_', 'POD_'))]   # (.., blur radius, render-hidden prefixes for this bake)
if 'STUDIO' in bpy.data.collections:     # v022 studio maquette: the turntable plinth + rim and the room (build_studio.py)
    BAKES += [('tex_plinthlight', ['MAQ_plinth', 'MAQ_rim'], 1024, 2, ()), ('tex_roomlight', ['MAQ_room'], 1024, 3, ())]
# QA v019c: the slabs are only seen in the entered views, where render_ends fades the architecture: there the deck is
# lit by the sky (navy) and the outdoor lamps, not by the lobby / lit windows, and is not shadowed by the floors above.
# So the slab bake hides the rest of the architecture (the systems stay: they still shade their own deck).
_args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if _args: BAKES = [b for b in BAKES if b[0] in _args]        # optional: bake only the named images

def smooth(img, r):
    """Masked box blur of the bake (QA v019: blotchy decks in live): only baked texels count, so island edges keep
    their tone instead of darkening into the black margin."""
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
    rgb = px[..., :3]; m = (rgb.max(axis=2) > 1e-4).astype(np.float32)
    def box(a):
        c = np.cumsum(np.cumsum(np.pad(a, ((r + 1, r), (r + 1, r)) + ((0, 0),) * (a.ndim - 2)), 0), 1)
        return c[2 * r + 1:, 2 * r + 1:] - c[:-2 * r - 1, 2 * r + 1:] - c[2 * r + 1:, :-2 * r - 1] + c[:-2 * r - 1, :-2 * r - 1]
    num = box(rgb * m[..., None]); den = box(m)[..., None]
    px[..., :3] = np.where(den > 0, num / np.maximum(den, 1e-6), rgb) * m[..., None] + rgb * (1 - m[..., None])
    img.pixels[:] = px.ravel()

t0 = time.time()
setup_world(1.0); setup_cycles(1024, 1024, 0.02); apply_render_overrides()
sc = bpy.context.scene
sc.cycles.use_denoising = False
sc.render.bake.margin = 6; sc.render.bake.use_clear = True
for name, onames, size, blur, isolate in BAKES:
    hidden = [o for o in sc.objects if isolate and o.name.startswith(isolate) and o.name not in onames and not o.hide_render]
    for o in hidden: o.hide_render = True
    img = bpy.data.images.get(name) or bpy.data.images.new(name, size, size, alpha=False)
    objs = [bpy.data.objects[n] for n in onames]
    mats = {s.material for o in objs for s in o.material_slots if s.material}
    for m in mats:
        nt = m.node_tree
        for nn in ('SL_bake', 'SL_uv'):
            if nt.nodes.get(nn): nt.nodes.remove(nt.nodes[nn])
        n = nt.nodes.new('ShaderNodeTexImage'); n.name = 'SL_bake'; n.image = img; n.location = (-300, -900)
        uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.name = 'SL_uv'; uvn.uv_map = 'LM'
        nt.links.new(uvn.outputs['UV'], n.inputs['Vector']); nt.nodes.active = n
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True); o.data.uv_layers.active = o.data.uv_layers['LM']
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT', 'COLOR'}, use_clear=True, margin=6)
    for o in hidden: o.hide_render = False                    # restore before the master is saved
    smooth(img, blur)
    img.filepath_raw = os.path.join(TEX, name + '.png'); img.file_format = 'PNG'; img.save()
    for o in objs:                                      # textures keep sampling UVMap
        if o.data.uv_layers.get('UVMap'): o.data.uv_layers.active = o.data.uv_layers['UVMap']
    print('BAKED %s: %d objects, %d materials' % (name, len(objs), len(mats)))
bpy.ops.wm.save_mainfile()
print('SITE_LIGHT_DONE %.1fs' % (time.time() - t0))
