# Background job (factory startup, so user prefs are never touched):
#   blender -b --factory-startup aljazira_tower.blend -P export_glb.py -- <out.glb> [AUTO|JPEG|WEBP] [full|lite]
# Adds one KHR_materials_variants variant per system ('highlight_<s>': the system's equipment mesh switches to
# MAT_<s>_highlight; its glow mesh keeps MAT_<s>_glow), then exports the GLB: Draco off, cameras + extras on, lights off.
# lite: LM_arch at 1K. Scene extras: 'enter' and (R5) 'sky' (sky.py).
# Both: the baked lamp pools (bake_lamp_pools.py) become the emissive texture of the plaza / roads / planting,
# on a planar 'POOL' UV (export only: the master's Cycles renders keep their real lamps).
# lite also merges static meshes by material to cut draw calls (see LITE_MERGE).
import bpy, sys, json
args = sys.argv[sys.argv.index('--') + 1:]
out = args[0]; fmt = args[1] if len(args) > 1 else 'AUTO'
lite = len(args) > 2 and args[2] == 'lite'
SYSTEMS = ['hvac', 'fire', 'plumbing', 'power', 'smart']
O = bpy.data.objects

# ---- lite: its own, lighter system meshes (QA: lite <= 45k tris; the equipment is only seen up close after entering
#      a system). build_mep.py re-runs with LITE = True (mep_parts.py drops handwheels, ribs, half the rungs, coarser
#      tank grid ...): same object names, so variants, HOT anchors and floor_slabs are untouched. Their AO is baked
#      into a separate LM_systems_lite atlas, so the master's LM_systems.png is never overwritten.
if lite:
    LITE = True
    exec(open(r'C:\aljazira-3d\blend\scripts\lib.py').read())
    exec(open(r'C:\aljazira-3d\blend\scripts\build_arch.py', encoding='utf-8').read().split('# ---- ARCH_core')[0])   # notch(), CX, CY
    exec(open(r'C:\aljazira-3d\blend\scripts\build_mep.py', encoding='utf-8').read())
    for s in SYSTEMS:
        for o in bpy.data.collections['SYS_' + s].objects:
            if o.type == 'MESH':
                o.data.materials.clear()
                o.data.materials.append(bpy.data.materials[('MAT_%s_glow' if o.name.endswith('_glow') else
                                        'MAT_%s_fans' if o.name.endswith('_fans') else 'MAT_%s_metal') % s])
    _ao = open(r'C:\aljazira-3d\blend\scripts\bake_ao.py', encoding='utf-8').read()
    exec(_ao.split("exec(open(r'C:\\aljazira-3d\\blend\\scripts\\render_setup.py'")[0])   # helpers only
    exec(open(r'C:\aljazira-3d\blend\scripts\render_setup.py', encoding='utf-8').read())
    setup_cycles(512, 64, 0.05); bpy.context.scene.cycles.samples = 128
    bpy.context.scene.world.light_settings.distance = 4.0
    _objs = group_objects(['SYS_' + s for s in SYSTEMS])
    lm_unwrap(_objs); bake('LM_systems_lite', _objs, 1024)
    SHADE_LIB_ONLY = True                                        # the highlight's form shading, on the lite LM UV
    exec(open(r'C:\aljazira-3d\blend\scripts\bake_sys_shade.py', encoding='utf-8').read())
    wire_highlight(bake_shade([o for o in _objs if not o.name.endswith(('_glow', '_fans'))], 'tex_sys_shade_lite', size=512))   # lite size budget
    print('LITE_SYSTEMS rebuilt %d meshes' % len(_objs))
    if 'TURNTABLE' in O:    # v022 (owner: "the systems stay still while the tower turns"): build_mep's root() unparents
        for s in SYSTEMS:   # the SYS_ roots, so put them back on the turntable (world kept, rotation 0)
            o = O['SYS_' + s]; mw = o.matrix_world.copy(); o.parent = O['TURNTABLE']; o.matrix_world = mw
        print('LITE_SYSTEMS on TURNTABLE', flush=True)

# ---- v022: the stills city (CITY_stills) never ships; CITY_live (near ring CITY_ring_*, horizon band CITY_card)
#      does. The Poly Haven surfaces (build_materials.ph_surface, nodes 'PH_*') stay in Cycles: the live plaza / lawns
#      carry the baked site light and the roads their vertex colours, so the picture nodes are removed and the base
#      colour source restored (no extra textures in the GLB).
if 'MAQ_glowshell' in O:                 # v022 night: the reflection-only glow shell is Cycles-only (the viewer
    bpy.data.objects.remove(O['MAQ_glowshell'], do_unlink=True)   # rebuilds it from extras.studio.night_glow)
if 'CITY_stills' in bpy.data.collections:
    _cs = bpy.data.collections['CITY_stills']
    for o in list(_cs.all_objects): bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.collections.remove(_cs)
for _m in bpy.data.materials:
    if not _m.use_nodes: continue
    _ph = [n for n in _m.node_tree.nodes if n.name.startswith('PH_')]
    if not _ph: continue
    _src = _m.get('ph_base_from')
    for n in _ph: _m.node_tree.nodes.remove(n)
    if _src:
        _b = next(n for n in _m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        _m.node_tree.links.new(_m.node_tree.nodes[_src].outputs['Color'], _b.inputs['Base Color'])
    print('PH stripped', _m.name)
STUDIO = 'STUDIO' in bpy.data.collections                       # v022 studio maquette (build_studio.py): daylight
if 'MAT_ground_live' in bpy.data.materials and 'SITE_ground' in O:   # (v022 city attempt) the baked city ground
    _g = bpy.data.objects['SITE_ground'].data                    # (bake_city_ground.py), unlit, on 'UVGround'
    _g.materials.clear(); _g.materials.append(bpy.data.materials['MAT_ground_live'])
if lite:
    for im in bpy.data.images:                                  # v022 lite: the city band at 2048 x 256, ground 512
        if im.name.startswith('tex_city_band'): im.scale(2048, 256)
        if im.name.startswith('tex_city_ground'): im.scale(512, 512)

# ---- baked lamp pools -> emissive (strength = bake scale x material albedo, so emission = albedo x lighting).
#      Night only: the v022 daylight studio has no lamp pools.
if not STUDIO:
    P = json.load(open(__import__('os').environ.get('AJ_TEX', r'C:\aljazira-3d\textures') + r'\tex_lamp_pools.json'))
    x0, y0, x1, y1 = P['bbox']
    pool = bpy.data.images.load(__import__('os').environ.get('AJ_TEX', r'C:\aljazira-3d\textures') + r'\tex_lamp_pools.png', check_existing=True)
    pool.name = 'tex_lamp_pools'; pool.colorspace_settings.name = 'sRGB'
    pool.scale(512, 256)    # v022: the pools are smooth gradients; half size (UASTC ~375 -> ~95 KB)
for oname, mname in ([] if STUDIO else [('SITE_roads', 'MAT_asphalt')]):   # plaza / planting: the site-light bake below
    o = O[oname]; me = o.data; mw = o.matrix_world
    uv = me.uv_layers.get('POOL') or me.uv_layers.new(name='POOL')
    for l in me.loops:
        w = mw @ me.vertices[l.vertex_index].co
        uv.data[l.index].uv = ((w.x - x0) / (x1 - x0), (w.y - y0) / (y1 - y0))
    nt = bpy.data.materials[mname].node_tree
    b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    c = b.inputs['Base Color'].default_value
    vc = me.color_attributes.get('Col')
    if vc is not None and b.inputs['Base Color'].is_linked:   # v021 N-4: MAT_asphalt is white x 'Col' (the real
        n = len(vc.data)                                     # #42454A): the white base made the road glow like
        c = [sum(d.color[k] for d in vc.data) / n for k in range(3)]   # concrete in live (the wide pale band)
    albedo = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    un = nt.nodes.new('ShaderNodeUVMap'); un.uv_map = 'POOL'; un.location = (-600, -900)
    tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = pool; tn.extension = 'EXTEND'; tn.location = (-300, -900)
    nt.links.new(un.outputs['UV'], tn.inputs['Vector']); nt.links.new(tn.outputs['Color'], b.inputs['Emission Color'])
    b.inputs['Emission Strength'].default_value = P['scale'] * albedo
    print('POOL %s -> %s strength %.3f' % (oname, mname, P['scale'] * albedo))

# ---- corner proof L-5: baked site light (bake_site_light.py) -> emissive on the plinth, canopies, plaza, planting;
#      their occlusion goes to black, so the live sky environment no longer lights them (it read navy) and live shows
#      the Cycles diffuse. Export only: the master's Cycles renders keep their real lighting.
black = bpy.data.images.get('tex_black') or bpy.data.images.new('tex_black', 4, 4, alpha=False)
black.generated_color = (0, 0, 0, 1); black.colorspace_settings.name = 'Non-Color'
LIGHTMAPPED = {'MAT_stone': 'tex_sitelight', 'MAT_bronze': 'tex_sitelight', 'MAT_paving': 'tex_sitelight',
               'MAT_planting': 'tex_sitelight', 'MAT_concrete_floor': 'tex_slablight'}   # floor slabs: entered views
if STUDIO:                                  # v022: the turntable plinth and the studio room carry their baked Cycles light
    LIGHTMAPPED.update({'MAT_plinth_top': 'tex_plinthlight', 'MAT_plinth_side': 'tex_plinthlight', 'MAT_room': 'tex_roomlight'})
LM_STRENGTH = {'MAT_concrete_floor': 1.0}   # QA v019c: matched to the entered Cycles deck tone (sampled)
for mname, iname in LIGHTMAPPED.items():
    sl = bpy.data.images.load(__import__('os').environ.get('AJ_TEX', r'C:\aljazira-3d\textures') + r'\%s.png' % iname, check_existing=True)
    sl.name = iname; sl.colorspace_settings.name = 'sRGB'
    nt = bpy.data.materials[mname].node_tree
    b = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    un = nt.nodes.new('ShaderNodeUVMap'); un.uv_map = 'LM'
    tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = sl
    nt.links.new(un.outputs['UV'], tn.inputs['Vector']); nt.links.new(tn.outputs['Color'], b.inputs['Emission Color'])
    b.inputs['Emission Strength'].default_value = LM_STRENGTH.get(mname, 1.0)
    if nt.nodes.get('LM_bake'): nt.nodes['LM_bake'].image = black
    if STUDIO and not b.inputs['Base Color'].is_linked:          # v022 studio: base colour black, so neither the room
        b.inputs['Base Color'].default_value = (0, 0, 0, 1)      # environment nor the live moon light adds to the bake
    print('SITELIGHT', mname)

# ---- the light trails bloom much wider in live than in Cycles (thin ribbons at 1 px, no Cycles pixel filter):
#      export them dimmer (QA L-5); the master keeps the Cycles values
for mname, k in ([] if STUDIO else [('MAT_trail_white', 0.35), ('MAT_trail_red', 0.35),
                 ('MAT_ground', 0.75)]):   # v021 N-5: the live PMREM below-horizon sky already lights the ground; x0.75 puts the live bottom third at ~77 (Cycles 74)
    b = next(n for n in bpy.data.materials[mname].node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Emission Strength'].default_value *= k

# ---- lite: merge static meshes by material. Allowed: no variant, no HOT anchor, no own floor_slabs role.
# CORE slabs L02-L21 join CORE_core (same MAT_concrete, same interior_opacity as the rest of ARCH_core; GF, L01,
# L22, RF stay separate because SYS_*.floor_slabs names them). FAC_floorlines joins FAC_mullions (MAT_mullion).
LITE_MERGE = {'CORE_core': ['CORE_slab_L%02d' % n for n in range(2, 22)],
              'FAC_mullions': ['FAC_floorlines'], 'FAC_goldfins': ['FAC_crownbeam']}
if lite:
    keep = {n for o in O if o.name.startswith('SYS_') and 'floor_slabs' in o.keys() for n in o['floor_slabs'].split(',')}
    for target, names in LITE_MERGE.items():
        parts = [O[n] for n in names if n in O]
        assert not (keep & set(names)) and not any(p.children for p in parts), target
        t = O[target]
        with bpy.context.temp_override(active_object=t, object=t, selected_objects=[t] + parts,
                                       selected_editable_objects=[t] + parts):
            bpy.ops.object.join()
        print('MERGED %s <- %d objects' % (target, len(parts)))

if lite:
    img = bpy.data.images['LM_arch']
    img.scale(1024, 1024)
    for im in bpy.data.images:                                  # v020 rotor texture: 512 full, 256 lite
        if im.name.startswith('tex_hvac_fans'): im.scale(256, 256)

bpy.context.preferences.addons['io_scene_gltf2'].preferences.KHR_materials_variants_ui = True
sc = bpy.data.scenes[0]
exec(open(r'C:\aljazira-3d\blend\scripts\sky.py', encoding='utf-8').read())
if not STUDIO: sc['sky'] = sky_extras()   # R5: the web builds background + PMREM env from these stops (= Cycles world)
elif 'sky' in sc: del sc['sky']           # v022 studio: the environment is the room (extras.studio, motion_extras.py)
exec(open(r'C:\aljazira-3d\blend\scripts\motion_extras.py', encoding='utf-8').read())   # camera_limits, idle, SYS_* motion
for k in list(sc.keys()):             # scene extras: only the web keys (drop add-on state such as blendermcp_*)
    if k not in ('enter', 'sky', 'camera_limits', 'idle', 'turntable', 'studio'): del sc[k]
sysprops = sc.bl_system_properties_get() if hasattr(sc, 'bl_system_properties_get') else None
for k in (list(sysprops.keys()) if sysprops is not None else []):   # Blender 5 keeps add-on props here
    if k.startswith('blendermcp_'): del sysprops[k]
sc.gltf2_KHR_materials_variants_variants.clear()
for i, s in enumerate(SYSTEMS):
    v = sc.gltf2_KHR_materials_variants_variants.add(); v.variant_idx = i
    v['name'] = 'highlight_' + s          # raw assignment: the add-on's name-update callback recurses when set from Python
    hi = bpy.data.materials['MAT_%s_highlight' % s]
    for o in bpy.data.collections['SYS_' + s].objects:
        if o.type != 'MESH': continue
        o.data.gltf2_variant_mesh_data.clear()
        if o.name.endswith(('_glow', '_fans')): continue   # LEDs / screens / accents glow the same in both states;
                                                            # fan rotors stay natural grey (v020)
        d = o.data.gltf2_variant_mesh_data.add(); d.material_slot_index = 0; d.material = hi
        d.variants.add().variant.variant_idx = i

bpy.ops.export_scene.gltf(
    filepath=out, export_format='GLB',
    export_draco_mesh_compression_enable=False,
    export_image_format=fmt, export_jpeg_quality=90,
    export_texcoords=True, export_normals=True, export_materials='EXPORT',
    export_cameras=True, export_lights=False, export_extras=True, export_yup=True,
    export_gpu_instances=True,           # SITE_inst_* children sharing one mesh -> EXT_mesh_gpu_instancing
    export_apply=True, use_visible=False, use_renderable=False)
print('EXPORTED', out, flush=True)
