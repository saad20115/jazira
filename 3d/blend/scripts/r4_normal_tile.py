# Background job: blender -b aljazira_tower.blend -P r4_normal_tile.py -- <increment_name>
# R4: tex_cw_normal becomes one 64 x 128 module tile repeated 64 x 24 (Mapping node -> KHR_texture_transform),
# applied to the existing MAT_glass_cw without rebuilding the other materials (keeps their baked AO wiring).
import bpy, sys
S = r'C:\aljazira-3d\blend\scripts'
args = sys.argv[sys.argv.index('--') + 1:]
src = open(S + r'\build_textures.py', encoding='utf-8').read()
src = src[:src.rindex('cw_emit(); cw_normal()')]          # definitions only; regenerate just the normal tile
exec(src)
img = cw_normal()

m = bpy.data.materials['MAT_glass_cw']; nt = m.node_tree
nm = next(n for n in nt.nodes if n.type == 'NORMAL_MAP')
ni = nm.inputs['Color'].links[0].from_node
old = ni.image
ni.image = img; ni.extension = 'REPEAT'
if old is not None and old != img and old.users == 0: bpy.data.images.remove(old)
mp = nt.nodes.get('NRM_repeat')
if mp is None:
    uv_sock = ni.inputs['Vector'].links[0].from_socket
    mp = nt.nodes.new('ShaderNodeMapping'); mp.name = 'NRM_repeat'; mp.vector_type = 'POINT'
    mp.location = (ni.location.x - 200, ni.location.y)
    nt.links.new(uv_sock, mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], ni.inputs['Vector'])
mp.inputs['Scale'].default_value = (CW_NORMAL_REPEAT[0], CW_NORMAL_REPEAT[1], 1.0)
print('NORMAL_TILE', tuple(img.size), 'repeat', CW_NORMAL_REPEAT, flush=True)
bpy.ops.wm.save_mainfile()
if args:
    bpy.ops.wm.save_as_mainfile(filepath=r'C:\aljazira-3d\blend\%s.blend' % args[0], copy=True)
print('SAVED', flush=True)
