# Shared helpers for the Al Jazira tower blockout (exec'd inside Blender).
import bpy, bmesh, math
from mathutils import Vector, Matrix

CLAY = (0.6, 0.6, 0.6, 1.0)
CLAY_SYS = (0.32, 0.32, 0.32, 1.0)

# Levels (metres). GF 0-5, L01 5-9 (podium), tower L02..L22 at 3.6 m, roof 84.6.
FLOOR_H = 3.6
def level_z(n):
    if n <= 0: return 0.0 if n == 0 else -5.0
    if n == 1: return 5.0
    return 9.0 + (n - 2) * FLOOR_H
ROOF_Z = level_z(23)        # 84.6
CROWN_TOP = 89.0

# R5 corner revision (brief section 8): the tower is modelled in its own plan frame (camera corner = the
# south-east corner (21, -18), lobby on the S and E faces) and the ARCH_* / SYS_* root empties turn it about the
# world origin by TOWER_ROT_DEG, so that corner faces CAM_hero. Site, cameras and lights stay in world space.
# Solved against ref\tower-render.png with CAM_hero fixed (pilaster centres x 378 / 678, lobby corner x 577, y 733).
TOWER_ROT_DEG = -32.82
TOWER_POS = (3.24, -6.73)

def to_world(p):
    """Tower plan frame -> world (2D or 3D point)."""
    c, s = math.cos(math.radians(TOWER_ROT_DEG)), math.sin(math.radians(TOWER_ROT_DEG))
    return Vector((c * p[0] - s * p[1] + TOWER_POS[0], s * p[0] + c * p[1] + TOWER_POS[1], p[2] if len(p) > 2 else 0.0))

def to_local(p):
    c, s = math.cos(math.radians(TOWER_ROT_DEG)), math.sin(math.radians(TOWER_ROT_DEG))
    x, y = p[0] - TOWER_POS[0], p[1] - TOWER_POS[1]
    return Vector((c * x + s * y, -s * x + c * y, p[2] if len(p) > 2 else 0.0))

def coll(name):
    return bpy.data.collections[name]

def root(cname):
    """Root empty named like its collection; every object in the collection is parented to it.
    ARCH_* / SYS_* roots carry the tower rotation."""
    o = bpy.data.objects.get(cname)
    if o is None:
        o = bpy.data.objects.new(cname, None)
        o.empty_display_size = 2
        coll(cname).objects.link(o)
    if o.parent is not None:              # v022: build_studio.py hangs the roots on TURNTABLE; every rebuild starts
        mw = o.matrix_world.copy()        # from world-placed roots again (else TOWER_POS became a position relative
        o.parent = None; o.matrix_world = mw   # to the turntable and the tower drifted by its offset)
    if cname.startswith(('ARCH_', 'SYS_')):
        o.location = (*TOWER_POS, 0); o.rotation_mode = 'XYZ'; o.rotation_euler = (0, 0, math.radians(TOWER_ROT_DEG))
    return o

def recentre(obj):
    """Move the origin to the bounds centre (geometry stays put). Real-time engines sort transparent
    objects by origin, so every mesh needs its own, distinct one."""
    vs = obj.data.vertices
    if not vs: return
    lo = Vector((min(v.co[i] for v in vs) for i in range(3))); hi = Vector((max(v.co[i] for v in vs) for i in range(3)))
    c = (lo + hi) / 2
    obj.data.transform(Matrix.Translation(-c))
    obj.location = obj.location + c

def _finish(obj, cname, sys=False):
    coll(cname).objects.link(obj)
    recentre(obj)
    obj.parent = root(cname)
    m = bpy.data.materials.get('MAT_clay_sys' if sys else 'MAT_clay')   # build_materials.py assigns the real ones
    obj.data.materials.clear()
    if m: obj.data.materials.append(m)
    obj.color = CLAY_SYS if sys else CLAY
    return obj

def replace(name):
    o = bpy.data.objects.get(name)
    if o is not None:
        me = o.data
        bpy.data.objects.remove(o, do_unlink=True)
        if me is not None and me.users == 0 and isinstance(me, bpy.types.Mesh):
            bpy.data.meshes.remove(me)

def mesh_from_bm(name, bm):
    replace(name)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    return bpy.data.objects.new(name, me)

def add_box(bm, x0, y0, z0, x1, y1, z1, bottom=True):
    vs = [bm.verts.new(v) for v in [(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),
                                     (x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)]]
    faces = [(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)] + ([(0,3,2,1)] if bottom else [])
    for f in faces:
        bm.faces.new([vs[i] for i in f])

def add_cyl(bm, cx, cy, z0, z1, r, seg=6, axis='Z', caps=True):
    """Cylinder along Z (or X/Y), from z0 to z1 along that axis; cx, cy are the other two coords."""
    def P(a, h):
        u, v = cx + r*math.cos(a), cy + r*math.sin(a)
        return {'Z': (u, v, h), 'X': (h, u, v), 'Y': (u, h, v)}[axis]
    bot = [bm.verts.new(P(2*math.pi*i/seg, z0)) for i in range(seg)]
    top = [bm.verts.new(P(2*math.pi*i/seg, z1)) for i in range(seg)]
    if caps: bm.faces.new(bot[::-1]); bm.faces.new(top)
    for i in range(seg):
        j = (i+1) % seg
        bm.faces.new([bot[i], bot[j], top[j], top[i]])

def boxes(name, cname, items, sys=False):
    """items: list of (x0,y0,z0,x1,y1,z1)."""
    bm = bmesh.new()
    for b in items: add_box(bm, *b)
    return _finish(mesh_from_bm(name, bm), cname, sys)

def build(name, cname, fn, sys=False):
    """fn(bm) fills the bmesh."""
    bm = bmesh.new(); fn(bm)
    return _finish(mesh_from_bm(name, bm), cname, sys)

def walls(bm, pts, z0, z1, closed=True):
    """Open vertical walls (no caps) along a 2D polyline."""
    n = len(pts)
    rng = range(n) if closed else range(n-1)
    for i in rng:
        a, b = pts[i], pts[(i+1) % n]
        vs = [bm.verts.new(v) for v in [(a[0],a[1],z0),(b[0],b[1],z0),(b[0],b[1],z1),(a[0],a[1],z1)]]
        bm.faces.new(vs)

def poly_slab(bm, pts, z0, z1):
    bot = [bm.verts.new((x, y, z0)) for x, y in pts]
    top = [bm.verts.new((x, y, z1)) for x, y in pts]
    bm.faces.new(bot[::-1]); bm.faces.new(top)
    n = len(pts)
    for i in range(n):
        j = (i+1) % n
        bm.faces.new([bot[i], bot[j], top[j], top[i]])

def uv_world(obj, su, sv, ou=0.0, ov=0.0, top_uv=None, name='UVMap'):
    """Planar world-space UVs per face: walls get u along the face (read from outside), v = (z+ov)/sv;
    up/down faces get (x/su, y/sv), or the fixed top_uv if given."""
    me = obj.data
    uv = me.uv_layers.get(name) or me.uv_layers.new(name=name)
    bpy.context.view_layer.update()                     # matrix_world must include the recentred origin
    mw = obj.matrix_world
    if obj.parent is not None and obj.parent.name.startswith(('ARCH_', 'SYS_')):
        mw = obj.parent.matrix_world.inverted() @ mw     # tower plan frame (the root carries the tower turn)
    for poly in me.polygons:
        n = (mw.to_3x3() @ poly.normal).normalized()
        for li in poly.loop_indices:
            p = mw @ me.vertices[me.loops[li].vertex_index].co
            if abs(n.z) > 0.7:
                uv.data[li].uv = top_uv if top_uv is not None else (p.x / su + ou, p.y / sv)
            else:
                t = Vector((-n.y, n.x)).normalized()
                uv.data[li].uv = ((p.x * t.x + p.y * t.y) / su + ou, (p.z + ov) / sv)
    me.uv_layers.active = uv
