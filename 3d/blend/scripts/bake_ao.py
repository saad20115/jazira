# Lightmap UVs ('LM', TEXCOORD_1) packed into one atlas per collection group, Cycles AO bake, and the
# atlas wired into each material's glTF occlusion (via the 'glTF Material Output' group) so it exports as
# a standard occlusionTexture. Run in the live session (needs edit-mode UV operators).
import bpy, os, time
TEX = __import__('os').environ.get('AJ_TEX', r'C:\aljazira-3d\textures') + r''
# Objects baked into the long-reach site atlas instead of their collection's (they also get the baked site light,
# bake_site_light.py). Their materials must not be shared with LM_arch objects (one occlusion image per material):
# POD_fascia shares MAT_gold_fin with the pilasters, so it stays in LM_arch.
SITE_LIGHT = ['POD_plinth', 'POD_canopies', 'SITE_plaza', 'SITE_planting']
GROUPS = {   # atlas name: (collections, size, AO reach in metres)
    'LM_arch':    (['ARCH_facade', 'ARCH_core', 'ARCH_podium'], 2048, 4.0),
    'LM_systems': (['SYS_hvac', 'SYS_fire', 'SYS_plumbing', 'SYS_power', 'SYS_smart'], 1024, 4.0),
    # step 6 / corner proof L-5: long-reach AO on the plaza, plinth and podium: the tower shades the sky over them
    # (Cycles does that with real light; the live model only has the sky environment, which read blue there)
    'LM_site':    (['SITE'], 1024, 40.0),         # + the SITE_LIGHT podium objects
}
SKIP = {'SITE_ground', 'SITE_roads'}   # fading ground disc and the road ring get nothing useful from AO
SKIP_PREFIX = ('SITE_palmA', 'SITE_palmB', 'SITE_palmD', 'SITE_treeC', 'SITE_bollard', 'SITE_lamp_', 'SITE_trails')   # instanced (shared mesh) / emissive

def group_objects(colls):
    objs = [o for c in colls for o in bpy.data.collections[c].objects
            if o.type == 'MESH' and o.name not in SKIP and not o.name.startswith(SKIP_PREFIX)]
    if 'SITE' in colls: return objs + [bpy.data.objects[n] for n in SITE_LIGHT if n.startswith('POD_')]
    return [o for o in objs if o.name not in SITE_LIGHT]

def lm_unwrap(objs):
    bpy.ops.object.mode_set(mode='OBJECT') if bpy.context.object and bpy.context.object.mode != 'OBJECT' else None
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        uv = o.data.uv_layers.get('LM') or o.data.uv_layers.new(name='LM')
        o.data.uv_layers.active = uv
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.0, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(rotate=True, margin=0.004)      # all selected objects share one atlas
    bpy.ops.object.mode_set(mode='OBJECT')

def gltf_output_group():
    g = bpy.data.node_groups.get('glTF Material Output')
    if g is None:
        g = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
        g.interface.new_socket('Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
        g.interface.new_socket('Thickness', in_out='INPUT', socket_type='NodeSocketFloat')
    return g

def bake(atlas, objs, size):
    img = bpy.data.images.get(atlas) or bpy.data.images.new(atlas, size, size, alpha=False)
    if tuple(img.size) != (size, size): img.scale(size, size)
    mats = {s.material for o in objs for s in o.material_slots if s.material}
    for m in mats:                                       # bake target: an active, unlinked image node
        nt = m.node_tree
        n = nt.nodes.get('LM_bake') or nt.nodes.new('ShaderNodeTexImage')
        n.name = 'LM_bake'; n.image = img; n.location = (-300, -600)
        nt.nodes.active = n
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    sc = bpy.context.scene
    sc.render.bake.margin = 4; sc.render.bake.use_clear = True
    bpy.ops.object.bake(type='AO', use_clear=True, margin=4)
    path = os.path.join(TEX, atlas + '.png')
    img.filepath_raw = path; img.file_format = 'PNG'; img.save()
    img.colorspace_settings.name = 'Non-Color'
    # wire: LM uv -> atlas -> R -> glTF Material Output.Occlusion
    g = gltf_output_group()
    for m in mats:
        nt = m.node_tree
        for name in ('LM_uv', 'LM_sep', 'LM_gltf'):
            if nt.nodes.get(name): nt.nodes.remove(nt.nodes[name])
        n = nt.nodes['LM_bake']
        uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.name = 'LM_uv'; uvn.uv_map = 'LM'; uvn.location = (-600, -600)
        sep = nt.nodes.new('ShaderNodeSeparateColor'); sep.name = 'LM_sep'; sep.location = (0, -600)
        go = nt.nodes.new('ShaderNodeGroup'); go.name = 'LM_gltf'; go.node_tree = g; go.location = (300, -600)
        nt.links.new(uvn.outputs['UV'], n.inputs['Vector'])
        nt.links.new(n.outputs['Color'], sep.inputs['Color'])
        nt.links.new(sep.outputs['Red'], go.inputs['Occlusion'])
    for o in objs:                                       # textures keep sampling UVMap; LM only for occlusion
        if o.data.uv_layers.get('UVMap'): o.data.uv_layers.active = o.data.uv_layers['UVMap']

exec(open(r'C:\aljazira-3d\blend\scripts\render_setup.py', encoding='utf-8').read())
setup_cycles(512, 64, 0.05)
sc = bpy.context.scene
sc.cycles.samples = 128
log = {}
for atlas, (colls, size, reach) in GROUPS.items():
    t = time.time()
    sc.world.light_settings.distance = reach               # AO reach (metres)
    objs = group_objects(colls)
    lm_unwrap(objs)
    bake(atlas, objs, size)
    log[atlas] = (len(objs), size, reach, round(time.time() - t, 1))
print('AO bake:', log)
