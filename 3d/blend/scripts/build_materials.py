# glTF-PBR materials (Principled BSDF + image textures only) and assignment by object name.
# Facade + core materials are alpha-blend capable (BLENDED, alpha socket unlinked = 1.0, double-sided);
# the web drives their opacity from facade_opacity / interior_opacity.
exec(open(r'C:\aljazira-3d\blend\scripts\lib.py').read())
import os
TEX = __import__('os').environ.get('AJ_TEX', r'C:\aljazira-3d\textures') + r''

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

def tex(name, colorspace='sRGB'):
    img = bpy.data.images.get(name + '.png') or bpy.data.images.load(os.path.join(TEX, name + '.png'), check_existing=True)
    img.colorspace_settings.name = colorspace
    return img

def pbr(name, base='#808080', metal=0.0, rough=0.5, emit=None, emit_tex=None, strength=1.0, base_tex=None,
        blend=False, double=False, normal_tex=None, normal_repeat=None, vcol=False, vcol_alpha=False, mr_tex=None, alpha_clip=False):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); out.location = (400, 0)
    b = nt.nodes.new('ShaderNodeBsdfPrincipled'); b.location = (100, 0)
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    b.inputs['Base Color'].default_value = srgb(base)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    uvn = None
    def img_node(img, y):
        nonlocal uvn
        if uvn is None:
            uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = 'UVMap'; uvn.location = (-600, 0)
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = img; n.location = (-300, y)
        nt.links.new(uvn.outputs['UV'], n.inputs['Vector'])
        return n
    if base_tex:
        bn = img_node(tex(base_tex), 200)
        nt.links.new(bn.outputs['Color'], b.inputs['Base Color'])
        if alpha_clip:           # texture alpha -> Math Round -> Alpha: the glTF exporter writes alphaMode MASK, cutoff 0.5
            rn = nt.nodes.new('ShaderNodeMath'); rn.operation = 'ROUND'; rn.location = (-100, 300)
            nt.links.new(bn.outputs['Alpha'], rn.inputs[0]); nt.links.new(rn.outputs['Value'], b.inputs['Alpha'])
    if vcol:                     # vertex colours ('Col') as base colour -> glTF COLOR_0
        vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'; vc.location = (-300, 200)
        nt.links.new(vc.outputs['Color'], b.inputs['Base Color'])
        if vcol_alpha:           # vertex alpha -> material alpha (ground fade-out; COLOR_0 is RGBA)
            nt.links.new(vc.outputs['Alpha'], b.inputs['Alpha'])
    if normal_tex:               # tangent-space normal map on UVMap -> glTF normalTexture
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.uv_map = 'UVMap'; nm.location = (-100, -450)
        ni = img_node(tex(normal_tex, 'Non-Color'), -450)
        if normal_repeat:        # tiled: UV -> Mapping(scale) -> image, exported as KHR_texture_transform + REPEAT
            mp = nt.nodes.new('ShaderNodeMapping'); mp.name = 'NRM_repeat'; mp.vector_type = 'POINT'; mp.location = (-450, -450)
            mp.inputs['Scale'].default_value = (normal_repeat[0], normal_repeat[1], 1.0)
            nt.links.new(uvn.outputs['UV'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], ni.inputs['Vector'])
            ni.extension = 'REPEAT'
        nt.links.new(ni.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    if mr_tex:                   # per-panel metal (B) / roughness (G) -> glTF metallicRoughnessTexture
        sep = nt.nodes.new('ShaderNodeSeparateColor'); sep.location = (-100, -700)
        nt.links.new(img_node(tex(mr_tex, 'Non-Color'), -700).outputs['Color'], sep.inputs['Color'])
        nt.links.new(sep.outputs['Green'], b.inputs['Roughness']); nt.links.new(sep.outputs['Blue'], b.inputs['Metallic'])
    if emit_tex:
        nt.links.new(img_node(tex(emit_tex), -200).outputs['Color'], b.inputs['Emission Color'])
        b.inputs['Emission Strength'].default_value = strength
    elif emit:
        b.inputs['Emission Color'].default_value = srgb(emit)
        b.inputs['Emission Strength'].default_value = strength
    if blend and not vcol_alpha:   # alpha < 1 makes the glTF exporter write alphaMode BLEND; 0.999 stays visually opaque
        b.inputs['Alpha'].default_value = 0.999
    m.surface_render_method = 'BLENDED' if blend else 'DITHERED'
    m.use_backface_culling = not double
    m.diffuse_color = srgb(base)
    return m

MATS = {
    # facade (fades with facade_opacity)
    # R5 glass: deep navy-teal reflective glass (C2); per-panel metal/roughness (tex_cw_mr) breaks the sky reflection
    # into vertical streaks; emission = lit rooms only
    # corner proof L-1: the two camera faces differ in value like the ref, through reflectance (metallic base colour =
    # how much sky the glass gives back), not a texture: the S face (left in the hero) a lighter sky-reflecting glass,
    # the E face (MAT_glass_side, right) a darker one. L-2: lit rooms sit behind darker glass (lower emission).
    'MAT_glass_cw':     dict(base='#6E8CB4', metal=0.9, rough=0.06, emit_tex='tex_cw_emit', strength=2.6, blend=True, double=True,
                             normal_tex='tex_cw_normal', normal_repeat=(64, 24), mr_tex='tex_cw_mr'),
    'MAT_glass_wing':   dict(base='#6886AE', metal=0.9, rough=0.06, emit_tex='tex_cw_emit', strength=1.8, blend=True, double=True,
                             normal_tex='tex_cw_normal', normal_repeat=(64, 24), mr_tex='tex_cw_mr'),   # west wing (C7)
    # stepped terraces (C5 / L-3, QA): each recessed box a clear value DARKER than the face in front of it, with its
    # lit floors (T rows of tex_cw_emit) glowing through, like the ref
    # v021 (owner N-2, readable from CAM_hero as in v012): darker recessed glass (#121B28), interiors lit harder
    'MAT_glass_terrace': dict(base='#0E1622', metal=0.9, rough=0.06, emit_tex='tex_cw_emit', strength=2.8, blend=True, double=True,
                             normal_tex='tex_cw_normal', normal_repeat=(64, 24), mr_tex='tex_cw_mr'),
    # v021 (owner N-6): deep-blue reflective glass (metal / roughness per panel from tex_cw_mr) over brighter lit rooms
    # (tex_cw_emit now draws a room behind each pane), so warm offices read through a blue mirror like the ref
    # E face (right in the hero, L-1): the darker of the two camera faces
    'MAT_glass_side':   dict(base='#5E7CA6', metal=0.9, rough=0.06, emit_tex='tex_cw_emit', strength=2.2, blend=True, double=True,
                             normal_tex='tex_cw_normal', normal_repeat=(64, 24), mr_tex='tex_cw_mr'),
    'MAT_mullion':      dict(base='#FFFFFF', metal=0.9, rough=0.22, vcol=True, blend=True),   # colour per face in 'Col'; v021 N-6: champagne metal, crisp highlight
    # champagne gold (pilasters, crown frame, podium fascia): uplight wash in tex_pilaster_wash on v = z / 92
    'MAT_gold_fin':     dict(base='#C49A5A', metal=1.0, rough=0.28, emit_tex='tex_pilaster_wash', strength=1.0, blend=True),
    'MAT_crown_light':  dict(base='#EFCB76', metal=0.0, rough=0.5, emit='#F0A848', strength=5.0, blend=True),   # corner proof: 10 read white under AgX
    'MAT_podium_glass': dict(base='#2A2418', metal=0.0, rough=0.08, emit_tex='tex_podium_emit', strength=4.3, blend=True, double=True),   # v021 N-3: brightest region (152 vs 144 for the brightest facade window), as gold as AgX allows at that luma
    # interior (fades with interior_opacity)
    'MAT_concrete':     dict(base='#8C9096', metal=0.0, rough=0.85, blend=True, double=True),
    # the floor slabs a system stands on (GF, L01, L22, RF: SYS_*.floor_slabs): same concrete, own material so their
    # Cycles light can be baked for the live model (they read navy there when a system is entered)
    'MAT_concrete_floor': dict(base='#8C9096', metal=0.0, rough=0.85, blend=True, double=True),
    # podium / site (opaque)
    'MAT_bronze':       dict(base='#B88C5A', metal=0.0, rough=0.65),                       # canopies (L-4): light bronze, little sky in it
    'MAT_stone':        dict(base='#A39C90', rough=0.75),
    'MAT_paving':       dict(base='#847D72', rough=0.35),                        # v022: darker so the lamp pools / bollards draw the light (v021 #A8A194)
    'MAT_asphalt':      dict(base='#FFFFFF', rough=0.6, vcol=True, vcol_alpha=True, blend=True),   # colour + arm fade in 'Col'
    'MAT_ground':       dict(base='#FFFFFF', rough=0.9, vcol=True, vcol_alpha=True, blend=True,    # colour + fade in 'Col'
                         emit='#666E80', strength=0.3),   # v021 N-5: dusk blue-grey haze glow (the plot reads lit, not black)
    'MAT_planting':     dict(base='#3F5A36', rough=0.9),                        # v022: less saturated, darker lawn (v021 #4A7C3D)
    'MAT_vegetation':   dict(base='#FFFFFF', rough=0.8, base_tex='tex_vegetation', alpha_clip=True, double=True),   # v022: palms / trees on the vegetation atlas (alpha MASK)
    'MAT_trail_white':  dict(base='#FFFFFF', emit='#FFE9C8', strength=14.0, double=True), # light trails (headlights)
    'MAT_trail_red':    dict(base='#FF2A1A', emit='#FF2A1A', strength=9.0, double=True), # light trails (tail lights)
    'MAT_lamp_pole':    dict(base='#2A2A2A', metal=0.6, rough=0.5),
    'MAT_lamp_head':    dict(base='#FFE2B0', emit='#FFD49A', strength=15.0),
}
SYSTEMS = ['hvac', 'fire', 'plumbing', 'power', 'smart']
for s in SYSTEMS:
    # natural MEP colours (owner 2026-10-23): ONE body material per system, colours in the vertex colour 'Col'
    # (mep_parts.py C), the same at rest and entered; entered = variant highlight_<s>: the same colours lifted by the
    # baked colour x form shading (bake_sys_shade.py) as emission. Glow: LEDs, screens, gold accents, chevrons.
    MATS['MAT_%s_metal' % s] = dict(base='#FFFFFF', metal=0.3, rough=0.55, vcol=True)
    MATS['MAT_%s_highlight' % s] = dict(base='#FFFFFF', metal=0.2, rough=0.55, vcol=True, emit='#808080', strength=0.9)
    MATS['MAT_%s_glow' % s] = dict(base='#000000', metal=0.0, rough=0.6, emit_tex='tex_glow_palette',
                                   strength=3.5 if s == 'smart' else 2.2)   # smart: racks / screens carry its read
# v020 (owner: "the HVAC fans should rotate"): rotor discs, blade texture with alpha; the viewer rotates the texture
MATS['MAT_hvac_fans'] = dict(base='#FFFFFF', metal=0.3, rough=0.55, base_tex='tex_hvac_fans', alpha_clip=True)
for name, kw in MATS.items():
    pbr(name, **kw).use_fake_user = name.endswith('_highlight')     # unused in the scene; exported as variants

ASSIGN = [  # (name prefix or exact, material)
    ('FAC_cw_wing', 'MAT_glass_wing'), ('FAC_cw_terrace', 'MAT_glass_terrace'), ('FAC_cw_E', 'MAT_glass_side'),   # before 'FAC_cw_' (first prefix match wins)
    ('FAC_cw_', 'MAT_glass_cw'), ('FAC_mullions', 'MAT_mullion'), ('FAC_floorlines', 'MAT_mullion'), ('FAC_goldfins', 'MAT_gold_fin'), ('FAC_crownbeam', 'MAT_gold_fin'),
    ('FAC_crown_light', 'MAT_crown_light'), ('FAC_podium_glass', 'MAT_podium_glass'),
    ('CORE_slab_GF', 'MAT_concrete_floor'), ('CORE_slab_L01', 'MAT_concrete_floor'), ('CORE_slab_L22', 'MAT_concrete_floor'),
    ('CORE_slab_RF', 'MAT_concrete_floor'), ('CORE_', 'MAT_concrete'),
    ('POD_plinth', 'MAT_stone'), ('POD_fascia', 'MAT_gold_fin'), ('POD_canopies', 'MAT_bronze'),
    ('SITE_ground', 'MAT_ground'), ('SITE_roads', 'MAT_asphalt'), ('SITE_plaza', 'MAT_paving'),
    ('SITE_planting', 'MAT_planting'), ('SITE_lamp_pole', 'MAT_lamp_pole'), ('SITE_lamp_head', 'MAT_lamp_head'),
    ('SITE_bollardh_', 'MAT_lamp_head'), ('SITE_bollard_', 'MAT_lamp_pole'),
    ('SITE_palmA', 'MAT_vegetation'), ('SITE_palmB', 'MAT_vegetation'), ('SITE_palmD', 'MAT_vegetation'), ('SITE_treeC', 'MAT_vegetation'),
    ('SITE_trails_white', 'MAT_trail_white'), ('SITE_trails_red', 'MAT_trail_red'),
]
def material_for(o):
    for s in SYSTEMS:
        if o.users_collection and o.users_collection[0].name == 'SYS_' + s:
            return ('MAT_%s_glow' if o.name.endswith('_glow') else
                    'MAT_%s_fans' if o.name.endswith('_fans') else 'MAT_%s_metal') % s
    for pre, m in ASSIGN:
        if o.name.startswith(pre): return m
    return None

missing = []
for o in bpy.data.objects:
    if o.type != 'MESH': continue
    m = material_for(o)
    if m is None: missing.append(o.name); continue
    o.data.materials.clear(); o.data.materials.append(bpy.data.materials[m])
for n in ('MAT_clay', 'MAT_clay_sys', 'MAT_city', 'MAT_sky',           # R5: city + sky dome removed,
          'MAT_crown_glass', 'MAT_gold_podium'):                         # crown box + gold podium slab replaced
    if n in bpy.data.materials and bpy.data.materials[n].users == 0:
        bpy.data.materials.remove(bpy.data.materials[n])
print('unassigned:', missing)

# ---- v022 (realism B): Poly Haven surfaces (CC0, assets\polyhaven, LICENCES.md) on the plaza, roads and lawns, in
#      world-space metres (Geometry Position -> Mapping). The picture is normalised by its mean, so each material keeps
#      its v021 mean albedo (the N-5 calibration) and only gains joints / grain / blades. Every node is named 'PH_*':
#      export_glb.py removes them (the live model keeps the baked site light / vertex colours, no extra textures).
PH = r'C:\aljazira-3d\assets\polyhaven'
import numpy as _np
def ph_surface(mname, asset, tile_m, normal_strength=0.6):
    m = bpy.data.materials[mname]; nt = m.node_tree; N = nt.nodes; L = nt.links
    b = next(n for n in N if n.type == 'BSDF_PRINCIPLED')
    def img(kind, cs):
        p = os.path.join(PH, asset, '%s_%s_1k.jpg' % (asset, kind))
        i = bpy.data.images.load(p, check_existing=True); i.colorspace_settings.name = cs; return i
    geo = N.new('ShaderNodeNewGeometry'); geo.name = 'PH_geo'
    mp = N.new('ShaderNodeMapping'); mp.name = 'PH_map'; mp.inputs['Scale'].default_value = (1 / tile_m,) * 3
    L.new(geo.outputs['Position'], mp.inputs['Vector'])
    def tnode(kind, cs):
        t = N.new('ShaderNodeTexImage'); t.name = 'PH_' + kind; t.image = img(kind, cs); L.new(mp.outputs['Vector'], t.inputs['Vector']); return t
    d = tnode('diff', 'sRGB')
    px = _np.array(d.image.pixels[:], dtype=_np.float32).reshape(-1, 4)[:, :3]
    lin = _np.where(px <= 0.04045, px / 12.92, ((px + 0.055) / 1.055) ** 2.4).mean(axis=0)   # mean linear colour
    norm = N.new('ShaderNodeMix'); norm.name = 'PH_norm'; norm.data_type = 'RGBA'; norm.blend_type = 'MULTIPLY'
    norm.inputs['Factor'].default_value = 1.0; L.new(d.outputs['Color'], norm.inputs['A'])
    norm.inputs['B'].default_value = (*(1.0 / _np.maximum(lin, 1e-3)), 1.0)      # picture / its mean: mean 1
    src = b.inputs['Base Color']
    mul = N.new('ShaderNodeMix'); mul.name = 'PH_mul'; mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'
    mul.inputs['Factor'].default_value = 1.0; L.new(norm.outputs['Result'], mul.inputs['B'])
    if src.is_linked:
        m['ph_base_from'] = src.links[0].from_node.name; L.new(src.links[0].from_socket, mul.inputs['A'])
    else: mul.inputs['A'].default_value = src.default_value
    L.new(mul.outputs['Result'], src)
    r = tnode('rough', 'Non-Color')                                # roughness keeps its v021 mean (paving 0.35: N-6 sheen)
    rmean = float(_np.array(r.image.pixels[:], dtype=_np.float32).reshape(-1, 4)[:, 0].mean())
    rk = N.new('ShaderNodeMath'); rk.name = 'PH_rough_k'; rk.operation = 'MULTIPLY'
    rk.inputs[1].default_value = b.inputs['Roughness'].default_value / max(rmean, 1e-3)
    L.new(r.outputs['Color'], rk.inputs[0]); L.new(rk.outputs[0], b.inputs['Roughness'])
    n = tnode('nor_gl', 'Non-Color'); nm = N.new('ShaderNodeNormalMap'); nm.name = 'PH_nmap'
    nm.inputs['Strength'].default_value = normal_strength
    L.new(n.outputs['Color'], nm.inputs['Color']); L.new(nm.outputs['Normal'], b.inputs['Normal'])
ph_surface('MAT_paving', 'rectangular_paving', 2.0)
ph_surface('MAT_asphalt', 'asphalt_01', 2.08, 0.4)
ph_surface('MAT_planting', 'leafy_grass', 2.0, 0.8)
print('PH surfaces: paving, asphalt, planting')
