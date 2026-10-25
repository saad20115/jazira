# SYS_* collections: the five MEP systems as recognisable low-poly equipment in near-natural MEP colours with logical
# details (valves at branches, gauges on pump discharge, insulation joints + colour bands on chilled water, hangers,
# name plates, flow chevrons). Layout after ref\systems\sys_<s>_ref.png (concept references, not engineering).
# Per system TWO objects (draw calls): <S>_equipment (one body material, colours in vertex colour 'Col') and <S>_glow
# (one emissive material: LEDs, screens, gold accents, chevrons; colours on the glow palette). Parts: mep_parts.py.
# Every vertex inside the tower envelope (check_mep_envelope.py). Coordinates: tower plan frame (lib.py).
exec(open(r'C:\aljazira-3d\blend\scripts\lib.py').read())
exec(open(r'C:\aljazira-3d\blend\scripts\mep_parts.py', encoding='utf-8').read())

TOWER_FLOORS = list(range(0, 23))          # GF..L22 (L22 = mechanical floor)
CEIL = 2.9                                 # services zone above each floor level
OLD = {                                    # the per-assembly objects of the earlier builds (removed)
    'hvac': ['HVAC_roof_plant', 'HVAC_ahus_roof', 'HVAC_ahus_L22', 'HVAC_duct_risers', 'HVAC_fcus_L06_L12_L15',
             'HVAC_fcus_L06_L12_L18'],
    'fire': ['FIRE_pump_room', 'FIRE_sprinkler_risers', 'FIRE_floor_mains', 'FIRE_alarm_panel_lobby'],
    'plumbing': ['PLUMB_roof_tanks', 'PLUMB_gf_tanks_boosters', 'PLUMB_risers_stacks', 'PLUMB_basement_tanks_boosters'],
    'power': ['POWER_mv_room_transformers', 'POWER_generator', 'POWER_cable_risers_DBs', 'POWER_floor_lighting'],
    'smart': ['SMART_bms_data_room', 'SMART_elv_riser', 'SMART_cctv_entrances', 'SMART_access_control']}
PREFIX = {'hvac': 'HVAC', 'fire': 'FIRE', 'plumbing': 'PLUMB', 'power': 'POWER', 'smart': 'SMART'}

def system(s, fns):
    """Build one system: all its assemblies into one body mesh + one glow mesh (+ hvac: one fan-rotor mesh, v020)."""
    global FAN_BM
    bm, abm = bmesh.new(), bmesh.new()
    FAN_BM = bmesh.new() if s == 'hvac' else None; FAN_N[0] = 0
    k = Kit(bm, abm=abm, col='#808080')
    for fn in fns: fn(k)
    for n in OLD[s]: replace(n)
    _finish(mesh_from_bm(PREFIX[s] + '_equipment', bm), 'SYS_' + s, sys=True)
    if len(abm.faces): _finish(mesh_from_bm(PREFIX[s] + '_glow', abm), 'SYS_' + s, sys=True)
    else: abm.free(); replace(PREFIX[s] + '_glow')
    if FAN_BM is not None:
        _finish(mesh_from_bm(PREFIX[s] + '_fans', FAN_BM), 'SYS_' + s, sys=True); FAN_BM = None

def pipe(k, a, b, r, seg=8):
    """Straight pipe between two axis-aligned points (3D), in the kit colour."""
    a, b = Vector(a), Vector(b); d = b - a
    axis = 'X' if abs(d.x) > 1e-6 else 'Y' if abs(d.y) > 1e-6 else 'Z'
    k.cyl(tuple((a + b) / 2), r, d.length, axis=axis, seg=seg, caps=False)

def elbow(k, c, r, seg=8):
    k.sphere(c, r * 1.05, seg=seg, rings=4)

def hangers(k, a, b, z_pipe, z_top, every=3.0):
    """Threaded-rod hangers with a clamp every `every` m along a horizontal run a -> b (2D)."""
    a, b = Vector((a[0], a[1])), Vector((b[0], b[1])); L = (b - a).length
    if L < every: return
    for i in range(1, int(L / every) + 1):
        p = a.lerp(b, i * every / L)
        k.c('steel').box(p.x - 0.015, p.y - 0.015, z_pipe, p.x + 0.015, p.y + 0.015, z_top)

def pipe_support(k, x, y, z0, z1, w=0.8, axis='X'):
    """H-frame pipe support: two posts and a cross beam at z1 (beam across `axis`)."""
    s = k.c('steel')
    for d in (-w / 2, w / 2):
        p = (x + d, y) if axis == 'Y' else (x, y + d)
        s.box(p[0] - 0.05, p[1] - 0.05, z0, p[0] + 0.05, p[1] + 0.05, z1)
    if axis == 'Y': s.box(x - w / 2 - 0.05, y - 0.06, z1 - 0.1, x + w / 2 + 0.05, y + 0.06, z1)
    else:           s.box(x - 0.06, y - w / 2 - 0.05, z1 - 0.1, x + 0.06, y + w / 2 + 0.05, z1)

# ================================================================ HVAC (roof plant, roof AHUs, risers, FCUs)
def hvac_roof(k):
    z = ROOF_Z
    for y0 in (8.5, 12.5): chiller(k.at(-19.0, y0, z), L=10.0, W=2.4, H=2.5, nfan=5)
    for x0 in (5.5, 10.0):
        for y0 in (8.5, 12.8): cooling_tower(k.at(x0, y0, z), S=4.0, H=3.6)
    # chilled-water supply / return headers (clad insulation, blue / green bands) on H-frame supports
    for y, x0, x1 in ((17.2, -19.0, 14.5), (7.6, -9.0, 5.5)):
        chw_pipe(k, (x0, y, z + 0.9), (x1, y, z + 0.9), 0.22, 'band_sup')
        chw_pipe(k, (x0, y, z + 1.45), (x1, y, z + 1.45), 0.18, 'band_ret')
        chevrons(k, (x0, y - 0.26), (x1, y - 0.26), z + 0.9, every=4.0)
        x = x0 + 1.0
        while x < x1: pipe_support(k, x, y, z, z + 1.7, 0.7, axis='X'); x += 3.0
    for y0 in (8.5, 12.5):                                   # chiller connections to the header, isolating valves
        chw_pipe(k, (-9.0, y0 + 0.8, z + 0.9), (-8.3, y0 + 0.8, z + 0.9), 0.15, 'band_sup')
        chw_pipe(k, (-8.3, y0 + 0.8, z + 0.9), (-8.3, 7.6, z + 0.9), 0.15, 'band_sup')
        gate_valve(k.c('chw'), (-8.3, y0 + 0.2, z + 0.9), 0.15, 'Y')

def hvac_ahu(k):
    z = ROOF_Z
    for y0 in (0.4, 3.9):                                    # 2 roof AHUs, galvanised ducts into the core riser
        ahu(k.at(-20.0, y0, z), L=8.0, W=2.6, H=2.6, sections=4)
        yc = y0 + 1.3; d = k.c('duct')
        d.box(-13.5, yc - 0.55, z + 2.6, -12.4, yc + 0.55, z + 3.6)
        d.box(-13.5, yc - 0.55, z + 3.6, -7.0, yc + 0.55, z + 4.4)
        for xf in (-11.0, -9.0): k.c('seam').box(xf - 0.05, yc - 0.6, z + 3.55, xf + 0.05, yc + 0.6, z + 4.45)
        chevrons(k, (-12.9, yc - 0.56), (-7.2, yc - 0.56), z + 4.0, every=2.5)
    k.c('duct').box(-7.6, 1.0, z + 3.6, -6.0, 8.3, z + 4.4)                   # collector duct along the core
    k.c('duct').box(-7.6, 7.1, z, -6.0, 8.3, z + 4.4)                         # riser head (drops into the shaft)

def hvac_risers(k):
    for x0 in (-7.6, 6.0):                                   # 2 galvanised duct shafts, flanged every 3 floors
        k.c('duct').box(x0, 7.1, 0.0, x0 + 1.6, 8.3, ROOF_Z)
        for n in range(2, 23, 3):
            zf = level_z(n)
            k.c('seam').box(x0 - 0.06, 7.04, zf - 0.05, x0 + 1.66, 8.36, zf + 0.05)

def hvac_fcu(k):
    for n in (6, 12, 15):                                    # FCUs + branch ducts on 3 floors (below the notch)
        z = level_z(n) + CEIL - 0.4
        loop = [(-17, -14), (14, -14), (14, 14), (-17, 14)]
        for (ax, ay), (bx, by) in zip(loop, loop[1:] + loop[:1]):
            if ay == by: k.c('duct').box(min(ax, bx), ay - 0.35, z + 0.15, max(ax, bx), ay + 0.35, z + 0.55)
            else:        k.c('duct').box(ax - 0.35, min(ay, by), z + 0.15, ax + 0.35, max(ay, by), z + 0.55)
        for x, y, rot in [(-12, -16, 0), (-4, -16, 0), (4, -16, 0), (12, -16, 0), (19, -8, 90), (19, 0, 90),
                          (13.5, 8, 90), (-12, 16, 180), (0, 16, 180), (12, 16, 180), (-19, -6, -90), (-19, 6, -90)]:
            fcu(k, x, y, z, rot)
        k.c('duct').box(-7.6, 7.6, z + 0.15, -7.0, 14, z + 0.55)   # tie-in from the riser

system('hvac', [hvac_roof, hvac_ahu, hvac_risers, hvac_fcu])

# ================================================================ FIRE (pump room, risers + alarm valves, mains, FACP)
def fire_pumps(k):
    z = 0.15                                                 # on CORE_plantpads (GF pump room, rear of the west wing)
    hz = 3.3                                                 # discharge header height
    r_ = k.c('red')
    for y in (7.0, 10.0):                                    # 2 electric main pumps (end-suction, on skids)
        zc, suc, dis = pump_set(k.at(-27.5, y, z), L=4.8, r=0.82, body='red')
        sx, dx = -27.5 + suc[0], -27.5 + dis[0]
        pipe(r_, (sx, y, z + zc), (-23.6, y, z + zc), 0.24)
        gate_valve(r_, (-23.95, y, z + zc), 0.24, 'X')
        pipe(r_, (dx, y, z + dis[2]), (dx, y, hz), 0.2)
        r_.box(dx - 0.25, y - 0.25, z + dis[2] + 0.25, dx + 0.25, y + 0.25, z + dis[2] + 0.6)   # check valve
        gauge(k, dx + 0.32, y, z + dis[2] + 0.75, face=(0, -1))
        elbow(r_, (dx, y, hz), 0.2)
    # diesel fire pump: the pump end with an engine block, radiator and exhaust
    zc, suc, dis = pump_set(k.at(-27.5, 13.5, z), L=4.8, r=0.7, body='red')
    k.c('dark').box(-30.1, 13.0, z + 0.36, -27.9, 14.0, z + 1.8)                # engine block
    k.c('red').box(-29.9, 12.9, z + 1.8, -28.1, 14.1, z + 2.1)                  # rocker covers
    k.c('steel').box(-30.5, 12.75, z + 0.36, -30.15, 14.25, z + 1.95)            # radiator
    pipe(k.c('galv'), (-28.6, 13.9, z + 2.1), (-28.6, 13.9, 3.6), 0.09)          # exhaust
    sx, dx = -27.5 + suc[0], -27.5 + dis[0]
    pipe(r_, (sx, 13.5, z + zc), (-23.6, 13.5, z + zc), 0.2)
    gate_valve(r_, (-23.95, 13.5, z + zc), 0.2, 'X')
    pipe(r_, (dx, 13.5, z + dis[2]), (dx, 13.5, hz), 0.17); elbow(r_, (dx, 13.5, hz), 0.17)
    gauge(k, dx + 0.3, 13.5, z + dis[2] + 0.6, face=(0, -1))
    g = k.c('grey')                                                              # diesel day tank on saddles
    g.cyl((-30.6, 16.4, z + 1.05), 0.55, 2.0, axis='X', seg=12)
    for x in (-31.3, -29.9): k.c('steel').box(x - 0.08, 15.95, z, x + 0.08, 16.85, z + 0.7)
    vertical_pump(k.at(-22.9, 5.4, z), 0.0, 0.0, r=0.16, h=0.9, body='red')    # jockey pump
    pipe(r_, (-22.9, 5.4, z + 2.1), (-22.9, 5.4, hz), 0.07); pipe(r_, (-22.9, 5.4, hz), (-25.74, 5.4, hz), 0.07)
    # headers: suction along the east wall, discharge overhead, out to the core risers
    pipe(r_, (-23.6, 5.6, z + 1.3), (-23.6, 15.2, z + 1.3), 0.3, 10)
    pipe(r_, (-25.74, 5.4, hz), (-25.74, 15.0, hz), 0.3, 10)
    gate_valve(r_, (-25.74, 11.8, hz), 0.3, 'Y')
    pipe(r_, (-25.74, 9.0, hz), (-5.0, 9.0, hz), 0.22, 10)
    gate_valve(r_, (-21.0, 9.0, hz), 0.22, 'X')
    chevrons(k, (-25.0, 8.7), (-6.0, 8.7), hz, every=3.0)
    hangers(k, (-24.5, 9.0), (-6.0, 9.0), hz + 0.22, 4.6, every=3.0)
    pipe(r_, (-5.0, 9.0, hz), (-5.0, 7.5, hz), 0.2)
    for y in (6.0, 12.0): pipe_support(k, -25.74, y, z, hz - 0.3, 0.7, axis='Y')
    # controllers: red cabinets with grey doors and status LEDs
    cabinet(k, -22.7, 15.9, z, 1.6, 0.6, 2.0, doors=2, face=-1, body='red', door='door', leds=3)
    cabinet(k, -26.4, 16.4, z, 1.2, 0.5, 1.9, doors=1, face=-1, body='red', door='door', leds=2)
    cabinet(k, -21.6, 4.3, z, 0.7, 0.35, 1.4, doors=1, face=1, body='red', door='door', leds=2)
    accent_edge(k, -32.5, 4.0, z + 0.02, -20.5, 4.0)                             # pump-room key line (gold)

def alarm_valve_station(k, x, y):
    """Wet alarm valve station at a riser base: red valve body, trim, two gauges, drain with valve, retard chamber."""
    r_ = k.c('red')
    r_.cyl((x, y, 1.1), 0.34, 0.7, seg=12)
    for zz in (0.75, 1.45): r_.cyl((x, y, zz), 0.42, 0.06, seg=12)
    handwheel(k, (x + 0.55, y, 1.1), 0.18, axis='X'); pipe(r_, (x + 0.34, y, 1.1), (x + 0.55, y, 1.1), 0.03, 6)
    for zz in (0.85, 1.35): gauge(k, x, y - 0.62, zz, face=(0, -1))
    pipe(r_, (x - 0.34, y, 0.9), (x - 0.8, y, 0.9), 0.05, 6); pipe(r_, (x - 0.8, y, 0.9), (x - 0.8, y, 0.15), 0.05, 6)
    r_.cyl((x - 0.55, y + 0.3, 1.25), 0.1, 0.35, seg=8)

def fire_risers(k):
    r_ = k.c('red')
    for x, y in [(-5.0, 7.5), (6.0, 5.0)]:                   # in the shafts beside the core
        pipe(r_, (x, y, 0.4), (x, y, ROOF_Z), 0.2, 10)
        alarm_valve_station(k, x, y)
        for n in range(2, 23, 2):                            # floor control valve + flow switch (every other floor shown)
            zf = level_z(n) + 1.2
            r_.cyl((x, y, zf), 0.26, 0.3, seg=8); k.c('wheel').box(x - 0.08, y - 0.38, zf - 0.08, x + 0.08, y - 0.24, zf + 0.08)

def fire_mains(k):
    r_ = k.c('red')
    for n in TOWER_FLOORS:
        z = level_z(n) + CEIL
        s_, e_ = notch(level_z(n))                         # the corner notch on this floor (build_arch.py)
        y0 = -8.0 if 12 <= CX - s_ or -8.0 >= CY + e_ else CY + e_ + 1.0
        for a, b in [((-12, y0), (12, y0)), ((-12, 10.0), (12, 10.0)), ((-12, y0), (-12, 10.0)), ((12, y0), (12, 10.0)),
                     ((-5.0, 7.5), (-5.0, 10.0)), ((6.0, 5.0), (12, 5.0))]:
            pipe(r_, (a[0], a[1], z), (b[0], b[1], z), 0.1, 6)
    for z in (CEIL + 1.0, level_z(1) + CEIL - 0.6):            # lobby mains (the lobby wraps the camera corner)
        pipe(r_, (-18, -14.0, z), (17, -14.0, z), 0.1, 6); pipe(r_, (17.0, -14.0, z), (17.0, -3.0, z), 0.1, 6)
        pipe(r_, (-4.5, -14.0, z), (-4.5, -8.0, z), 0.1, 6)

def fire_alarm(k):
    cabinet(k, -4.1, -1.65, 0.9, 1.4, 0.45, 1.4, doors=1, face=-1, body='red', door='door', leds=3)   # FACP
    cabinet(k, -2.0, -1.5, 1.2, 0.5, 0.3, 0.6, doors=1, face=-1, body='red', door='door', leds=1)     # repeater
    for x, y in [(-14, -15), (-4, -15), (6, -15), (16, -15), (17, -8), (17, -3)]:
        k.c('plate').cyl((x, y, 4.53), 0.22, 0.08, seg=10); k.c('plate').sphere((x, y, 4.47), 0.1, seg=8, rings=3, sz=0.6)
        k.glow('red').box(x + 0.12, y - 0.02, 4.44, x + 0.16, y + 0.02, 4.47)

system('fire', [fire_pumps, fire_risers, fire_mains, fire_alarm])

# ================================================================ PLUMBING (roof tank, GF tanks + boosters, risers)
def pl_roof(k):
    grp_tank(k.at(-32.5, -6.5, ROOF_Z), L=8.0, W=4.5, H=2.4)                # GRP tank on the west-wing roof
    zt = ROOF_Z + 0.5; w = k.c('water')
    pipe(w, (-24.0, -2.0, zt), (-9.0, -2.0, zt), 0.15); pipe(w, (-9.0, -2.0, zt), (-9.0, 7.8, zt), 0.15)
    pipe(w, (-9.0, 7.8, zt), (-2.8, 7.8, zt), 0.15)
    gate_valve(w, (-21.0, -2.0, zt), 0.15, 'X')
    chevrons(k, (-23.0, -2.2), (-10.0, -2.2), zt, every=3.0)

def pl_plant(k):
    z = 0.15                                                 # GF plant room behind the core, on CORE_plantpads
    for x0 in (-18.6, -12.0): grp_tank(k.at(x0, 12.6, z), L=5.5, W=4.5, H=3.0)
    w = k.c('water')
    k.c('steel').box(-2.6, 10.9, z, 1.2, 15.4, z + 0.15)                     # booster skid
    av_pads(k, -2.6, 10.9, 1.2, 15.4, z - 0.15)
    for i in range(3):
        y = 11.6 + i * 1.5
        vertical_pump(k.at(0, 0, z + 0.15), -0.7, y, r=0.2, h=1.0, body='water')
        pipe(w, (-1.9, y, z + 0.47), (-1.02, y, z + 0.47), 0.09); pipe(w, (-0.38, y, z + 0.47), (0.3, y, z + 0.47), 0.08)
        pipe(w, (0.3, y, z + 0.47), (0.3, y, z + 2.0), 0.08)
        w.cyl((0.3, y, z + 1.3), 0.13, 0.25, seg=8)                         # non-return valve
        gauge(k, 0.45, y, z + 1.6, face=(1, 0))
    pipe(w, (-1.9, 10.9, z + 0.47), (-1.9, 15.4, z + 0.47), 0.17, 10)     # suction manifold
    pipe(w, (0.3, 10.9, z + 2.0), (0.3, 16.6, z + 2.0), 0.15, 10)         # discharge manifold
    pressure_vessel(k.at(0, 0, z), 1.6, 16.2, r=0.38, h=1.3)
    pipe(w, (0.3, 16.2, z + 2.0), (1.6, 16.2, z + 2.0), 0.08)
    cabinet(k, -2.4, 16.6, z, 1.2, 0.5, 1.9, doors=1, face=-1, body='ral7035', door='seam', leds=2)
    pipe(w, (-6.5, 13.6, z + 0.6), (-1.9, 13.6, z + 0.6), 0.15)              # tanks -> booster suction
    gate_valve(w, (-4.6, 13.6, z + 0.6), 0.15, 'X')
    pipe(w, (0.3, 10.9, z + 2.0), (0.3, 7.8, z + 2.0), 0.15); pipe(w, (0.3, 7.8, z + 2.0), (-2.8, 7.8, z + 2.0), 0.15)
    chevrons(k, (0.55, 10.6), (0.55, 8.1), z + 2.0, every=1.2)
    accent_edge(k, -2.6, 10.9, z + 0.16, 1.2, 10.9)

def pl_risers(k):
    w, d = k.c('water'), k.c('drain')
    for x in (-3.4, -2.8):                                   # blue cold-water risers, floor valves / meters
        pipe(w, (x, 7.8, 0.0), (x, 7.8, ROOF_Z + 0.5), 0.15, 8)
        for n in range(2, 23, 2):
            w.cyl((x, 7.8, level_z(n) + 0.6), 0.22, 0.25, seg=8)
            pipe(w, (x, 7.8, level_z(n) + 0.6), (x, 8.5, level_z(n) + 0.6), 0.06, 6)
    for x in (3.8, 4.5):                                     # grey drainage / vent stacks, cleanouts, vent cowls
        pipe(d, (x, 7.8, 0.0), (x, 7.8, ROOF_Z + 1.5), 0.2, 8)
        for n in range(2, 23, 3): d.cyl((x, 7.8, level_z(n) + 0.3), 0.27, 0.2, seg=8)
        d.cyl((x, 7.8, ROOF_Z + 1.65), 0.32, 0.25, seg=8, r2=0.1)
    pipe(d, (4.15, 7.8, 0.4), (4.15, 21.0, 0.4), 0.2, 8)    # building drain to the rear outfall
    k.c('base').box(3.6, 20.4, 0.0, 4.7, 21.4, 0.6)          # outfall chamber

system('plumbing', [pl_roof, pl_plant, pl_risers])

# ================================================================ POWER (MV room, transformers, LV, generator, trays)
def tx_enclosure(k, x0, y0, z, L=2.6, W=2.0, H=2.4):
    """Cast-resin transformer in a ventilated grey enclosure: base, body, louvre banks on both long faces, roof with
    overhang, top cable box, yellow warning plate, name plate."""
    g = k.c('txgrey')
    k.c('dark').box(x0 - 0.05, y0 - 0.05, z, x0 + L + 0.05, y0 + W + 0.05, z + 0.12)
    g.box(x0, y0, z + 0.12, x0 + L, y0 + W, z + H)
    for yf, d in ((y0, -1), (y0 + W, 1)):
        for i in range(5 if LITE else 9):
            k.c('seam').obox((x0 + L / 2, yf + d * 0.03, z + 0.35 + i * 0.2), (L - 0.4, 0.04, 0.035), rx=d * 35)
    g.box(x0 - 0.08, y0 - 0.08, z + H, x0 + L + 0.08, y0 + W + 0.08, z + H + 0.06)
    for i in range(5): k.c('seam').box(x0 + 0.4 + i * 0.45, y0 + 0.3, z + H + 0.06, x0 + 0.45 + i * 0.45, y0 + W - 0.3, z + H + 0.12)
    g.box(x0 + L * 0.3, y0 + W * 0.35, z + H + 0.06, x0 + L * 0.7, y0 + W * 0.65, z + H + 0.5)   # cable box
    k.c('warn').box(x0 + L * 0.4, y0 - 0.06, z + H * 0.72, x0 + L * 0.6, y0 - 0.04, z + H * 0.85)  # warning plate
    accent_edge(k, x0, y0 - 0.02, z + H, x0 + L, y0 - 0.02)

def pw_mv(k):
    z = 0.15                                                 # GF MV room, rear-east, on CORE_plantpads
    switchgear(k.at(5.0, 16.0, z), n=6, w=0.9, d=1.2, h=2.3)
    for x0 in (4.5, 10.0): tx_enclosure(k, x0, 9.3, z)
    cab = k.at(13.6, 16.0, z, rot=-90)                       # LV main panels along the flank wall, fronts west
    cabinet(cab, 0.0, 0.0, 0.0, 3.5, 0.8, 2.2, doors=5, face=-1, body='ral7035', door='seam', leds=2)
    for a, b in [((5.8, 11.3), (5.8, 15.6)), ((11.3, 11.3), (11.3, 15.6)), ((10.4, 16.3), (13.2, 16.3)),
                 ((5.0, 16.3), (0.65, 16.3)), ((0.65, 16.3), (0.65, 7.6))]:
        tray_run(k, a, b, 3.3, 0.6, bundles=('cable', 'cable'))
    for x, y in ((5.8, 13.5), (11.3, 13.5), (3.0, 16.3), (0.65, 12.0)):
        k.c('steel').box(x - 0.03, y - 0.03, 3.43, x + 0.03, y + 0.03, 4.6)   # hanger rods

def pw_gen(k):
    generator(k.at(6.0, 18.8, 0.0), L=10.5, W=2.8, H=3.0)   # acoustic enclosure on the north plinth
    k.c('grey').cyl((-4.0, 20.2, 0.8), 0.6, 3.6, axis='X', seg=12)   # bulk fuel tank on saddles
    for x in (-5.3, -2.7): k.c('steel').box(x - 0.1, 19.6, 0.0, x + 0.1, 20.8, 0.5)
    pipe(k.c('dark'), (-2.2, 20.2, 0.8), (6.0, 20.2, 0.8), 0.05, 6)

def pw_risers(k):
    for x in (-1.15, 0.65):                                  # cable ladder risers on the core wall
        cable_ladder(k, x, 7.15, 0.0, ROOF_Z, w=0.9, step=2.4, axis="X", bundles=('cable', 'cable'))
    for n in TOWER_FLOORS:                                   # floor distribution board on the core wall
        cabinet(k, 1.6, 7.0, level_z(n) + 0.6, 0.8, 0.3, 1.6, doors=1, face=1, body='ral7035', door='seam', leds=1)

def pw_light(k):
    for n in (8, 14):                                        # linear lighting runs on 2 floors (luminaire strips)
        z = level_z(n) + CEIL + 0.2
        for y in (-15, -11, 11, 15):
            k.c('plate').box(-18, y - 0.08, z, 18 if y < 0 else 14.5, y + 0.08, z + 0.1)

system('power', [pw_mv, pw_gen, pw_risers, pw_light])

# ================================================================ SMART (data room, console, ELV riser, CCTV, access)
def sm_bms(k):
    z = level_z(1)                                           # L01 BMS / data room, rear of the west wing
    r0 = k.at(0, 0, z + 0.15)
    r0.c('#9AA0A6').box(-31.5, 7.5, 0.0, -25.1, 12.3, 0.06)                 # light raised-floor tiles under the racks ...
    r0.c('#9AA0A6').box(-26.0, 12.9, 0.0, -22.4, 15.0, 0.06)                # ... and the console
    r0 = k.at(0, 0, z + 0.21)
    for i in range(6):                                       # 2 rack rows, cold aisle between them
        server_rack(r0, -31.0 + i * 0.8, 8.0, face=1)
        server_rack(r0, -31.0 + i * 0.8, 10.7, face=-1)
    for y in (8.55, 11.25):                                  # overhead ELV ladders (blue / green bundles)
        tray_run(r0, (-31.2, y), (-25.9, y), 2.75, 0.5, bundles=('bund_b', 'bund_g'))
    tray_run(r0, (-25.6, 8.3), (-25.6, 15.2), 2.75, 0.5, bundles=('bund_b', 'bund_g'))
    bms_console(r0, -25.6, 13.4, 0.0)                         # console + video wall
    cabinet(r0, -22.6, 5.6, 0.0, 1.0, 0.6, 2.1, doors=1, face=1, body='rack', door='dark', leds=3)   # ELV cabinet
    accent_edge(r0, -31.0, 9.12, 2.2, -26.2, 9.12)

def sm_elv(k):
    cable_ladder(k, 2.8, 7.15, 0.0, ROOF_Z, w=0.8, step=3.0, axis="X", bundles=('bund_b', 'bund_g'))

def sm_cctv(k):
    for x, y, dx, dy in [(-12, -18.6, 0, -1), (2, -18.6, 0, -1), (21.6, -8, 1, 0), (21.6, -3, 1, 0),
                         (-19.0, -18.6, -1, -1), (21.6, -18.6, 1, -1), (16.1, 18.6, 1, 1), (-37.6, 18.6, -1, 1)]:
        cctv_dome(k, x, y, 5.3, dx, dy)

def sm_access(k):
    for x in (-7.4, -2.6): card_reader(k, x, -17.8, 1.0, 0)  # card readers at the S doors (under the S canopy)
    for y in (-6.0, -3.2): card_reader(k, 20.8, y, 1.0, 90)  # readers at the E doors (under the E canopy)
    for i in range(6): speed_gate(k, -5.0 + i * 1.8, -5.2)    # speed gates in front of the lift core

system('smart', [sm_bms, sm_elv, sm_cctv, sm_access])

# ---------------- plant-room floor pads: concrete (ARCH_core), NOT part of the systems, so an entered system's
# highlight is the equipment only, not a large slab. Not rebuilt for the lite export (export_glb.py re-runs this
# file with LITE = True for the SYS_* meshes only).
if not LITE: boxes('CORE_plantpads', 'ARCH_core', [(-32.5, 4.0, 0.0, -20.5, 17.5, 0.15),            # fire pump room
                                      (-19.0, 10.2, 0.0, 2.5, 17.6, 0.15),             # plumbing plant
                                      (3.0, 8.5, 0.0, 15.0, 17.5, 0.15),               # MV room
                                      (-32.5, 5.0, level_z(1), -21.0, 17.5, level_z(1) + 0.15)])   # BMS / data room
