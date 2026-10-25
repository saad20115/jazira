# Background job: blender -b aljazira_tower.blend -P render_plan_view.py -- <out.png> [res_x] [site]
# Corner-proof plan (top) view: clay Workbench, orthographic, from above, with CAM_hero marked: position, view
# direction (optical axis) and the horizontal frustum edges, plus labels for the camera corner and both pilasters.
# Temporary objects only; nothing is saved.
import bpy, sys, math
from mathutils import Vector
exec(open(r'C:\aljazira-3d\blend\scripts\lib.py').read())
args = sys.argv[sys.argv.index('--') + 1:]
out = args[0]; rx = int(args[1]) if len(args) > 1 else 1400
site = len(args) > 2 and args[2] == "site"          # close-up of the plot (frustum lines run in from CAM_hero)
sc = bpy.context.scene; O = bpy.data.objects
hero = O['CAM_hero']; cp = hero.matrix_world.translation.copy()
fwd = hero.matrix_world.to_quaternion() @ Vector((0, 0, -1)); fwd.z = 0; fwd.normalize()
half = math.atan(hero.data.sensor_width / 2 / hero.data.lens)                 # horizontal half angle

tmp = bpy.data.collections.new('PLAN_TMP'); sc.collection.children.link(tmp)
def mat(name, rgba):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name); m.diffuse_color = rgba; return m
RED, GOLD, WHITE = mat('PL_red', (0.9, 0.1, 0.1, 1)), mat('PL_gold', (1.0, 0.7, 0.1, 1)), mat('PL_white', (1, 1, 1, 1))
def line(name, a, b, w, m, z=95.0):
    bm = bmesh.new(); d = (b - a); d.z = 0; L = d.length; d.normalize(); s = Vector((-d.y, d.x, 0)) * w / 2
    vs = [bm.verts.new((p.x, p.y, z)) for p in (a - s, a + s, b + s, b - s)]; bm.faces.new(vs)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = O.new(name, me); tmp.objects.link(o); o.color = m.diffuse_color; me.materials.append(m); return o
def label(text, p, size, m, z=96.0):
    cu = bpy.data.curves.new(text, 'FONT'); cu.body = text; cu.size = size; cu.align_x = 'CENTER'
    o = O.new('PL_' + text, cu); tmp.objects.link(o); o.location = (p.x, p.y, z); o.color = m.diffuse_color
    cu.materials.append(m); return o
def disc(name, p, r, m, z=95.5):
    bm = bmesh.new(); vs = [bm.verts.new((p.x + r * math.cos(a * math.pi / 12), p.y + r * math.sin(a * math.pi / 12), z)) for a in range(24)]
    bm.faces.new(vs); me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = O.new(name, me); tmp.objects.link(o); o.color = m.diffuse_color; me.materials.append(m); return o

L = 330.0
for sgn in (-1, 1):
    d = Vector((fwd.x * math.cos(half) - sgn * fwd.y * math.sin(half), sgn * fwd.x * math.sin(half) + fwd.y * math.cos(half), 0))
    line('PL_frustum_%d' % sgn, cp, cp + d * L, 0.8, RED)
line('PL_axis', cp, cp + fwd * L, 0.5, WHITE)
disc('PL_cam', cp, 4.0, RED); label('CAM_hero', cp + Vector((0, -12, 0)), 8, RED)
corner = to_world((21.0, -18.0)); disc('PL_corner', corner, 1.6, GOLD); label('corner', corner + Vector((14, -6, 0)), 5, GOLD)
for nm, p in (('left pilaster', to_world((-21.0, -18.6))), ('right pilaster', to_world((21.6, 0.1)))):
    disc('PL_' + nm, p, 1.6, GOLD); label(nm, p + Vector((0, -7, 0)) if 'left' in nm else p + Vector((18, 2, 0)), 5, GOLD)

# orthographic top camera framing tower + CAM_hero
xs, ys = ([-75, 85], [-105, 45]) if site else ([cp.x, corner.x, -60, 70], [cp.y, -20, 45])
cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
w, h = max(xs) - min(xs) + 40, max(ys) - min(ys) + 40
cd = bpy.data.cameras.new('PL_top'); cd.type = 'ORTHO'; cd.ortho_scale = max(w, h)
cam = O.new('PL_top', cd); tmp.objects.link(cam); cam.location = (cx, cy, 300); cam.rotation_euler = (0, 0, 0)
sc.camera = cam
sc.render.resolution_x = rx; sc.render.resolution_y = int(rx * h / w); sc.render.resolution_percentage = 100
cd.sensor_fit = 'VERTICAL' if h > w else 'HORIZONTAL'
try: sc.render.engine = 'BLENDER_WORKBENCH'
except TypeError: sc.render.engine = 'BLENDER_WORKBENCH_NEXT'
sh = sc.display.shading; sh.light = 'STUDIO'; sh.color_type = 'OBJECT'; sh.show_cavity = True; sh.show_shadows = False
sc.render.film_transparent = False; sc.world.color = (0.05, 0.05, 0.06)
for o in sc.objects:                                               # hide the far ground fade, keep everything else
    if o.name in ('SITE_ground',): o.hide_render = True
for o in [o for o in sc.objects if o.type == 'MESH' and o.name.startswith(('FAC_', 'CORE_', 'POD_'))]:
    o.color = (0.75, 0.75, 0.75, 1)
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print('PLAN_DONE', out, sc.render.resolution_x, sc.render.resolution_y,
      'cam', tuple(round(c, 1) for c in cp), 'corner', tuple(round(c, 1) for c in corner))
