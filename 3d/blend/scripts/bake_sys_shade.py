# Background job: blender -b aljazira_tower.blend -P bake_sys_shade.py      (also exec'd by export_glb.py lite)
# Natural-colour systems: the entered state has only the dim dusk sky, so a system would read flat and dark. Bake its
# NATURAL COLOURS x FORM SHADING on the body meshes' LM UV: a soft key light from the upper south-east + a grey sky, the
# systems alone (everything else hidden, so the facade does not shadow them); irradiance and albedo (the vertex
# colours) baked separately and combined with a floor, so no side goes black. That image is the highlight's emission
# texture: the entered colours read at night with their form, the same in Cycles (render_ends) and live.
import bpy, os, math
import numpy as np
from mathutils import Euler
TEX = __import__('os').environ.get('AJ_TEX', r'C:\aljazira-3d\textures') + r''

def bake_shade(objs, name, size=1024, samples=64):
    sc = bpy.context.scene
    hidden = [o for o in sc.objects if o not in objs and not o.hide_render]
    for o in hidden: o.hide_render = True
    old_world = sc.world
    w = bpy.data.worlds.new('SHADE_world'); w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (1, 1, 1, 1); bg.inputs['Strength'].default_value = 0.32
    sc.world = w
    sd = bpy.data.lights.new('SHADE_sun', 'SUN'); sd.energy = 0.75; sd.angle = math.radians(20)
    sun = bpy.data.objects.new('SHADE_sun', sd); sc.collection.objects.link(sun)
    sun.rotation_euler = Euler((math.radians(42), 0, math.radians(35)), 'XYZ')
    sc.render.engine = 'CYCLES'; sc.cycles.samples = samples; sc.cycles.use_denoising = False
    img = bpy.data.images.get(name + '_raw') or bpy.data.images.new(name + '_raw', size, size, alpha=False, float_buffer=True)
    mats = {s.material for o in objs for s in o.material_slots if s.material}
    for m in mats:
        nt = m.node_tree
        for nn in ('SH_bake', 'SH_uv'):
            if nt.nodes.get(nn): nt.nodes.remove(nt.nodes[nn])
        n = nt.nodes.new('ShaderNodeTexImage'); n.name = 'SH_bake'; n.image = img
        uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.name = 'SH_uv'; uvn.uv_map = 'LM'
        nt.links.new(uvn.outputs['UV'], n.inputs['Vector']); nt.nodes.active = n
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True); o.data.uv_layers.active = o.data.uv_layers['LM']
    bpy.context.view_layer.objects.active = objs[0]
    sc.render.bake.margin = 4; sc.render.bake.use_clear = True
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, use_clear=True, margin=4)
    irr = np.clip(np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)[:, 0], 0.0, 1.0)   # grey irradiance
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, use_clear=True, margin=4)
    px = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
    albedo = np.clip(px[:, :3], 0.0, 1.0)                        # the natural colours (vertex colour 'Col')
    lin = albedo * (0.3 + 0.7 * irr)[:, None]                    # floor: the shadow sides stay readable
    srgb = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * np.power(lin, 1 / 2.4) - 0.055)   # byte PNG stores sRGB
    out = np.ones_like(px); out[:, :3] = srgb
    res = bpy.data.images.get(name)
    if res is not None: bpy.data.images.remove(res)
    res = bpy.data.images.new(name, size, size, alpha=False)
    res.colorspace_settings.name = 'sRGB'
    res.pixels[:] = out.ravel()
    res.filepath_raw = os.path.join(TEX, name + '.png'); res.file_format = 'PNG'; res.save()
    for m in mats:                                              # remove the bake target node again
        for nn in ('SH_bake', 'SH_uv'):
            if m.node_tree.nodes.get(nn): m.node_tree.nodes.remove(m.node_tree.nodes[nn])
    for o in objs:
        if o.data.uv_layers.get('UVMap'): o.data.uv_layers.active = o.data.uv_layers['UVMap']
    bpy.data.objects.remove(sun, do_unlink=True); bpy.data.lights.remove(sd)
    sc.world = old_world; bpy.data.worlds.remove(w)
    for o in hidden: o.hide_render = False
    bpy.data.images.remove(img)
    return res

def wire_highlight(img):
    """Highlight materials: emission colour = the baked colour x shading image on LM UV, strength 0.9."""
    for s in ('hvac', 'fire', 'plumbing', 'power', 'smart'):
        m = bpy.data.materials['MAT_%s_highlight' % s]; nt = m.node_tree
        b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
        tn = nt.nodes.get('HL_shade') or nt.nodes.new('ShaderNodeTexImage'); tn.name = 'HL_shade'; tn.image = img
        un = nt.nodes.get('HL_uv') or nt.nodes.new('ShaderNodeUVMap'); un.name = 'HL_uv'; un.uv_map = 'LM'
        nt.links.new(un.outputs['UV'], tn.inputs['Vector']); nt.links.new(tn.outputs['Color'], b.inputs['Emission Color'])
        b.inputs['Emission Strength'].default_value = 0.9

if __name__ == '__main__' and not globals().get('SHADE_LIB_ONLY'):
    objs = [o for c in bpy.data.collections if c.name.startswith('SYS_') for o in c.objects
            if o.type == 'MESH' and not o.name.endswith(('_glow', '_fans'))]   # v020: fan rotors keep their own material
    img = bake_shade(objs, 'tex_sys_shade')
    wire_highlight(img)
    bpy.ops.wm.save_mainfile()
    print('SYS_SHADE_DONE %d meshes' % len(objs))
