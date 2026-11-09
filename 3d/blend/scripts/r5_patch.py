# Background job: blender -b aljazira_tower.blend -P r5_patch.py -- <increment_name>
# Look-only R5 patch on the master (no geometry change, so the AO bake stays valid): regenerate the procedural
# textures, push MATS parameters (build_materials.py) into the existing materials, lamp lights out of glossy rays.
import bpy, sys
S = r'C:\aljazira-3d\blend\scripts'
args = sys.argv[sys.argv.index('--') + 1:]
exec(open(S + r'\build_textures.py', encoding='utf-8').read())
for im in bpy.data.images:
    if im.filepath and im.source == 'FILE': im.reload()
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
for o in bpy.data.objects:
    if o.name.startswith('LGT_lamp_'): o.visible_glossy = False
bpy.ops.wm.save_mainfile()
if args:
    bpy.ops.wm.save_as_mainfile(filepath=r'C:\aljazira-3d\blend\%s.blend' % args[0], copy=True)
print('PATCHED', flush=True)
