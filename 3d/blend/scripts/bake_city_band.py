# Background job, after build_city.py:  blender -b work.blend -P bake_city_band.py [-- <spp>]
# v022: the live model's city backdrop. The stills city (CITY_stills, beyond BAND_NEAR of the plot) is rendered from
# PIVOT_hero into a horizon band: equirectangular, 360 deg x latitude BAND_LAT, 4096 x 512 (QA: a band, not a full
# equirect, so the hero gets ~11 px/deg). Two passes: with the haze (colour) and without it on a transparent film
# (alpha = geometry coverage; the haze volume would otherwise make the whole band opaque). The result
# tex_city_band.png (RGBA) goes on CITY_card: a 700 m cylinder round PIVOT_hero with one vertex row every 2.5 deg of
# latitude (z = R tan(lat), v linear in latitude) and an unlit alpha-blended material (Mix(alpha, Transparent,
# colour) -> KHR_materials_unlit, alphaMode BLEND), baked in the Standard view (scene radiance: the live renderer
# tone-maps it once, like every surface). Hidden from render (the stills see the real city).
import bpy, bmesh, math, os, sys, time
import numpy as np
from mathutils import Vector
exec(open(r'C:\aljazira-3d\blend\scripts\render_setup.py', encoding='utf-8').read())
TEX = os.environ.get('AJ_TEX', r'C:\aljazira-3d\textures')
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SPP = int(args[0]) if args else 128
BAND_W, BAND_H, BAND_LAT = 4096, 512, (-20.0, 15.0)
BAND_NEAR = 235.0                    # nearer than this the live ring blocks stand in
R_CARD = 700.0
T0 = time.time()
sc = bpy.context.scene; O = bpy.data.objects
PIV = O['PIVOT_hero'].matrix_world.translation.copy()
PLOT_C = Vector((0.0, -25.0))
setup_world(1.0); setup_cycles(BAND_W, SPP, 0.03); apply_render_overrides()
r = sc.render; r.resolution_x, r.resolution_y = BAND_W, BAND_H; r.resolution_percentage = 100

city = {o.name for o in bpy.data.collections['CITY_stills'].all_objects}
def near(o):
    if o.type != 'MESH' or o.name in ('CITY_roads', 'CITY_walks', 'CITY_paint', 'CITY_ground', 'CITY_sea', 'CITY_haze',
                                      'CITY_lamp_poles', 'CITY_lamp_heads', 'CITY_roofkit'):
        return False
    c = sum((o.matrix_world @ Vector(b) for b in o.bound_box), Vector()) / 8
    return (c.xy - PLOT_C).length < BAND_NEAR
hide = [o for o in sc.objects if o.type in ('MESH', 'CURVE') and (o.name not in city or near(o))]
state = {o.name: o.hide_render for o in sc.objects}
for o in hide: o.hide_render = True
for o in bpy.data.collections['CITY_stills'].all_objects:
    if o.name not in {h.name for h in hide}: o.hide_render = False

cd = bpy.data.cameras.get('CAM_band') or bpy.data.cameras.new('CAM_band')
cd.type = 'PANO'
for owner in (cd, getattr(cd, 'cycles', None)):
    if owner is None: continue
    for k, v in (('panorama_type', 'EQUIRECTANGULAR'), ('latitude_min', math.radians(BAND_LAT[0])), ('latitude_max', math.radians(BAND_LAT[1])),
                 ('longitude_min', -math.pi), ('longitude_max', math.pi)):
        try: setattr(owner, k, v)
        except Exception: pass
co = O.get('CAM_band') or O.new('CAM_band', cd)
if co.name not in sc.collection.objects: sc.collection.objects.link(co)
co.location = PIV; co.rotation_euler = (math.pi / 2, 0, -math.pi / 2)      # image centre = +X, right = -Y, up = +Z
cam0 = sc.camera; sc.camera = co

vs = sc.view_settings; view0 = (vs.view_transform, vs.look)
vs.view_transform = 'Standard'; vs.look = 'None'     # radiance in the PNG: the live renderer tone-maps the card once (AgX + look)
def render(path, transparent, haze):
    O['CITY_haze'].hide_render = not haze
    r.film_transparent = transparent; r.image_settings.color_mode = 'RGBA' if transparent else 'RGB'
    r.filepath = path; bpy.ops.render.render(write_still=True)
pc = os.path.join(TEX, '_band_colour.png'); pa = os.path.join(TEX, '_band_alpha.png')
render(pc, False, True); render(pa, True, False)
for o in sc.objects: o.hide_render = state.get(o.name, o.hide_render)
r.film_transparent = False; r.image_settings.color_mode = 'RGB'; sc.camera = cam0
vs.view_transform, vs.look = view0
bpy.data.objects.remove(co, do_unlink=True)

def px(path):
    im = bpy.data.images.load(path); a = np.array(im.pixels[:], dtype=np.float32).reshape(im.size[1], im.size[0], 4)
    bpy.data.images.remove(im); return a
col, alp = px(pc), px(pa)
band = np.concatenate([col[..., :3], alp[..., 3:4]], axis=2)
band[..., :3] = np.where(alp[..., 3:4] > 0.002, band[..., :3], 0.0)
# QA: no hard cut at the band's top edge: the top 15 % of the latitudes fade out (alpha) toward the horizon sky
fr = np.clip((np.arange(BAND_H) / (BAND_H - 1) - 0.85) / 0.15, 0, 1)[:, None]      # rows bottom-first: 1 at the top
band[..., 3] *= 1 - fr * fr * (3 - 2 * fr)
im = bpy.data.images.get('tex_city_band')
if im: bpy.data.images.remove(im)
im = bpy.data.images.new('tex_city_band', BAND_W, BAND_H, alpha=True)
im.pixels.foreach_set(band.ravel())                                   # (already bottom row first, as loaded)
out = os.path.join(TEX, 'tex_city_band.png'); im.filepath_raw = out; im.file_format = 'PNG'; im.save()
bpy.data.images.remove(im)
for p in (pc, pa): os.remove(p)
img = bpy.data.images.load(out); img.colorspace_settings.name = 'sRGB'; img.alpha_mode = 'STRAIGHT'

# QA: the near-ring blocks take the card's tone. tex_city_ring is re-made from the mean colour of the band's
# buildings in its lowest (nearest) latitudes, same encoding as the band; windows: dark = 0.45 x wall, lit warm.
rows = int(BAND_H * (-5.0 - BAND_LAT[0]) / (BAND_LAT[1] - BAND_LAT[0]))       # pixels are bottom row first
low = band[:rows]; cov = low[..., 3] > 0.6
wall = np.median(low[cov][:, :3], axis=0) if cov.any() else np.array([0.3, 0.3, 0.32])
n_ = 256; rt = np.zeros((n_, n_, 4), np.float32); rt[..., 3] = 1; rt[..., :3] = wall
yy, xx = np.mgrid[0:n_, 0:n_] / n_
fu, fz = (xx * 8) % 1, (yy * 4) % 1
win = (fu > 0.22) & (fu < 0.78) & (fz > 0.3) & (fz < 0.78)
rr = np.random.default_rng(7).random((4, 8)).repeat(n_ // 4, 0).repeat(n_ // 8, 1)
rt[win, :3] = wall * 0.45
rt[win & (rr < 0.15), :3] = [0.85, 0.56, 0.30]
ri = bpy.data.images.get('tex_city_ring') or bpy.data.images.get('tex_city_ring.png')
rpath = os.path.join(TEX, 'tex_city_ring.png')
tmp = bpy.data.images.new('_ring_tmp', n_, n_); tmp.pixels.foreach_set(rt.ravel()); tmp.filepath_raw = rpath; tmp.file_format = 'PNG'; tmp.save()
bpy.data.images.remove(tmp)
for im_ in bpy.data.images:
    if im_.filepath and os.path.basename(bpy.path.abspath(im_.filepath)) == 'tex_city_ring.png': im_.reload()
print('RING tone', [round(float(c), 3) for c in wall], flush=True)

m = bpy.data.materials.get('MAT_city_card')
if m: bpy.data.materials.remove(m)
m = bpy.data.materials.new('MAT_city_card'); m.use_nodes = True; nt = m.node_tree; N, L = nt.nodes, nt.links
for n in list(N):
    if n.type != 'OUTPUT_MATERIAL': N.remove(n)
uv = N.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
t = N.new('ShaderNodeTexImage'); t.image = img; t.extension = 'EXTEND'; L.new(uv.outputs['UV'], t.inputs['Vector'])
tr = N.new('ShaderNodeBsdfTransparent'); mx = N.new('ShaderNodeMixShader')      # colour straight into the shader socket
L.new(t.outputs['Alpha'], mx.inputs['Fac']); L.new(tr.outputs[0], mx.inputs[1]); L.new(t.outputs['Color'], mx.inputs[2])   # (= emission; the exporter's unlit pattern)
L.new(mx.outputs[0], next(n for n in N if n.type == 'OUTPUT_MATERIAL').inputs['Surface'])
m.surface_render_method = 'BLENDED'; m.use_backface_culling = False

old = O.get('CITY_card')
if old: bpy.data.objects.remove(old, do_unlink=True)
bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap')
SEG = 128; lats = [BAND_LAT[0] + 2.5 * k for k in range(int((BAND_LAT[1] - BAND_LAT[0]) / 2.5) + 1)]
grid = []
for s in range(SEG + 1):
    u = s / SEG; phi = (0.5 - u) * 2 * math.pi                       # u = -atan2(y, x) / 2pi + 0.5
    grid.append([(bm.verts.new((PIV.x + R_CARD * math.cos(phi), PIV.y + R_CARD * math.sin(phi), PIV.z + R_CARD * math.tan(math.radians(la)))),
                  (u, (la - BAND_LAT[0]) / (BAND_LAT[1] - BAND_LAT[0]))) for la in lats])
for s in range(SEG):
    for k in range(len(lats) - 1):
        q = [grid[s][k], grid[s + 1][k], grid[s + 1][k + 1], grid[s][k + 1]]
        f = bm.faces.new([v for v, _ in q])
        for l, (_, t_) in zip(f.loops, q): l[uvl].uv = t_
me = bpy.data.meshes.new('CITY_card'); bm.to_mesh(me); bm.free(); me.materials.append(m)
card = O.new('CITY_card', me); bpy.data.collections['CITY_live'].objects.link(card); card.parent = O['CITY']
card.hide_render = True
for k in ('visible_diffuse', 'visible_shadow', 'visible_transmission', 'visible_volume_scatter'): setattr(card, k, False)
bpy.ops.wm.save_mainfile()
print('BAND_DONE %s %.0fs' % (out, time.time() - T0), flush=True)
