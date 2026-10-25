# Live-model view rig (brief section 6): CAM_hero, and per system CAM_<s> (entry view), PIVOT_<s>
# (orbit centre), PATH_<s>_<n> (waypoints, only where a straight hero->CAM move clips geometry) and
# HOT_<s>_<n> (label anchors). Also the facade_opacity property + Workbench alpha drivers.
exec(open(r'C:\aljazira-3d\blend\scripts\lib.py').read())
from mathutils import Euler

HERO = dict(loc=Vector((68.3, -252.5, 65.5)), rot=Euler((math.radians(90), 0, math.radians(16.67)), 'XYZ'),
            lens=63.28, shift_y=-0.227)

# pivot / eye / hot are in the tower plan frame (lib.py TOWER_ROT_DEG); CAM_<s> and the move path are placed with
# to_world(), PIVOT_ / HOT_ / PATH_ empties sit under the (turned) SYS_ roots. Corner revision: the entry cameras
# come from entry_search.py run on the corner massing (>= 3 anchors in frame, the system filling >= 30 %).
SYSTEMS = {
    'hvac':     dict(pivot=(-5.4, 3.5, 71.2),   eye=(30.2, 5.2, 103.3),   lens=32.0, hot=[   # QA: pulled back, roof edge + crown frame the plant (42 %)
        ('chillers', (-14.0, 10.9, 86.5)), ('cooling_towers', (9.75, 12.8, 88.5)), ('ahus_roof', (-16.0, 2.0, ROOF_Z + 2.6)),
        ('duct_riser', (-6.8, 7.7, 46.0)), ('fcus_L12', (0.0, -16.0, level_z(12) + 2.7))]),
    'fire':     dict(pivot=(-2.8, -0.6, 24.1),  eye=(29.4, -17.1, 35.8),  lens=24.0, hot=[
        ('fire_pumps', (-27.5, 8.5, 1.2)), ('jockey_pump', (-22.9, 5.4, 1.2)), ('sprinkler_riser', (-5.0, 7.5, 30.0)),
        ('floor_mains_L10', (0.0, -8.0, level_z(10) + 2.9)), ('alarm_panel', (-3.3, -1.4, 1.6))]),
    'plumbing': dict(pivot=(-4.9, 12.1, 10.8), eye=(-5.7, 29.8, 14.0),   lens=24.0, hot=[
        ('break_tanks', (-11.5, 14.75, 1.7)), ('booster_pumps', (0.0, 13.8, 0.8)), ('water_risers', (-3.1, 7.8, 30.0)),
        ('drainage_stacks', (4.15, 7.8, 20.0)), ('roof_tank', (-28.0, -3.75, 86.0))]),
    'power':    dict(pivot=(10.0, 13.8, 1.2),   eye=(9.3, 27.1, 13.3),    lens=32.0, hot=[
        ('generator', (11.2, 20.2, 1.6)), ('transformers', (8.5, 10.5, 1.3)), ('mv_switchgear', (7.5, 16.6, 1.2)),
        ('lv_panels', (14.0, 14.2, 1.2)), ('cable_risers', (-0.3, 7.15, 30.0))]),
    'smart':    dict(pivot=(-27.5, 10.5, 6.3),  eye=(-40.8, 17.3, 16.4),  lens=32.0, hot=[   # pivot on the data room (QA: 180 deg orbit keeps it), 34 deg up
        ('bms_data_room', (-28.6, 10.0, 6.3)), ('bms_console', (-24.1, 14.0, 6.2)), ('elv_riser', (2.8, 7.15, 30.0)),
        ('cctv_entrance', (-5.0, -18.6, 5.4)), ('access_control', (0.0, -5.2, 0.6))]),
}

def make_cam(name, lens, shift_y):
    cd = bpy.data.cameras.get(name) or bpy.data.cameras.new(name)
    cd.animation_data_clear()
    cd.sensor_fit = 'HORIZONTAL'; cd.sensor_width = 36.0
    cd.lens = lens; cd.shift_y = shift_y; cd.clip_start = 0.5; cd.clip_end = 5000
    o = bpy.data.objects.get(name)
    if o is None:
        o = bpy.data.objects.new(name, cd); coll('CAMERAS').objects.link(o)
    o.data = cd; o.animation_data_clear(); o.parent = root('CAMERAS')
    return o

def empty(name, cname, loc, shape='SPHERE', size=1.0):
    o = bpy.data.objects.get(name)
    if o is None:
        o = bpy.data.objects.new(name, None); coll(cname).objects.link(o)
    o.empty_display_type = shape; o.empty_display_size = size
    o.parent = root(cname); o.matrix_parent_inverse.identity()
    o.location = Vector(loc)
    return o

for o in [o for o in bpy.data.objects if o.name.startswith(('PATH_', 'HOT_', 'PIVOT_'))]:
    bpy.data.objects.remove(o, do_unlink=True)

hero = make_cam('CAM_hero', HERO['lens'], HERO['shift_y'])
hero.location = HERO['loc']; hero.rotation_mode = 'XYZ'; hero.rotation_euler = HERO['rot']
bpy.context.view_layer.update()
# PIVOT_hero: the point on the hero optical axis nearest the tower axis. Orbit target for the first view;
# looking at it from CAM_hero reproduces CAM_hero's rotation exactly (shift_y is lens-only).
fwd = hero.matrix_world.to_quaternion() @ Vector((0, 0, -1))
ax, ay = TOWER_POS                             # the tower axis (corner revision: the tower is moved and turned)
t = -((HERO['loc'].x - ax)*fwd.x + (HERO['loc'].y - ay)*fwd.y) / (fwd.x**2 + fwd.y**2)
empty('PIVOT_hero', 'CAMERAS', HERO['loc'] + fwd*t, 'SPHERE', 2.0)

CLEAR = 8.0                                    # metres of clearance a move must keep from the building
def clips(a, b):
    """Does a tube around the straight segment a->b (8 m sideways/up, 4 m down) hit any geometry?
    SITE (ground, plaza, palms, lamps) is ignored; facade, core, podium, systems and context count."""
    sc = bpy.context.scene; dg = bpy.context.evaluated_depsgraph_get()
    d = b - a; L = d.length; dn = d.normalized()
    side = dn.cross(Vector((0, 0, 1))); side = side.normalized() if side.length > 1e-6 else Vector((1, 0, 0))
    up = side.cross(dn).normalized()
    site = {o.name for o in coll('SITE').objects}
    for off in (Vector(), side*CLEAR, -side*CLEAR, up*CLEAR, -up*CLEAR/2):
        ok, loc, n, i, ob, m = sc.ray_cast(dg, a + off, dn, distance=L)
        if ok and ob.name not in site: return ob.name
    return None

report = {}
for s, cfg in SYSTEMS.items():
    cname = 'SYS_' + s
    piv = to_world(cfg['pivot']); eye = to_world(cfg['eye'])
    cam = make_cam('CAM_' + s, cfg['lens'], 0.0)
    cam.location = eye; cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = (piv - eye).to_track_quat('-Z', 'Y')
    empty('PIVOT_' + s, cname, cfg['pivot'], 'SPHERE', 1.5)
    for n, (label, p) in enumerate(cfg['hot'], 1):
        h = empty('HOT_%s_%d' % (s, n), cname, p, 'SINGLE_ARROW', 1.2)
        h['label'] = label
    # waypoints: walk an orbit around the moving pivot (hero -> system); keep adding the orbit point that
    # splits the worst clipping segment until the polyline hero -> PATH... -> CAM is clear.
    a0 = HERO['loc']; pts = [a0, eye]
    def orbit(e):
        hp = Vector(bpy.data.objects['PIVOT_hero'].location)
        p = hp.lerp(piv, e)
        v0, v1 = a0 - hp, eye - piv
        az0, az1 = math.atan2(v0.y, v0.x), math.atan2(v1.y, v1.x)
        da = (az1 - az0 + math.pi) % (2*math.pi) - math.pi
        el0, el1 = math.asin(v0.z / v0.length), math.asin(v1.z / v1.length)
        r = v0.length * (v1.length / v0.length) ** e
        az, el = az0 + da*e, el0 + (el1 - el0)*e
        return p + Vector((math.cos(el)*math.cos(az), math.cos(el)*math.sin(az), math.sin(el))) * r
    es = [0.0, 1.0]
    for _ in range(4):
        bad = [k for k in range(len(pts) - 1) if clips(pts[k], pts[k+1])]
        if not bad: break
        k = bad[0]; e = (es[k] + es[k+1]) / 2
        pts.insert(k + 1, orbit(e)); es.insert(k + 1, e)
    for n, p in enumerate(pts[1:-1], 1):
        empty('PATH_%s_%d' % (s, n), cname, to_local(p), 'PLAIN_AXES', 3.0)
    report[s] = (len(pts) - 2, [clips(pts[k], pts[k+1]) for k in range(len(pts) - 1)])

# The slab(s) each system sits on stay opaque when the system is entered; the rest of ARCH_core goes to
# interior_opacity. Stored on each SYS_<s> root as a comma-separated list (exported as glTF extras).
FLOOR_SLABS = {'hvac': 'CORE_slab_RF,CORE_slab_L22', 'fire': 'CORE_slab_GF', 'plumbing': 'CORE_slab_GF',
               'power': 'CORE_slab_GF', 'smart': 'CORE_slab_L01'}
for s, names in FLOOR_SLABS.items():
    root('SYS_' + s)['floor_slabs'] = names

# facade_opacity / interior_opacity on the ARCH_facade / ARCH_core root empties (collections cannot carry
# animated properties). Web: entering a system sets facade 0.15 and interior 0.4 (floor_slabs stay 1.0).
# In Blender they drive each mesh's object-colour alpha (Workbench previews).
root_c = root('ARCH_core')
root_c['interior_opacity'] = 1.0
root_c.id_properties_ui('interior_opacity').update(
    min=0.0, max=1.0, description='Slabs + core opacity (1 = solid, 0.4 = system entered)')
for o in coll('ARCH_core').objects:
    if o.type != 'MESH': continue
    o.driver_remove('color', 3)
    d = o.driver_add('color', 3).driver; d.type = 'AVERAGE'
    v = d.variables.new(); v.type = 'SINGLE_PROP'
    v.targets[0].id_type = 'OBJECT'; v.targets[0].id = root_c; v.targets[0].data_path = '["interior_opacity"]'

# facade_opacity on the ARCH_facade root empty (collections cannot carry animated properties).
# The web drives the facade alpha from it; in Blender it drives each facade mesh's object-colour alpha.
root_f = root('ARCH_facade')
root_f.animation_data_clear()
root_f['facade_opacity'] = 1.0
root_f.id_properties_ui('facade_opacity').update(
    min=0.0, max=1.0, description='Facade opacity (1 = solid, 0.15 = ghosted)')
for o in coll('ARCH_facade').objects:
    if o.type != 'MESH': continue
    o.driver_remove('color', 3)
    d = o.driver_add('color', 3).driver; d.type = 'AVERAGE'
    v = d.variables.new(); v.type = 'SINGLE_PROP'
    v.targets[0].id_type = 'OBJECT'; v.targets[0].id = root_f; v.targets[0].data_path = '["facade_opacity"]'

sc = bpy.context.scene
sc.camera = hero; sc.frame_start, sc.frame_end = 1, 250
print('waypoints / residual clips per system:', report)

# Values the web applies when a system is entered (agreed in R2 review); exported as glTF scene extras.
sc['enter'] = {'facade_opacity': 0.15, 'interior_opacity': 0.25, 'glass_emissive_scale': 0.3,
               'transparent_depth_write': False, 'floor_slab_opacity': 1.0}
