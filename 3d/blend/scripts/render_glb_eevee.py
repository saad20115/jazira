# Background job (factory startup): import ONLY the exported GLB into an empty scene and render it with
# EEVEE from CAM_hero - a stand-in for what Three.js will show (same env HDRI, no offline-only tricks).
#   blender -b --factory-startup -P render_glb_eevee.py -- <in.glb> <out.png> [facade] [interior] [camera]
import bpy, sys, math, time
args = sys.argv[sys.argv.index('--') + 1:]
glb, out = args[0], args[1]
facade = float(args[2]) if len(args) > 2 else 1.0
interior = float(args[3]) if len(args) > 3 else 1.0
HDRI = r'C:\aljazira-3d\textures\qwantani_dusk_2_puresky_2k.hdr'

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
sc = bpy.context.scene
w = bpy.data.worlds.new('env'); sc.world = w; w.use_nodes = True
nt = w.node_tree; nt.nodes.clear()
tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); env = nt.nodes.new('ShaderNodeTexEnvironment')
bg = nt.nodes.new('ShaderNodeBackground'); wo = nt.nodes.new('ShaderNodeOutputWorld')
env.image = bpy.data.images.load(HDRI); mp.inputs['Rotation'].default_value = (0, 0, math.radians(71))
bg.inputs['Strength'].default_value = 0.2
nt.links.new(tc.outputs['Generated'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], env.inputs['Vector'])
nt.links.new(env.outputs['Color'], bg.inputs['Color']); nt.links.new(bg.outputs['Background'], wo.inputs['Surface'])

def set_alpha(mat_names, a):
    for n in mat_names:
        m = bpy.data.materials.get(n)
        if not m: continue
        b = next((x for x in m.node_tree.nodes if x.type == 'BSDF_PRINCIPLED'), None)
        if b: b.inputs['Alpha'].default_value = a
set_alpha(['MAT_glass_cw', 'MAT_mullion', 'MAT_gold_fin', 'MAT_crown_glass', 'MAT_crown_light', 'MAT_podium_glass'], facade)
set_alpha(['MAT_concrete'], interior)

try: sc.render.engine = 'BLENDER_EEVEE'
except TypeError as e: print('engine', e)
cam = bpy.data.objects[args[4] if len(args) > 4 else 'CAM_hero']; sc.camera = cam
if cam.name == 'CAM_hero':
    cam.data.shift_y = -0.227                # glTF has no lens shift: the web reproduces it with setViewOffset
sc.render.resolution_x = sc.render.resolution_y = 1024; sc.render.resolution_percentage = 100
sc.view_settings.view_transform = 'AgX'
try: sc.view_settings.look = 'AgX - Medium High Contrast'
except TypeError: pass
sc.render.filepath = out
t = time.time(); bpy.ops.render.render(write_still=True)
print('EEVEE_SECONDS %.1f' % (time.time() - t), flush=True)
