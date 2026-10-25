# Background job: blender -b aljazira_tower.blend -P bake_lamp_pools.py      (does NOT save the .blend)
# R4: bakes what the Cycles hero shows on the plaza and the ring road at night (street-lamp pools, plus the glow
# of the lit facade / podium; not the light trails, v021) into one top-down texture, so the web gets the pools at zero cost.
# Method: a white, flat proxy plane just above street level over the lamp area; Cycles DIFFUSE bake, direct
# light only, no colour (= the radiance a white surface would reflect); the HDRI is switched off because the web
# lights the scene with the same HDRI itself. Output:
#   textures\tex_lamp_pools.png  (sRGB, normalised to 1)  +  tex_lamp_pools.json {bbox, z, scale}
# export_glb.py projects it onto SITE_plaza / SITE_roads / SITE_planting through a planar 'POOL' UV and wires
# it as their emissive texture (strength = scale x material albedo). The master's Cycles renders never use it.
import bpy, json, os, time
import numpy as np
exec(open(r'C:\aljazira-3d\blend\scripts\render_setup.py', encoding='utf-8').read())
TEX = __import__('os').environ.get('AJ_TEX', r'C:\aljazira-3d\textures') + r''
GZ = -0.6
W, H = 1024, 512
MARGIN = 16.0

lamps = [o.matrix_world.translation for o in bpy.data.objects if o.name.startswith(('LGT_lamp_', 'LGT_canopy_'))]
x0 = min(p.x for p in lamps) - MARGIN; x1 = max(p.x for p in lamps) + MARGIN
y0 = min(p.y for p in lamps) - MARGIN; y1 = max(p.y for p in lamps) + MARGIN
z = GZ + 0.03

setup_cycles(256, 1024, 0.01)
setup_world(0.0)
bpy.context.scene.cycles.use_denoising = False
for n in ('SITE_planting', 'SITE_ground'):                 # raised islands would shadow the plane below them
    bpy.data.objects[n].hide_render = True
for n in ('SITE_trails_white', 'SITE_trails_red'):         # v021 (owner N-4): the trails' own glow on the road baked
    bpy.data.objects[n].hide_render = True                 # into a wide white band in live; the ribbons stay thin lines

me = bpy.data.meshes.new('POOL_proxy')
me.from_pydata([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], [], [(0, 1, 2, 3)])
uv = me.uv_layers.new(name='UVMap')
for li, (u, v) in zip(range(4), ((0, 0), (1, 0), (1, 1), (0, 1))): uv.data[li].uv = (u, v)
ob = bpy.data.objects.new('POOL_proxy', me); bpy.context.scene.collection.objects.link(ob)
mat = bpy.data.materials.new('POOL_proxy'); mat.use_nodes = True
b = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
b.inputs['Base Color'].default_value = (1, 1, 1, 1); b.inputs['Roughness'].default_value = 1.0
me.materials.append(mat)
img = bpy.data.images.new('POOL_bake', W, H, alpha=False, float_buffer=True)
tn = mat.node_tree.nodes.new('ShaderNodeTexImage'); tn.image = img; mat.node_tree.nodes.active = tn

bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True); bpy.context.view_layer.objects.active = ob
t = time.time()
bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT'}, use_clear=True, margin=2, target='IMAGE_TEXTURES')
print('POOL bake %.1fs' % (time.time() - t), flush=True)

px = np.array(img.pixels[:], np.float32).reshape(H, W, 4)[..., :3]          # linear radiance of a white surface
D = np.arange(-4, 5); k = np.exp(-D ** 2 / (2 * 1.6 ** 2)); k /= k.sum()   # Gaussian (sigma 1.6 px ~ 0.2 m) vs bake noise
for ax in (0, 1):
    px = sum(np.roll(px, d, axis=ax) * w for d, w in zip(D, k))
px[[0, -1], :, :] = 0; px[:, [0, -1], :] = 0                             # black border: CLAMP_TO_EDGE fades to 0
scale = float(np.percentile(px.max(axis=2), 99.9))
n = np.clip(px / scale, 0, 1)
srgb = np.where(n <= 0.0031308, n * 12.92, 1.055 * np.power(n, 1 / 2.4) - 0.055)
out = bpy.data.images.new('tex_lamp_pools', W, H, alpha=False)
rgba = np.ones((H, W, 4), np.float32); rgba[..., :3] = srgb
out.pixels.foreach_set(rgba.ravel())
path = os.path.join(TEX, 'tex_lamp_pools.png'); out.filepath_raw = path; out.file_format = 'PNG'; out.save()
info = dict(bbox=[round(x0, 3), round(y0, 3), round(x1, 3), round(y1, 3)], z=z, scale=round(scale, 5),
            size=[W, H], lamps=len(lamps), max_raw=round(float(px.max()), 5))
json.dump(info, open(os.path.join(TEX, 'tex_lamp_pools.json'), 'w'), indent=1)
print('POOL', json.dumps(info), flush=True)
