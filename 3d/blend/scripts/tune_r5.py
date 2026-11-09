# Look-dev loop (does NOT save): blender -b aljazira_tower.blend -P tune_r5.py -- <out.png> [res] [spp] [camera]
# Regenerates the procedural textures, rebuilds the materials' parameters and the sky world, renders one view.
import bpy, sys, time
S = r'C:\aljazira-3d\blend\scripts'
args = sys.argv[sys.argv.index('--') + 1:]
out = args[0]; res = int(args[1]) if len(args) > 1 else 1024; spp = int(args[2]) if len(args) > 2 else 128
cam = args[3] if len(args) > 3 else 'CAM_hero'
geo = len(args) > 4 and args[4] == 'geo'               # also rebuild the architecture (no AO: Cycles ignores it)
exec(open(S + r'\build_textures.py', encoding='utf-8').read())
if geo:
    exec(open(S + r'\build_arch.py', encoding='utf-8').read())
    exec(open(S + r'\build_materials.py', encoding='utf-8').read())
for im in bpy.data.images:
    if im.filepath and im.source == 'FILE': im.reload()
MAT_PARAMS = {}
src = open(S + r'\build_materials.py', encoding='utf-8').read()
exec(src[:src.index('for name, kw in MATS.items():')])        # srgb() + MATS only (keeps the baked AO wiring)
for name, kw in MATS.items():
    m = bpy.data.materials.get(name)
    if m is None: continue
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    if not b.inputs['Base Color'].is_linked: b.inputs['Base Color'].default_value = srgb(kw.get('base', '#808080'))
    b.inputs['Metallic'].default_value = kw.get('metal', 0.0); b.inputs['Roughness'].default_value = kw.get('rough', 0.5)
    if 'strength' in kw: b.inputs['Emission Strength'].default_value = kw['strength']
    if 'emit' in kw and not b.inputs['Emission Color'].is_linked: b.inputs['Emission Color'].default_value = srgb(kw['emit'])
exec(open(S + r'\render_setup.py', encoding='utf-8').read())
setup_world(1.0); setup_cycles(res, spp, 0.03)
sc = bpy.context.scene; sc.camera = bpy.data.objects[cam]; sc.render.filepath = out
t = time.time(); bpy.ops.render.render(write_still=True); print('TUNE_SECONDS %.1f' % (time.time() - t), flush=True)
