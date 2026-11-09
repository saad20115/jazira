# Background job, after build_city.py:  blender -b work.blend -P bake_city_ground.py [-- <spp>]
# v022 (QA): the live model's ground out to the near-ring blocks. A top-down orthographic Cycles render of the stills
# city's ground (streets, sidewalks, lane paint, lamp pools, cars, tree / palm / shrub canopies; no buildings, lamp
# heads, haze, tower or live meshes) over +-GROUND_HALF m round the plot -> tex_city_ground.png (1024, RGBA: alpha 1
# inside FADE[0], smoothstep to 0 at FADE[1] = the SITE_ground disc fade). MAT_ground_live (unlit: Mix(alpha,
# Transparent, colour) -> KHR_materials_unlit, BLEND) reads it on a planar 'UVGround' layer of SITE_ground;
# export_glb.py puts it on SITE_ground (the Cycles stills hide SITE_ground: the real city ground is there).
import bpy, bmesh, math, os, sys, time
import numpy as np
from mathutils import Vector
exec(open(r'C:\aljazira-3d\blend\scripts\render_setup.py', encoding='utf-8').read())
TEX = os.environ.get('AJ_TEX', r'C:\aljazira-3d\textures')
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SPP = int(args[0]) if args else 128
RES, GROUND_HALF, FADE = 2048, 240.0, (205.0, 240.0)
PLOT_C = Vector((0.0, -25.0))
T0 = time.time()
sc = bpy.context.scene; O = bpy.data.objects
setup_world(1.0); setup_cycles(RES, SPP, 0.03); apply_render_overrides()
r = sc.render; r.resolution_x = r.resolution_y = RES; r.resolution_percentage = 100
vs = sc.view_settings; view0 = (vs.view_transform, vs.look); vs.view_transform = 'Standard'; vs.look = 'None'   # radiance, as the band

keep_site = {'SITE_plaza', 'SITE_roads', 'SITE_planting'}
city = {o.name for o in bpy.data.collections['CITY_stills'].all_objects}
def shown(o):
    if o.name in keep_site: return True
    if o.name not in city: return False
    return not o.name.startswith(('CITY_blk_', 'CITY_roofkit', 'CITY_haze', 'CITY_lamp_heads', 'CITY_lamp_poles'))
state = {o.name: o.hide_render for o in sc.objects}
for o in sc.objects:
    if o.type in ('MESH', 'CURVE'): o.hide_render = not shown(o)
cd = bpy.data.cameras.new('CAM_groundbake'); cd.type = 'ORTHO'; cd.ortho_scale = 2 * GROUND_HALF; cd.clip_end = 1000
co = O.new('CAM_groundbake', cd); sc.collection.objects.link(co)
co.location = (PLOT_C.x, PLOT_C.y, 400.0); co.rotation_euler = (0, 0, 0)          # looking down, image up = +Y
cam0 = sc.camera; sc.camera = co
tmp = os.path.join(TEX, '_ground_rgb.png'); r.filepath = tmp; bpy.ops.render.render(write_still=True)
for o in sc.objects: o.hide_render = state.get(o.name, o.hide_render)
sc.camera = cam0; bpy.data.objects.remove(co, do_unlink=True); bpy.data.cameras.remove(cd)
vs.view_transform, vs.look = view0

im = bpy.data.images.load(tmp); px = np.array(im.pixels[:], dtype=np.float32).reshape(RES, RES, 4); bpy.data.images.remove(im)
c = (np.arange(RES) + 0.5) / RES * 2 * GROUND_HALF - GROUND_HALF
X, Y = np.meshgrid(c, c)                                                # row 0 = bottom (-Y) as loaded
rad = np.hypot(X, Y); t = np.clip((rad - FADE[0]) / (FADE[1] - FADE[0]), 0, 1)
px[..., 3] = 1 - t * t * (3 - 2 * t)
# the aerial fade the hero sees through the stills haze (none in live): toward the dusk horizon radiance with distance
k = (0.10 + 0.30 * np.clip((rad - 60) / 180, 0, 1) ** 1.5)[..., None]
px[..., :3] = px[..., :3] * (1 - k) + np.array([0.52, 0.58, 0.71]) * k
out = os.path.join(TEX, 'tex_city_ground.png')
gi = bpy.data.images.new('_ground', RES, RES, alpha=True); gi.pixels.foreach_set(px.ravel()); gi.filepath_raw = out; gi.file_format = 'PNG'; gi.save()
bpy.data.images.remove(gi); os.remove(tmp)
for im_ in list(bpy.data.images):
    if im_.filepath and os.path.basename(bpy.path.abspath(im_.filepath)) == 'tex_city_ground.png': bpy.data.images.remove(im_)
img = bpy.data.images.load(out); img.colorspace_settings.name = 'sRGB'; img.alpha_mode = 'STRAIGHT'

g = O['SITE_ground']; me = g.data
uv = me.uv_layers.get('UVGround') or me.uv_layers.new(name='UVGround')
mw = g.matrix_world
for l in me.loops:
    w = mw @ me.vertices[l.vertex_index].co
    uv.data[l.index].uv = ((w.x - PLOT_C.x + GROUND_HALF) / (2 * GROUND_HALF), (w.y - PLOT_C.y + GROUND_HALF) / (2 * GROUND_HALF))
m = bpy.data.materials.get('MAT_ground_live')
if m: bpy.data.materials.remove(m)
m = bpy.data.materials.new('MAT_ground_live'); m.use_nodes = True; N, L = m.node_tree.nodes, m.node_tree.links
for n in list(N):
    if n.type != 'OUTPUT_MATERIAL': N.remove(n)
un = N.new('ShaderNodeUVMap'); un.uv_map = 'UVGround'
tn = N.new('ShaderNodeTexImage'); tn.image = img; tn.extension = 'EXTEND'; L.new(un.outputs['UV'], tn.inputs['Vector'])
tr = N.new('ShaderNodeBsdfTransparent'); mx = N.new('ShaderNodeMixShader')       # colour straight in: unlit on export
L.new(tn.outputs['Alpha'], mx.inputs['Fac']); L.new(tr.outputs[0], mx.inputs[1]); L.new(tn.outputs['Color'], mx.inputs[2])
L.new(mx.outputs[0], next(n for n in N if n.type == 'OUTPUT_MATERIAL').inputs['Surface'])
m.surface_render_method = 'BLENDED'; m.use_fake_user = True
bpy.ops.wm.save_mainfile()
print('GROUND_DONE %s %.0fs' % (out, time.time() - T0), flush=True)
