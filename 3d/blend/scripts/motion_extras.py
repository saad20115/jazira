# R5 step 5, exec'd by export_glb.py (both GLBs): camera limits, idle, and per-system entry motion / section plane /
# inner orbit limits, written as glTF extras so the site reads them and never hard-codes them. glTF space (+Y up,
# Blender (x, y, z) -> (x, z, -y)), metres, radians; polar angles from +Y like three's OrbitControls.
# Also re-checks every entry path (hero -> PATH_<s>_* -> CAM_<s>) against the current geometry.
import math
from mathutils import Vector
exec(open(r'C:\aljazira-3d\blend\scripts\entry_views.py', encoding='utf-8').read())   # ENTER, section_blender()
bpy.data.scenes[0]['enter'] = dict(ENTER)

FILL = 0.55                         # the tower must fill >= 55 % of the frame height at max_distance
MIN_POLAR, MAX_POLAR = math.radians(15.0), math.radians(97.0)   # 97: look up at the lobby; the viewer clamps height
EASE = [0.65, 0.0, 0.35, 1.0]       # cubic-bezier (CSS-style x1, y1, x2, y2): slow out, slow in
O = bpy.data.objects
def gl(v): return [round(v.x, 3), round(v.z, 3), round(-v.y, 3)]
def pos(n): return O[n].matrix_world.translation.copy()
def yfov(cam):
    d = cam.data                     # square frame: glTF yfov = 2 atan(sensor / 2 / lens), as the exporter writes it
    return 2.0 * math.atan(d.sensor_width / 2.0 / d.lens)

arch = [o for c in ('ARCH_facade', 'ARCH_core', 'ARCH_podium') for o in bpy.data.collections[c].objects if o.type == 'MESH']
corners = [o.matrix_world @ Vector(c) for o in arch for c in o.bound_box]
tower_h = max(p.z for p in corners)

hero, piv = O['CAM_hero'], pos('PIVOT_hero')
fov_h = yfov(hero)
max_d = tower_h / (FILL * 2.0 * math.tan(fov_h / 2.0))
hero_d = (pos('CAM_hero') - piv).length
reach = max(math.hypot(p.x - piv.x, p.y - piv.y) for p in corners)        # footprint radius around the target
min_d = reach + 12.0                                                      # never inside / against the tower
limits = {
    'target': gl(piv), 'pan_center': gl(piv), 'pan_radius': 20.0,
    'min_distance': round(min_d, 2), 'max_distance': round(max(max_d, hero_d, 420.0 if 'STUDIO' in bpy.data.collections else 0.0), 2),
    'min_polar': round(MIN_POLAR, 4), 'max_polar': round(MAX_POLAR, 4),
    'min_camera_height': 3.0, 'fov_y': round(fov_h, 5), 'tower_height': round(tower_h, 2), 'tower_fill_at_max': FILL,
    'hero_distance': round(hero_d, 2),
    'hero_shift_y': round(-hero.data.shift_y, 4),   # v022: three setViewOffset(w, h, 0, hero_shift_y * h, w, h) (was hard-coded 0.227)
    'note': 'OrbitControls: min/maxDistance, min/maxPolarAngle; clamp controls.target to pan_center + pan_radius; '
            'keep camera.y >= min_camera_height (glTF Y up)',
}
sc = bpy.data.scenes[0]
sc['camera_limits'] = limits
HERO_SHIFT = limits['hero_shift_y']
# ---- v022 studio maquette (build_studio.py): the turntable and the room environment, for the site
if 'TURNTABLE' in O:
    sc['turntable'] = {'root': 'TURNTABLE', 'axis': 'Y (glTF up) through the node origin', 'rpm': 0.6,
                       'ease_back_s': 0.7, 'resume_after_s': 8.0, 'play': 'idle',
                       'note': 'rotate the root about +Y while idle (no input, no system entered); on entry ease it back '
                               'to 0 by the shortest direction over ease_back_s (same cubic-bezier as enter_motion), '
                               'then play enter_motion; hold 0 while entered; resume resume_after_s after exit / input. '
                               'Camera idle auto-rotate is off while the turntable is on. HOT / PIVOT / CAM / PATH are '
                               'world-space and valid at rotation 0.'}
    night = 'MAQ_moon' in O
    studio = {'mode': 'night' if night else 'day', 'room': 'MAQ_room',
              'env_only': sorted(o.name for o in O if o.name.startswith(('MAQ_softbox_', 'MAQ_glow_'))),
              'env_position': gl(Vector((O['TURNTABLE'].matrix_world.translation.x, O['TURNTABLE'].matrix_world.translation.y, 40.0))),
              'exposure_stops': round(float(sc.get('aj_exposure', 0.0)), 3), 'bloom': night,
              'note': 'scene.environment = PMREMGenerator.fromScene(a scene holding copies of the room and the env_only '
                      'nodes, near 1, far 3000, position env_position). env_only nodes (softbox / moon-glow panels) are '
                      'NEVER drawn in the main view (they exist for reflections only, as in Cycles). '
                      'renderer.toneMappingExposure = 2 ** exposure_stops. No sky, no fog. The room, the plinth and '
                      'the site-light set are lightmapped (baked Cycles light as emissive, base colour black).'}
    if night:
        m = O['MAQ_moon']; d = m.matrix_world.to_quaternion() @ Vector((0, 0, 1))    # towards the moon
        studio['moon'] = {'direction_to_light': gl(d), 'color': [round(c, 3) for c in m.data.color], 'intensity': m.data.energy,
                          'lights': 'the model only (ARCH_*, SYS_*, SITE, plinth); not the room',
                          'note': 'THREE.DirectionalLight(color, intensity) placed along direction_to_light; three has '
                                  'no light linking: the lightmapped materials have black base colour, the room ignores it'}
    if night and sc.get('aj_night_glow'):
        g = dict(sc['aj_night_glow']); ctr = O['TURNTABLE'].matrix_world.translation
        studio['night_glow'] = {'color': [round(c, 3) for c in g['color']], 'gain': g['gain'], 'min': g['min'],
                                'height_from': g['z_from'], 'height_to': g['z_to'], 'radius': round(g['radius'], 1),
                                'centre': gl(Vector((ctr.x, ctr.y, 0.0))),
                                'note': 'env-only: an inward-facing sphere (radius, centre) whose unlit colour = color x '
                                        'gain x mix(min, 1, smoothstep over world height (glTF y) height_from..height_to); '
                                        'add it to the PMREM scene only. It is the dark-navy sheen of the glass (Cycles: '
                                        'the reflection-only glow shell).'}
    sc['studio'] = studio
sc['idle'] = {'auto_rotate_speed': 0.4, 'resume_after_s': 8.0,
              'note': 'OrbitControls.autoRotateSpeed (2.0 = one orbit per 30 s); stops on any input, resumes after idle'}
print('LIMITS', limits['min_distance'], limits['max_distance'], 'hero', limits['hero_distance'], 'tower_h', tower_h)

# ---- path clearance: straight segments between the waypoints, ray-cast against the architecture
dg = bpy.context.evaluated_depsgraph_get()
arch_names = {o.name for o in arch}
def blocked(a, b):
    d = b - a; L = d.length; d.normalize(); start = a.copy()
    while True:
        ok, loc, n, i, ob, m = sc.ray_cast(dg, start, d, distance=max(0.0, L - (start - a).length))
        if not ok: return None
        if ob.name in arch_names: return ob.name
        start = loc + d * 0.05

for s in ['hvac', 'fire', 'plumbing', 'power', 'smart']:
    root, cam, pv = O['SYS_' + s], O['CAM_' + s], pos('PIVOT_' + s)
    paths = sorted(o.name for o in O if o.name.startswith('PATH_%s_' % s))
    route = [pos('CAM_hero')] + [pos(n) for n in paths] + [pos('CAM_' + s)]
    hits = [blocked(a, b) for a, b in zip(route, route[1:])]
    # section plane (entry_views.py, same as the Cycles end stills): vertical, facing from CAM_<s> to PIVOT_<s>,
    # SECTION_MARGIN in front of the pivot; three: Plane(normal, constant), clipped where normal . p + constant < 0
    n, q = section_blender(s)
    ng = Vector(gl(n)); qg = Vector(gl(q))
    root['enter_motion'] = {
        'duration_s': 2.8, 'easing_cubic_bezier': EASE,
        'path': ['CAM_hero'] + paths + ['CAM_' + s], 'curve': 'centripetal Catmull-Rom through the path node positions',
        'target_from': 'PIVOT_hero', 'target_to': 'PIVOT_' + s,
        'fov_from': round(fov_h, 5), 'fov_to': round(yfov(cam), 5), 'shift_y_from': HERO_SHIFT, 'shift_y_to': 0.0,
        'fade_start': 0.10, 'fade_end': 0.55,
        'note': 'facade/interior opacity, glass emissive and the section plane ramp in over [fade_start, fade_end] '
                'of the eased time; exit = the same path reversed with the same easing, ending exactly on CAM_hero',
    }
    root['section'] = {'normal': [round(v, 5) for v in ng], 'constant': round(-ng.dot(qg), 3),
                       'applies_to': 'materials of ARCH_facade + ARCH_core only (renderer.localClippingEnabled = true)',
                       'clip_side': 'normal . p + constant < 0'}
    root['orbit_limits'] = {'target': gl(pv), 'min_distance': 12.0,
                            'max_distance': round((pos('CAM_' + s) - pv).length * 1.35, 2),
                            'min_polar': round(math.radians(10.0), 4), 'max_polar': round(math.radians(88.0), 4),
                            'pan_radius': 6.0}
    print('MOTION %-8s path %s clear %s' % (s, len(paths), all(h is None for h in hits)),
          [h for h in hits if h])

# v020 (owner: "the HVAC fans should rotate"): the viewer spins the rotor discs (HVAC_fans, one draw call) by rotating
# the blade texture about its centre; every disc's UV is the full centred square, so each turns about its own axis.
# play 'entered': spin up over ramp_s when hvac is entered, down on exit (at rest the roof plant is behind the crown).
if 'HVAC_fans' in O:
    O['SYS_hvac']['fan_spin'] = {'material': 'MAT_hvac_fans', 'rpm': 45, 'play': 'entered', 'ramp_s': 1.0,
                                 'note': 'texture.center = (0.5, 0.5); texture.rotation += rpm / 60 * 2 pi * dt * level'}
    print('FAN_SPIN', dict(O['SYS_hvac']['fan_spin']))
