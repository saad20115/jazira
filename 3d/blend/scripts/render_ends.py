# Background job: blender -b aljazira_tower.blend -P render_ends.py -- <out_dir> [res] [samples] [systems]
# Per system: Cycles still from CAM_<s> in exactly the live "entered" state (entry_views.py): facade / interior
# opacity, glass emission scale, the other systems faded, the system's own floor slabs solid, the system in its gold
# highlight material, and the section plane cutting facade + interior on the camera side (a shader mask here, a
# clipping plane on the web). Plus hotspots_<s>.json (HOT_ projected, 0-1, origin top-left). Nothing is saved back.
import bpy, sys, os, json, time
from bpy_extras.object_utils import world_to_camera_view
exec(open(r'C:\aljazira-3d\blend\scripts\render_setup.py', encoding='utf-8').read())
exec(open(r'C:\aljazira-3d\blend\scripts\entry_views.py', encoding='utf-8').read())
args = sys.argv[sys.argv.index('--') + 1:]
out_dir = args[0]; res = int(args[1]) if len(args) > 1 else 2048; spp = int(args[2]) if len(args) > 2 else 256
systems = args[3].split(',') if len(args) > 3 else ['hvac', 'fire', 'plumbing', 'power', 'smart']
ALL = ['hvac', 'fire', 'plumbing', 'power', 'smart']
FACADE = ['MAT_glass_cw', 'MAT_glass_wing', 'MAT_glass_side', 'MAT_glass_terrace', 'MAT_mullion', 'MAT_gold_fin',
          'MAT_crown_light', 'MAT_podium_glass']
GLASS = ['MAT_glass_cw', 'MAT_glass_wing', 'MAT_glass_side', 'MAT_glass_terrace', 'MAT_podium_glass']
O, M = bpy.data.objects, bpy.data.materials
os.makedirs(out_dir, exist_ok=True)

def bsdf(m): return next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')

def masked_alpha(m, a):
    """Alpha = a x section mask; the mask's plane is set per system (SEC_n / SEC_c). Returns the plane nodes."""
    nt = m.node_tree; b = bsdf(m)
    m.surface_render_method = 'BLENDED'
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    nv = nt.nodes.new('ShaderNodeCombineXYZ'); nv.name = 'SEC_n'
    dot = nt.nodes.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'
    nt.links.new(geo.outputs['Position'], dot.inputs[0]); nt.links.new(nv.outputs['Vector'], dot.inputs[1])
    add = nt.nodes.new('ShaderNodeMath'); add.operation = 'ADD'; add.name = 'SEC_c'
    nt.links.new(dot.outputs['Value'], add.inputs[0])
    keep = nt.nodes.new('ShaderNodeMath'); keep.operation = 'GREATER_THAN'; keep.inputs[1].default_value = 0.0
    nt.links.new(add.outputs[0], keep.inputs[0])
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = a
    nt.links.new(keep.outputs[0], mul.inputs[0]); nt.links.new(mul.outputs[0], b.inputs['Alpha'])
    return nv, add

def set_plane(planes, n, c):
    for nv, add in planes:
        nv.inputs['X'].default_value, nv.inputs['Y'].default_value, nv.inputs['Z'].default_value = n
        add.inputs[1].default_value = c

setup_world(1.0); setup_cycles(res, spp, 0.02); apply_render_overrides()
sc = bpy.context.scene
sc.cycles.transparent_max_bounces = 64                       # 24 slabs + glass layers
planes = [masked_alpha(M[n], ENTER['facade_opacity']) for n in FACADE if n in M]
planes.append(masked_alpha(M['MAT_concrete'], ENTER['interior_opacity']))
planes.append(masked_alpha(M['MAT_concrete_floor'], ENTER['interior_opacity']))
for n in GLASS:
    if n in M: bsdf(M[n]).inputs['Emission Strength'].default_value *= ENTER['glass_emissive_scale']
floor_mat = M['MAT_concrete_floor'].copy(); floor_mat.name = 'MAT_concrete_kept'
fb = bsdf(floor_mat); [floor_mat.node_tree.links.remove(l) for l in list(fb.inputs['Alpha'].links)]
fb.inputs['Alpha'].default_value = 1.0
for s in ALL:                                                # faded copies of every system's rest + glow (+ fans) material
    for kind in ('metal', 'glow', 'fans'):
        if 'MAT_%s_%s' % (s, kind) not in M: continue
        f = M['MAT_%s_%s' % (s, kind)].copy(); f.name = 'MAT_%s_%s_faded' % (s, kind)
        bsdf(f).inputs['Alpha'].default_value = ENTER['other_systems_opacity']; f.surface_render_method = 'BLENDED'
        for l in list(bsdf(f).inputs['Alpha'].links):            # textured alpha (fan blades): scale it instead
            mul = f.node_tree.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
            mul.inputs[1].default_value = ENTER['other_systems_opacity']
            f.node_tree.links.new(l.from_socket, mul.inputs[0]); f.node_tree.links.new(mul.outputs['Value'], bsdf(f).inputs['Alpha'])

def sys_meshes(s): return [o for o in bpy.data.collections['SYS_' + s].objects if o.type == 'MESH']
def kind(o): return 'glow' if o.name.endswith('_glow') else 'fans' if o.name.endswith('_fans') else 'metal'

log = []
for s in systems:
    t = time.time()
    root = O['SYS_' + s]
    n, q = section_blender(s); set_plane(planes, tuple(n), -n.dot(q))
    slabs = [O[x] for x in root['floor_slabs'].split(',')]
    for o in slabs: o.material_slots[0].material = floor_mat
    for o in sys_meshes(s):                                  # equipment -> highlight; its glow mesh shows (only here)
        if kind(o) == 'metal': o.material_slots[0].material = M['MAT_%s_highlight' % s]
        else: o.hide_render = False
    for other in ALL:
        if other != s:
            for o in sys_meshes(other):                      # the others step back; their glow stays hidden
                if kind(o) in ('metal', 'fans'): o.material_slots[0].material = M['MAT_%s_%s_faded' % (other, kind(o))]
    cam = O['CAM_' + s]; sc.camera = cam; sc.frame_set(1)
    sc.render.filepath = os.path.join(out_dir, '%s_end_%d.png' % (s, res))
    bpy.ops.render.render(write_still=True)
    secs = time.time() - t
    pts = []
    for h in sorted([o for o in O if o.name.startswith('HOT_%s_' % s)], key=lambda o: o.name):
        v = world_to_camera_view(sc, cam, h.matrix_world.translation)
        pts.append({'id': h.name, 'label': h.get('label', ''), 'x': round(v.x, 4), 'y': round(1 - v.y, 4),
                    'in_frame': bool(0 <= v.x <= 1 and 0 <= v.y <= 1 and v.z > 0),
                    'world': [round(c, 3) for c in h.matrix_world.translation]})
    json.dump({'shot': s, 'camera': cam.name, 'image': os.path.basename(sc.render.filepath), 'resolution': [res, res],
               'origin': 'top-left', 'note': 'x/y may fall outside 0-1 for anchors out of frame: filter on in_frame',
               'points': pts}, open(os.path.join(out_dir, 'hotspots_%s.json' % s), 'w'), indent=1)
    for o in slabs: o.material_slots[0].material = M['MAT_concrete_floor']
    for x in ALL:
        for o in sys_meshes(x):
            o.material_slots[0].material = M['MAT_%s_%s' % (x, kind(o))]
            if kind(o) == 'glow': o.hide_render = True
    log.append('%s %.1fs' % (s, secs)); print('DONE', log[-1], flush=True)
