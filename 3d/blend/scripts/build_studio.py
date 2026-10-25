# v022 "studio maquette" (owner 2026-10-25: "the tower as a model on a turntable in a lit room, a roundabout around
# it, white daylight; no city"). Exec'd by rebuild_r5.py after build_views (so CAM_hero exists):
#   - STUDIO collection: MAQ_plinth (white turntable disc, bevel), MAQ_rim, MAQ_room (closed cyclorama bowl: floor,
#     a 300 m cove, dome; near-white), MAQ_softbox_* (emissive panels at the lights: what the glass and the gold
#     reflect, in Cycles and in the live PMREM; not seen by the camera in Cycles), studio daylight (area lights:
#     front-left key ~3:1 over the fill, overhead, four wall washes so the cyc reads lit and the cove has no dark band);
#   - TURNTABLE: one empty on the plinth axis = the tower's footprint centre; ARCH_*, SYS_*, SITE and the plinth are
#     parented to it (world transforms kept), the live idle animation turns it (motion_extras: extras.turntable);
#   - daylight: every night light in LIGHTS hidden from render, window / lobby / crown / lamp emission down to a
#     glimmer, daylight glass and gold values;
#   - CAM_hero pulled back along its own axis and its lens shift re-centred so the whole plinth + a little floor fit.
import bpy, bmesh, math
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
O, M = bpy.data.objects, bpy.data.materials
GZ = -0.6
PL_C, PL_R, PL_H = Vector((-1.2, -3.9)), 92.0, 3.0          # = build_site RING_C (full ring), r encloses the outer palms
ROOM_R, ROOM_COVE = 800.0, 300.0                           # the cove starts at 500 m: every orbit camera stays inside

# ---- reset
for o in [o for o in O if o.name.startswith(('MAQ_', 'TURNTABLE'))]:
    for ch in list(o.children):
        mw = ch.matrix_world.copy(); ch.parent = None; ch.matrix_world = mw
    bpy.data.objects.remove(o, do_unlink=True)
for m_ in [m_ for m_ in bpy.data.meshes if m_.users == 0]: bpy.data.meshes.remove(m_)
if 'STUDIO' not in bpy.data.collections:
    bpy.context.scene.collection.children.link(bpy.data.collections.new('STUDIO'))
ST = bpy.data.collections['STUDIO']

def bsdf(m): return next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
def mat(name, base, rough=0.6, metal=0.0, coat=0.0, emit=0.0):
    m = M.get(name) or M.new(name); m.use_nodes = True; b = bsdf(m)
    b.inputs['Base Color'].default_value = (*base, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal; b.inputs['Coat Weight'].default_value = coat
    b.inputs['Emission Color'].default_value = (1, 1, 1, 1); b.inputs['Emission Strength'].default_value = emit
    return m
M_TOP = mat('MAT_plinth_top', (0.78, 0.78, 0.77), 0.8)
M_SIDE = mat('MAT_plinth_side', (0.80, 0.80, 0.79), 0.45, coat=0.3)
M_ROOM = mat('MAT_room', (0.86, 0.86, 0.85), 0.9)
M_SOFT = mat('MAT_softbox', (1, 1, 1), 1.0, emit=6.0)
def link(o):
    ST.objects.link(o); return o
def mesh_obj(name, bm, mats):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    return link(O.new(name, me))

# ---- plinth: top board (0.4 m bevel down to the side), side, bottom; rim: a thin raised band inside the bevel
def orient(bm, inner_r=None):
    """Side faces point away from the axis (the bake reads the lit side; they were built facing in: black in live);
    on the rim, the inner wall (centre radius < inner_r) faces the axis, the top band up."""
    bm.normal_update()
    for f in bm.faces:
        c = f.calc_center_median(); rad = (c.xy - PL_C)
        if abs(f.normal.z) > 0.9:
            if f.normal.z < 0: f.normal_flip()
            continue
        want_out = not (inner_r is not None and rad.length < inner_r)
        if (f.normal.xy.dot(rad) > 0) != want_out: f.normal_flip()
seg = 160
def ring(bm, r, z): return [bm.verts.new((PL_C.x + r * math.cos(2 * math.pi * i / seg), PL_C.y + r * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)]
zt = GZ - 0.16
bm = bmesh.new()
top = ring(bm, PL_R - 0.4, zt); bev = ring(bm, PL_R, zt - 0.4); bot = ring(bm, PL_R, zt - PL_H)
bm.faces.new(top)
for a, b_ in ((top, bev), (bev, bot)):
    for i in range(seg):
        j = (i + 1) % seg; bm.faces.new([a[i], a[j], b_[j], b_[i]])
orient(bm)
plinth = mesh_obj('MAQ_plinth', bm, [M_TOP, M_SIDE])            # (no bottom face: it stands on the floor)
for p in plinth.data.polygons:
    p.material_index = 0 if p.normal.z > 0.9 else 1; p.use_smooth = p.normal.z < 0.9
bm = bmesh.new()
r_in, r_in_t = ring(bm, PL_R - 1.6, zt), ring(bm, PL_R - 1.6, zt + 0.35)
r_out_t, r_out = ring(bm, PL_R - 0.4, zt + 0.35), ring(bm, PL_R - 0.4, zt)
for a, b_ in ((r_in, r_in_t), (r_in_t, r_out_t), (r_out_t, r_out)):
    for i in range(seg):
        j = (i + 1) % seg; bm.faces.new([a[i], a[j], b_[j], b_[i]])
orient(bm, inner_r=PL_R - 1.0)
rim = mesh_obj('MAQ_rim', bm, [M_SIDE])

# ---- room: floor -> cove (quarter circle) -> wall -> dome, one smooth surface facing in
bm = bmesh.new(); seg_r = 128; zf = zt - PL_H
prof = [(0.0, zf)] + [((ROOM_R - ROOM_COVE) * t, zf) for t in (0.2, 0.4, 0.6, 0.8, 0.96, 1.0)]   # floor rings: the
# smooth normals' tilt into the cove stays in the last 20 m (one 500 m floor ring tilted the whole far floor: a dark band)
prof += [(ROOM_R - ROOM_COVE + ROOM_COVE * math.sin(t * math.pi / 2), zf + ROOM_COVE * (1 - math.cos(t * math.pi / 2))) for t in [k / 16 for k in range(1, 17)]]
prof += [(ROOM_R * math.cos(a), zf + ROOM_COVE + ROOM_R * math.sin(a)) for a in [math.radians(5 * k) for k in range(1, 18)] + [math.radians(89.9)]]
rings_ = [[bm.verts.new((PL_C.x + r * math.cos(2 * math.pi * i / seg_r), PL_C.y + r * math.sin(2 * math.pi * i / seg_r), z)) for i in range(seg_r)] if r > 1e-3 else None for r, z in prof]
centre = bm.verts.new((PL_C.x, PL_C.y, zf))
for k in range(len(prof) - 1):
    for i in range(seg_r):
        j = (i + 1) % seg_r
        if rings_[k] is None: bm.faces.new([centre, rings_[k + 1][j], rings_[k + 1][i]])
        else: bm.faces.new([rings_[k][i], rings_[k][j], rings_[k + 1][j], rings_[k + 1][i]][::-1])
for f in bm.faces: f.smooth = any(v.co.z > zf + 0.01 for v in f.verts)   # flat floor, smooth cove + dome
room = mesh_obj('MAQ_room', bm, [M_ROOM])

# ---- daylight (~6000 K): area lights, plus a softbox panel at each of the three main ones (reflections only)
piv = O['PIVOT_hero'].matrix_world.translation.copy()
LIGHTS = [  # name, position, aim, disk size, W, colour, softbox panel
    ('MAQ_key', (-330, 40, 230), piv, 50, 2.0e6, (1.0, 0.97, 0.93), True),
    ('MAQ_fill', (300, -200, 120), piv, 240, 0.35e6, (0.95, 0.97, 1.0), True),
    ('MAQ_sky', (0, 0, 400), piv, 260, 0.30e6, (1.0, 1.0, 1.0), True)]
for k in range(8):                                         # washes: even ones light the far floor + cove (the dark band
    a = math.radians(22.5 + 45 * k); low = k % 2 == 0          # QA saw at the floor-to-wall line), odd ones the wall
    p = Vector((PL_C.x + 300 * math.cos(a), PL_C.y + 300 * math.sin(a), 200 if low else 150))
    aim = Vector((PL_C.x + (560 if low else 760) * math.cos(a), PL_C.y + (560 if low else 760) * math.sin(a), 0 if low else 220))
    LIGHTS.append(('MAQ_wall_%d' % k, tuple(p), aim, 220, 0.75e6 if low else 0.5e6, (1.0, 0.99, 0.97), False))
for name, pos, aim, size, power, col, panel in LIGHTS:
    ld = bpy.data.lights.new(name, 'AREA'); ld.shape = 'DISK'; ld.size = size; ld.energy = power; ld.color = col
    lo = link(O.new(name, ld)); lo.location = pos
    lo.rotation_euler = (Vector(aim) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()
    if panel:
        bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=24, radius=size / 2)
        sb = mesh_obj('MAQ_softbox_' + name[4:], bm, [M_SOFT]); sb.matrix_world = lo.matrix_world.copy()
        sb.location = lo.location + (lo.matrix_world.to_quaternion() @ Vector((0, 0, 1.0)))   # just behind the light
        sb.visible_camera = False; sb.visible_diffuse = False; sb.visible_shadow = False; sb.visible_volume_scatter = False

# ---- v022 NIGHT (owner 2026-10-25: "night, but more brightness / light, more glass reflection and shine";
#      AJ_LIGHT=night): the same studio dimmed to a cool fill, the model's night lights and emission on, a bright
#      45-deg moon (sun lamp, light-linked to the model only, so the room stays night) and two large cool glow panels
#      seen only in reflections, where the hero's two 45-deg faces mirror: the blue sheen on the curtain wall.
NIGHT = __import__('os').environ.get('AJ_LIGHT', 'day') == 'night'
NIGHT_ROOM_K, MOON_W, GLOW_W, NIGHT_EXPOSURE = 0.06, 2.6, 2.2, 0.0   # owner: exposure back to 0 (the lit part read pale)
GLOW_COL, GLOW_Z, GLOW_MIN = (0.36, 0.52, 1.0), (-20.0, 700.0), 0.25
NAVY = (0.0070, 0.0232, 0.0887)                              # sRGB #142A54 (linear), owner-approved dark navy
sc0 = bpy.context.scene; sc0['aj_exposure'] = NIGHT_EXPOSURE if NIGHT else 0.0     # render_setup.setup_cycles reads it
if NIGHT:
    for o in ST.objects:
        if o.type == 'LIGHT': o.data.energy *= NIGHT_ROOM_K; o.data.color = (0.62, 0.72, 1.0)
    bsdf(M_SOFT).inputs['Emission Strength'].default_value *= NIGHT_ROOM_K
    cam_dir = O['CAM_hero'].matrix_world.translation - piv
    az = math.atan2(cam_dir.y, cam_dir.x) - math.radians(45)
    sun_from = Vector((math.cos(az) * math.cos(math.radians(45)), math.sin(az) * math.cos(math.radians(45)), math.sin(math.radians(45))))
    md = bpy.data.lights.new('MAQ_moon', 'SUN'); md.energy = MOON_W; md.angle = math.radians(3.0); md.color = (0.74, 0.84, 1.0)
    mo = link(O.new('MAQ_moon', md)); mo.rotation_euler = (-sun_from).to_track_quat('-Z', 'Y').to_euler()
    recv = bpy.data.collections.get('MOON_RECV') or bpy.data.collections.new('MOON_RECV')
    for cn in ['ARCH_facade', 'ARCH_core', 'ARCH_podium', 'SITE'] + ['SYS_' + s for s in ('hvac', 'fire', 'plumbing', 'power', 'smart')]:
        if bpy.data.collections[cn].name not in recv.children: recv.children.link(bpy.data.collections[cn])
    for on in ('MAQ_plinth', 'MAQ_rim'): recv.objects.link(O[on])
    mo.light_linking.receiver_collection = recv
    room.visible_shadow = False                              # the closed bowl would block the sun lamp
    # owner (2026-10-25, picked version "i"): glossy DARK NAVY glass over the whole tower, lit and dark parts alike, and
    # richer gold rooms (they read pale). A reflection-only glow shell just inside the room (a soft cool night sky,
    # brighter up high): every floor of every face mirrors it, so the sheen covers the whole curtain wall (the two
    # side panels tried first left a hard edge); the camera still sees the dark studio. Cycles only: the live
    # viewer builds the same shell from extras.studio.night_glow for its PMREM pass.
    sh = room.copy(); sh.data = room.data.copy(); sh.name = 'MAQ_glowshell'; ST.objects.link(sh)
    c0 = Vector((PL_C.x, PL_C.y, 0.0))
    for v in sh.data.vertices: v.co = c0 + (v.co - c0) * 0.97
    smat = M.get('MAT_glowshell') or M.new('MAT_glowshell'); smat.use_nodes = True; nt = smat.node_tree
    for n in list(nt.nodes):
        if n.type not in ('OUTPUT_MATERIAL', 'BSDF_PRINCIPLED'): nt.nodes.remove(n)
    sb = bsdf(smat); sb.inputs['Base Color'].default_value = (0, 0, 0, 1); sb.inputs['Emission Color'].default_value = (*GLOW_COL, 1)
    g = nt.nodes.new('ShaderNodeNewGeometry'); sz = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(g.outputs['Position'], sz.inputs[0])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = GLOW_Z[0]; mr.inputs['From Max'].default_value = GLOW_Z[1]
    mr.inputs['To Min'].default_value = GLOW_MIN; mr.inputs['To Max'].default_value = 1.0; nt.links.new(sz.outputs['Z'], mr.inputs['Value'])
    k_ = nt.nodes.new('ShaderNodeMath'); k_.operation = 'MULTIPLY'; k_.inputs[1].default_value = GLOW_W
    nt.links.new(mr.outputs['Result'], k_.inputs[0]); nt.links.new(k_.outputs[0], sb.inputs['Emission Strength'])
    sh.data.materials.clear(); sh.data.materials.append(smat)
    sh.visible_camera = False; sh.visible_diffuse = False; sh.visible_shadow = False
    sc0['aj_night_glow'] = {'color': list(GLOW_COL), 'gain': GLOW_W, 'z_from': GLOW_Z[0], 'z_to': GLOW_Z[1], 'min': GLOW_MIN,
                            'radius': (ROOM_R) * 0.97}
    # glass: dark navy, glossy (dielectric coat over the per-panel metal / roughness); richer gold rooms: the window
    # picture's saturation x1.6 baked into tex_cw_emit_night (a node would not survive the glTF export)
    for name, k in (('MAT_glass_cw', 1.0), ('MAT_glass_wing', 0.92), ('MAT_glass_side', 0.85), ('MAT_glass_terrace', 0.8)):
        b = bsdf(M[name]); b.inputs['Base Color'].default_value = (*[c * k for c in NAVY], 1)
        b.inputs['Specular IOR Level'].default_value = 0.8; b.inputs['Coat Weight'].default_value = 0.6
        b.inputs['Coat Roughness'].default_value = 0.03
    import numpy as _np, os as _os
    # source = the window picture the glass shows now (the one in the owner-approved mock; a fresh load from AJ_TEX
    # would pick a different, patchier tex_cw_emit than the one the materials kept)
    src = next(n.image for n in M['MAT_glass_cw'].node_tree.nodes
               if n.type == 'TEX_IMAGE' and n.image and n.image.name.startswith('tex_cw_emit') and 'night' not in n.image.name)
    print('NIGHT window picture from', src.filepath, flush=True)
    w_, h_ = src.size; px = _np.array(src.pixels[:], dtype=_np.float32).reshape(h_, w_, 4)
    c = px[..., :3]                                          # HSV saturation x1.6 in linear light (= the mock's Hue /
    lin = _np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)   # Saturation node), back to sRGB
    v = lin.max(axis=-1, keepdims=True); s = _np.where(v > 0, (v - lin.min(axis=-1, keepdims=True)) / _np.maximum(v, 1e-6), 0)
    s2 = _np.clip(s * 1.6, 0, 1); lin = _np.where(s > 0, v - (v - lin) * (s2 / _np.maximum(s, 1e-6)), lin)
    px[..., :3] = _np.where(lin <= 0.0031308, lin * 12.92, 1.055 * _np.clip(lin, 0, None) ** (1 / 2.4) - 0.055)
    dst = bpy.data.images.get('tex_cw_emit_night') or bpy.data.images.new('tex_cw_emit_night', w_, h_)
    if tuple(dst.size) != (w_, h_): dst.scale(w_, h_)
    dst.pixels.foreach_set(px.ravel()); dst.filepath_raw = _os.path.join(_os.environ.get('AJ_TEX', r'C:\aljazira-3d\textures'), 'tex_cw_emit_night.png')
    dst.file_format = 'PNG'; dst.save(); dst.colorspace_settings.name = 'sRGB'
    for name in ('MAT_glass_cw', 'MAT_glass_wing', 'MAT_glass_side', 'MAT_glass_terrace'):
        for n in M[name].node_tree.nodes:
            if n.type == 'TEX_IMAGE' and n.image and n.image.name.startswith('tex_cw_emit'): n.image = dst
    bsdf(M['MAT_gold_fin']).inputs['Emission Strength'].default_value = 1.0   # the pilaster uplight wash (as in the approved mock)
    # QA (2026-10-25): the warm paving (#847D72) read as a brown patch in the tower's night shadow; a cool moonlit grey
    # (#7A7F86) instead, night only (the lightmap bake picks it up; PH_mul's A input is the base under the Poly Haven tile)
    PAVE_NIGHT = (0.195, 0.212, 0.238, 1.0)
    pm = M['MAT_paving'].node_tree.nodes.get('PH_mul'); pa = pm.inputs['A'] if pm else bsdf(M['MAT_paving']).inputs['Base Color']
    if not pa.is_linked: pa.default_value = PAVE_NIGHT
else:                                                        # ---- day: night off, daylight values
    for o in bpy.data.collections['LIGHTS'].all_objects:
        if o.type == 'LIGHT': o.hide_render = True
    DAY = {'MAT_glass_cw': 0.12, 'MAT_glass_wing': 0.12, 'MAT_glass_side': 0.12, 'MAT_glass_terrace': 0.15,
           'MAT_podium_glass': 0.04, 'MAT_crown_light': 0.15, 'MAT_lamp_head': 0.0, 'MAT_gold_fin': 0.0}
    for name, k in DAY.items():
        if name in M: bsdf(M[name]).inputs['Emission Strength'].default_value *= k
for name, col in ((('MAT_gold_fin', (0.62, 0.48, 0.30)),) if NIGHT else                             # (night: the navy
                  (('MAT_glass_cw', (0.042, 0.10, 0.25)), ('MAT_glass_wing', (0.038, 0.09, 0.23)),    # glass above) day:
                   ('MAT_glass_side', (0.030, 0.075, 0.20)), ('MAT_glass_terrace', (0.16, 0.24, 0.36)),  # #3A5A88 / #37557F /
                   ('MAT_gold_fin', (0.62, 0.48, 0.30)), ('MAT_podium_glass', (0.20, 0.27, 0.36)))):     # #304D78
    b = bsdf(M[name])                                        # deep blue glass reflecting the room (day: the lobby glass too)
    if not b.inputs['Base Color'].is_linked: b.inputs['Base Color'].default_value = (*col, 1)
gm = M['MAT_gold_fin']; gb = bsdf(gm)                       # polished champagne metal: roughness varies 0.16-0.36
if not gb.inputs['Roughness'].is_linked:
    nz = gm.node_tree.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.6
    mr_ = gm.node_tree.nodes.new('ShaderNodeMapRange'); mr_.inputs['To Min'].default_value = 0.16; mr_.inputs['To Max'].default_value = 0.36
    gm.node_tree.links.new(nz.outputs['Fac'], mr_.inputs['Value']); gm.node_tree.links.new(mr_.outputs['Result'], gb.inputs['Roughness'])

# ---- turntable: one empty on the plinth axis carries the model (world transforms kept)
tt = link(O.new('TURNTABLE', None)); tt.location = (PL_C.x, PL_C.y, 0.0); tt.empty_display_size = 10
bpy.context.view_layer.update()
for name in ['ARCH_facade', 'ARCH_core', 'ARCH_podium', 'SITE', 'MAQ_plinth', 'MAQ_rim'] + ['SYS_' + s for s in ('hvac', 'fire', 'plumbing', 'power', 'smart')]:
    o = O[name]; mw = o.matrix_world.copy(); o.parent = tt; o.matrix_world = mw

# ---- LM UVs for the baked studio light (bake_site_light.py: tex_plinthlight, tex_roomlight)
_ao = open(r'C:\aljazira-3d\blend\scripts\bake_ao.py', encoding='utf-8').read()
exec(_ao.split("exec(open(r'C:\\aljazira-3d\\blend\\scripts\\render_setup.py'")[0])   # helpers only (lm_unwrap)
lm_unwrap([room])
def lm_plinth(o, band):
    """Plinth / rim 'LM' layout (a smart projection cut the side into slivers: dark in live): the top board planar in
    [0, 0.7]^2, every other face on a strip v in band, u = angle round the axis (continuous within each face)."""
    me = o.data; uv = me.uv_layers.get('LM') or me.uv_layers.new(name='LM')
    zs = [v.co.z for v in me.vertices]; z0, z1 = min(zs), max(zs)
    for p in me.polygons:
        top = p.normal.z > 0.9 and o.name == 'MAQ_plinth'
        us = []
        for li in p.loop_indices:
            w = o.matrix_world @ me.vertices[me.loops[li].vertex_index].co; d = w.xy - PL_C
            if top: uv.data[li].uv = (0.35 + d.x / PL_R * 0.34, 0.35 + d.y / PL_R * 0.34); continue
            u = (math.atan2(d.y, d.x) / (2 * math.pi)) % 1.0
            if us and u - us[0] > 0.5: u -= 1.0
            if us and us[0] - u > 0.5: u += 1.0
            us.append(u)
            uv.data[li].uv = (0.005 + 0.99 * u, band[0] + (band[1] - band[0]) * (w.z - z0) / max(z1 - z0, 1e-6))
lm_plinth(plinth, (0.74, 0.98)); lm_plinth(rim, (0.71, 0.73))

# ---- maquette framing: CAM_hero pulled back along its axis, lens shift re-centred, whole plinth + floor in frame
sc = bpy.context.scene; cam = O['CAM_hero']; rel0 = cam.matrix_world.translation - piv
pts = [Vector((PL_C.x + PL_R * math.cos(2 * math.pi * i / 48), PL_C.y + PL_R * math.sin(2 * math.pi * i / 48), zf - 2)) for i in range(48)]
pts += [Vector((x, y, 90.5)) for x in (-40, 45) for y in (-45, 40)]
sc.render.resolution_x = sc.render.resolution_y = 1024
for k in [1.0 + 0.025 * i for i in range(80)]:
    cam.location = piv + rel0 * k
    for _ in range(4):
        bpy.context.view_layer.update()
        cs = [world_to_camera_view(sc, cam, p) for p in pts]
        cam.data.shift_y += ((min(c.y for c in cs) + max(c.y for c in cs)) / 2 - 0.5)
    bpy.context.view_layer.update()
    if all(0.04 < c.x < 0.96 and 0.05 < c.y < 0.95 and c.z > 0 for c in (world_to_camera_view(sc, cam, p) for p in pts)): break
print('STUDIO: CAM_hero x%.3f = %.1f m from PIVOT_hero, shift_y %.3f; plinth r %.0f at (%.1f, %.1f)'
      % (k, (cam.location - piv).length, cam.data.shift_y, PL_R, PL_C.x, PL_C.y), flush=True)
