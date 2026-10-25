# Equipment part library for build_mep.py: low-poly but recognisable silhouettes in near-natural MEP colours (owner
# 2026-10-23: "near-natural colours, showing some logical details"; colour scheme from the CTO spec, sRGB, slightly
# desaturated for the night palette). Parts are bmesh primitives placed by a matrix.
# Colour: every face gets the Kit's colour in the byte loop-colour layer 'Col' (sRGB, the system's single body
#   material multiplies it -> glTF COLOR_0).
# Glow: LEDs, screens, gold accent edges and flow chevrons go to a second bmesh (the system's glow object, one emissive
#   material) with their UV on a texel of the glow palette (build_textures.py glow_palette), so one material carries
#   every glow colour.
import bmesh, math
from mathutils import Matrix, Vector
LITE = globals().get('LITE', False)        # lite GLB (export_glb.py lite): drop sub-parts that don't read at lite's
                                          # entry distance (handwheels, ribs, half the rungs ...); same names / anchors

def rgba(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)

# ---- colours (sRGB) -------------------------------------------------------------------------------------------------
C = dict(
    casing='#C8CDD2', fan='#3A3F45', chw='#B9C0C6', chw_ring='#9AA1A8', band_sup='#2F6DB5', band_ret='#3E8E5A',
    duct='#A7AEB5', tower='#D8DCDF', louvre='#8A9096', steel='#4A4F55', galv='#A9B0B6', plate='#E8EAEC',
    red='#B3261E', wheel='#3B3326', brass='#B08D57', door='#8C9096', grey='#8C9096',
    grp='#DADFE4', base='#6A7076', water='#2F6DB5', drain='#5E646B',
    ral7035='#D5D7D5', seam='#9EA2A0', txgrey='#A9AEB2', warn='#E0B400', cable='#1E1F22', gen='#4A5A50',
    rack='#2E3238', console='#3A3D42', dome='#E8EAEC', black='#1C1E22', bund_b='#2F6DB5', bund_g='#3E8E5A',
    dark='#26292D')
# ---- glow palette (index -> texel of tex_glow_palette, 8 x 1) ---------------------------------------------------------
PAL = dict(gold=0, green=1, red=2, cyan=3, blue=4, white=5, amber=6)
PAL_N = 8

class Kit:
    def __init__(self, bm, M=None, col='#808080', abm=None, pal=None):
        self.bm, self.M, self.col, self.abm, self.pal = bm, (M if M is not None else Matrix()), col, abm, pal

    def at(self, x, y, z=0.0, rot=0.0):
        """A child placement: translate, then turn `rot` degrees about Z."""
        return Kit(self.bm, self.M @ Matrix.Translation((x, y, z)) @ Matrix.Rotation(math.radians(rot), 4, 'Z'),
                   self.col, self.abm, self.pal)

    def c(self, key):
        """Same placement, body colour `key` (a C name or a hex)."""
        return Kit(self.bm, self.M, C.get(key, key), self.abm, None)

    def glow(self, key):
        """Same placement, emissive accent from the glow palette (falls back to the body when there is no glow mesh)."""
        return Kit(self.bm, self.M, self.col, self.abm, PAL[key])

    # -- painting
    def _target(self):
        return self.abm if (self.pal is not None and self.abm is not None) else self.bm

    def _paint(self, bm, verts):
        faces = {f for v in verts for f in v.link_faces}
        if bm is self.abm and self.pal is not None:
            uv = bm.loops.layers.uv.get('UVMap') or bm.loops.layers.uv.new('UVMap')
            u = ((self.pal + 0.5) / PAL_N, 0.5)
            for f in faces:
                for l in f.loops: l[uv].uv = u
        else:
            col = bm.loops.layers.color.get('Col') or bm.loops.layers.color.new('Col')
            c = rgba(self.col)
            for f in faces:
                for l in f.loops: l[col] = c

    # -- primitives
    def obox(self, c, size, rx=0.0, ry=0.0, rz=0.0):
        R = (Matrix.Rotation(math.radians(rz), 4, 'Z') @ Matrix.Rotation(math.radians(ry), 4, 'Y')
             @ Matrix.Rotation(math.radians(rx), 4, 'X'))
        bm = self._target()
        r = bmesh.ops.create_cube(bm, size=1.0, matrix=self.M @ Matrix.Translation(c) @ R @ Matrix.Diagonal((*size, 1.0)))
        self._paint(bm, r['verts'])

    def box(self, x0, y0, z0, x1, y1, z1):
        self.obox(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), (abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)))

    def cyl(self, c, r, h, axis='Z', seg=12, r2=None, caps=True):
        R = {'Z': Matrix(), 'X': Matrix.Rotation(math.pi / 2, 4, 'Y'), 'Y': Matrix.Rotation(math.pi / 2, 4, 'X')}[axis]
        bm = self._target()
        res = bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=seg, radius1=r,
                                    radius2=r if r2 is None else r2, depth=h, matrix=self.M @ Matrix.Translation(c) @ R)
        self._paint(bm, res['verts'])

    def sphere(self, c, r, seg=10, rings=5, sz=1.0):
        bm = self._target()
        res = bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r,
                                        matrix=self.M @ Matrix.Translation(c) @ Matrix.Diagonal((1.0, 1.0, sz, 1.0)))
        self._paint(bm, res['verts'])

    def ring(self, c, r, h, t, seg=16, axis='Z'):
        """A guard / shroud rim: outer + inner open tubes."""
        self.cyl(c, r, h, axis=axis, seg=seg, caps=False); self.cyl(c, r - t, h, axis=axis, seg=seg, caps=False)

# ---------------------------------------------------------------- shared details
FAN_BM = None      # v020: build_mep.py sets a bmesh here for hvac -> HVAC_fans (spinning rotor discs, MAT_hvac_fans)
FAN_N = [0]

def fan_disc(k, c, r, seg=16):
    """Rotor disc (owner v020: spinning fans): a flat n-gon facing up, UV on the full 0..1 square centred at (0.5, 0.5),
    so the viewer spins every disc about its own centre by rotating the one blade texture (extras fan_spin). Each disc
    starts at its own angle, so the static Cycles rotors don't all line up."""
    x, y, z = c
    off = math.radians(FAN_N[0] * 37.0); FAN_N[0] += 1
    uv = FAN_BM.loops.layers.uv.get('UVMap') or FAN_BM.loops.layers.uv.new('UVMap')
    vs = [FAN_BM.verts.new(k.M @ Vector((x + r * math.cos(2 * math.pi * i / seg), y + r * math.sin(2 * math.pi * i / seg), z)))
          for i in range(seg)]
    f = FAN_BM.faces.new(vs)
    for i, l in enumerate(f.loops):
        a = 2 * math.pi * i / seg + off
        l[uv].uv = (0.5 + 0.5 * math.cos(a), 0.5 + 0.5 * math.sin(a))

def fan_guard(k, c, r, seg=12):
    """Fan shroud ring with the rotor below a cross guard and a hub, axis Z, centred on c (fan grey). The rotor is a
    textured disc on HVAC_fans (v020); without a fan mesh no rotor is drawn."""
    x, y, z = c
    g = k.c('fan')
    if FAN_BM is not None: fan_disc(k, (x, y, z + 0.03), r - 0.07)   # just above the chiller deck top, under the guard
    if LITE: g.cyl(c, r, 0.32, seg=seg, caps=False); return
    g.ring(c, r, 0.32, 0.07, seg)
    g.box(x - r, y - 0.03, z + 0.12, x + r, y + 0.03, z + 0.16)
    g.box(x - 0.03, y - r, z + 0.12, x + 0.03, y + r, z + 0.16)
    g.cyl((x, y, z + 0.05), r * 0.18, 0.22, seg=8)

def handwheel(k, c, r=0.22, axis='Z'):
    """Valve handwheel: rim + spokes, in the plane normal to `axis` (black)."""
    if LITE: return
    w = k.c('wheel')
    w.ring(c, r, 0.04, 0.035, 12, axis=axis)
    x, y, z = c
    if axis == 'Z':
        w.box(x - r, y - 0.015, z - 0.015, x + r, y + 0.015, z + 0.015)
        w.box(x - 0.015, y - r, z - 0.015, x + 0.015, y + r, z + 0.015)
    else:
        w.box(x - 0.015, y - 0.015, z - r, x + 0.015, y + 0.015, z + r)
        if axis == 'X': w.box(x - 0.015, y - r, z - 0.015, x + 0.015, y + r, z + 0.015)
        else:           w.box(x - r, y - 0.015, z - 0.015, x + r, y + 0.015, z + 0.015)

def gate_valve(k, c, r, pipe_axis='X'):
    """In-line gate valve on a pipe of radius r (body in the kit colour): body, flanges, bonnet, spindle, handwheel."""
    x, y, z = c
    k.cyl(c, r * 1.35, r * 2.2, axis=pipe_axis, seg=10)
    for d in (-1, 1):
        o = (x + d * r * 1.2, y, z) if pipe_axis == 'X' else (x, y + d * r * 1.2, z)
        k.cyl(o, r * 1.7, 0.05, axis=pipe_axis, seg=10)
    k.box(x - r * 0.7, y - r * 0.7, z + r, x + r * 0.7, y + r * 0.7, z + r * 2.6)
    k.c('steel').cyl((x, y, z + r * 2.6 + 0.15), 0.025, 0.3, seg=6)
    handwheel(k, (x, y, z + r * 2.6 + 0.3), max(0.16, r * 1.5))

def gauge(k, x, y, z, face=(0, -1)):
    """Pressure gauge on a short stem: brass stem, white dial (faces `face`)."""
    if LITE: return
    k.c('brass').cyl((x, y, z - 0.12), 0.02, 0.24, seg=6)
    ax = 'Y' if face[0] == 0 else 'X'
    k.c('brass').cyl((x, y, z + 0.02), 0.09, 0.05, axis=ax, seg=10)
    k.c('plate').cyl((x + face[0] * 0.03, y + face[1] * 0.03, z + 0.02), 0.075, 0.01, axis=ax, seg=10)

def nameplate(k, x0, y0, z0, w=0.5, h=0.25, face=-1, axis='Y'):
    """Blank light name plate on a face (no text)."""
    if axis == 'Y': k.c('plate').box(x0, y0 + face * 0.015, z0, x0 + w, y0, z0 + h)
    else:           k.c('plate').box(x0 + face * 0.015, y0, z0, x0, y0 + w, z0 + h)

def chevrons(k, a, b, z, every=3.0, s=0.22, key='gold'):
    """Flow-direction chevrons (glow) along a horizontal run a -> b at height z, pointing a -> b."""
    if LITE: every *= 2
    a, b = Vector((a[0], a[1], z)), Vector((b[0], b[1], z)); d = b - a; L = d.length
    if L < 0.5: return
    t = d.normalized(); rz = math.degrees(math.atan2(t.y, t.x))
    g = k.glow(key); n = int(L / every)
    for i in range(1, n + 1):
        p = a + t * (i * L / (n + 1))
        for side in (-1, 1):
            g.obox(tuple(p - t * s * 0.35 + Vector((-t.y, t.x, 0)) * side * s * 0.35), (s, 0.04, 0.04), rz=rz - side * 45)

def accent_edge(k, x0, y0, z, x1, y1, t=0.05):
    """Thin gold accent glow line along a top edge (key equipment only)."""
    k.glow('gold').box(min(x0, x1) - t / 2, min(y0, y1) - t / 2, z, max(x0, x1) + t / 2, max(y0, y1) + t / 2, z + t)

def cabinet(k, x0, y0, z0, w, d, h, doors=1, face=-1, body=None, door=None, leds=0):
    """Floor cabinet x0..x0+w, y0..y0+d: plinth, body, door panels proud on the y face (face -1 = y0 side), door
    seams, handles, top canopy, optional status LEDs (glow) and a name plate."""
    b = k.c(body) if body else k; dr = k.c(door) if door else b
    k.c('dark').box(x0 + 0.03, y0 + 0.03, z0, x0 + w - 0.03, y0 + d - 0.03, z0 + 0.1)
    b.box(x0, y0, z0 + 0.1, x0 + w, y0 + d, z0 + h)
    yf = y0 if face < 0 else y0 + d
    dw = (w - 0.06) / doors
    for i in range(doors):
        xa = x0 + 0.03 + i * dw
        if face < 0: dr.box(xa + 0.02, yf - 0.02, z0 + 0.18, xa + dw - 0.02, yf, z0 + h - 0.08)
        else:        dr.box(xa + 0.02, yf, z0 + 0.18, xa + dw - 0.02, yf + 0.02, z0 + h - 0.08)
        hx = xa + dw - 0.08
        k.c('dark').box(hx - 0.015, yf + face * 0.05, z0 + h * 0.45, hx + 0.015, yf + face * 0.02, z0 + h * 0.6)
        for j in range(leds):
            k.glow(('green', 'red', 'amber')[j % 3]).box(xa + 0.08 + j * 0.06, yf + face * 0.04, z0 + h - 0.22,
                                                       xa + 0.11 + j * 0.06, yf + face * 0.02, z0 + h - 0.19)
    b.box(x0 - 0.02, y0 - 0.02, z0 + h, x0 + w + 0.02, y0 + d + 0.02, z0 + h + 0.05)

def ladder(k, x, y, z0, z1, w=0.45, axis='X', rung=0.3):
    """Fixed steel ladder: two rails along Z at +/- w/2 across `axis`, rungs every `rung` m."""
    if LITE: rung *= 2
    s = k.c('steel')
    for d in (-w / 2, w / 2):
        if axis == 'X': s.box(x + d - 0.025, y - 0.025, z0, x + d + 0.025, y + 0.025, z1)
        else:           s.box(x - 0.025, y + d - 0.025, z0, x + 0.025, y + d + 0.025, z1)
    z = z0 + rung
    while z < z1 - 0.05:
        if axis == 'X': s.box(x - w / 2, y - 0.015, z - 0.015, x + w / 2, y + 0.015, z + 0.015)
        else:           s.box(x - 0.015, y - w / 2, z - 0.015, x + 0.015, y + w / 2, z + 0.015)
        z += rung

def av_pads(k, x0, y0, x1, y1, z=0.0):
    """Anti-vibration pads under a skid's four corners."""
    for x in (x0 + 0.15, x1 - 0.15):
        for y in (y0 + 0.15, y1 - 0.15):
            k.c('dark').cyl((x, y, z + 0.04), 0.1, 0.08, seg=8)

# ---------------------------------------------------------------- HVAC
def chiller(k, L=10.0, W=2.4, H=2.5, nfan=5):
    """Air-cooled screw chiller, origin at the (x0, y0) floor corner, length along +X: base rails, compressor
    section, V-coils, end frames, fan deck with shrouded fans, name plate, gold accent along the top edges."""
    s, c = k.c('steel'), k.c('casing')
    s.box(0, 0.12, 0, L, 0.32, 0.18); s.box(0, W - 0.32, 0, L, W - 0.12, 0.18)
    c.box(0.15, 0.25, 0.18, L - 0.15, W - 0.25, H * 0.42)                       # compressor / evaporator section
    for yc, rx in ((0.42, -14.0), (W - 0.42, 14.0)):                         # V-coils (coil grey)
        k.c('louvre').obox((L / 2, yc, H * 0.70), (L - 0.3, 0.09, H * 0.58), rx=rx)
    for xe in (0.04, L - 0.04): c.box(xe - 0.04, 0.12, 0.18, xe + 0.04, W - 0.12, H)   # end frames
    for i in range(1, nfan):                                                 # coil bay posts
        xp = i * L / nfan
        for yp in (0.2, W - 0.2): c.box(xp - 0.05, yp - 0.05, H * 0.42, xp + 0.05, yp + 0.05, H)
    c.box(0.05, 0.3, H - 0.06, L - 0.05, W - 0.3, H)                          # fan deck
    r = min(0.9, (W - 0.6) / 2, L / nfan / 2 - 0.08)
    for i in range(nfan): fan_guard(k, ((i + 0.5) * L / nfan, W / 2, H), r)
    nameplate(k, 0.6, 0.25, H * 0.2, 0.7, 0.3, face=-1)
    accent_edge(k, 0.05, 0.3, H, L - 0.05, 0.3); accent_edge(k, 0.05, W - 0.3, H, L - 0.05, W - 0.3)

def cooling_tower(k, S=4.0, H=3.6):
    """Induced-draft cooling tower cell, origin at the floor corner: basin, off-white casing, grey inlet louvres on the
    -X and -Y faces, fan stack with guard, access ladder, accent on the deck edge."""
    t = k.c('tower')
    k.c('steel').box(0, 0, 0, S, S, 0.55)                                    # cold-water basin
    t.box(0.08, 0.08, 0.55, S - 0.08, S - 0.08, H)
    for i in range(3 if LITE else 5):                                        # air-inlet louvres
        z = 0.85 + i * 0.32
        k.c('louvre').obox((-0.02, S / 2, z), (0.12, S - 0.4, 0.05), ry=35)
        k.c('louvre').obox((S / 2, -0.02, z), (S - 0.4, 0.12, 0.05), rx=-35)
    t.box(0.04, 0.04, H - 0.12, S - 0.04, S - 0.04, H)                       # fan deck edge
    t.cyl((S / 2, S / 2, H + 0.5), S * 0.36, 1.0, seg=16, r2=S * 0.41, caps=False)   # fan stack
    fan_guard(k, (S / 2, S / 2, H + 1.0), S * 0.41)
    ladder(k, S + 0.12, S * 0.25, 0.0, H + 0.2, axis='Y')
    nameplate(k, 0.5, 0.08, 0.7, 0.6, 0.25, face=-1)

def ahu(k, L=6.5, W=5.5, H=2.6, sections=4):
    """Air-handling unit along +X, origin at the floor corner: base, casing, section joints, access doors with handles
    on the -Y face, supply collar, coil stubs (CHW bands), name plate, top accent."""
    c = k.c('casing')
    k.c('steel').box(0, 0, 0, L, W, 0.15)
    c.box(0.02, 0.05, 0.15, L - 0.02, W - 0.05, H)
    for i in range(1, sections):
        x = i * L / sections
        k.c('seam').box(x - 0.05, 0.0, 0.15, x + 0.05, W, H + 0.03)
    for i in range(sections):
        xa = i * L / sections
        k.c('seam').box(xa + 0.25, 0.02, 0.35, xa + L / sections - 0.25, 0.05, H - 0.25)
        k.c('dark').box(xa + L / sections - 0.4, -0.04, H * 0.45, xa + L / sections - 0.33, 0.02, H * 0.62)
    k.c('duct').box(L - 1.6, W * 0.25, H, L - 0.3, W * 0.75, H + 0.45)        # supply duct collar
    for j, band in ((0.35, 'band_sup'), (0.75, 'band_ret')):
        k.c('chw').cyl((L * 0.45, -0.25, H * j), 0.07, 0.5, axis='Y', seg=6)
        k.c(band).cyl((L * 0.45, -0.35, H * j), 0.08, 0.06, axis='Y', seg=6)
    nameplate(k, 0.3, 0.05, H * 0.75, 0.7, 0.3, face=-1)
    accent_edge(k, 0.02, 0.05, H, L - 0.02, 0.05)

def fcu(k, x, y, z, rot=0.0):
    """Ceiling fan-coil unit (1.6 x 0.8 x 0.4): casing, return grille plate, two supply spigots."""
    u = k.at(x, y, z, rot)
    u.c('casing').box(-0.8, -0.4, 0.0, 0.8, 0.4, 0.4)
    u.c('louvre').box(-0.7, -0.42, 0.06, 0.7, -0.4, 0.3)                     # return grille
    for sx in (-0.4, 0.4): u.c('duct').cyl((sx, 0.55, 0.2), 0.12, 0.3, axis="Y", seg=6)

def chw_pipe(k, a, b, r, band):
    """Insulated chilled-water pipe (aluminium cladding) with joint rings every 2 m and a colour band every 6 m."""
    a, b = Vector(a), Vector(b); d = b - a; L = d.length
    axis = 'X' if abs(d.x) > 1e-6 else 'Y' if abs(d.y) > 1e-6 else 'Z'
    k.c('chw').cyl(tuple((a + b) / 2), r, L, axis=axis, seg=10, caps=False)
    step = 4.0 if LITE else 2.0
    for i in range(1, int(L / step)):
        p = a + d.normalized() * i * step
        k.c(band if i % 3 == 0 else 'chw_ring').cyl(tuple(p), r * 1.08, 0.08 if i % 3 else 0.25, axis=axis, seg=10)

# ---------------------------------------------------------------- pumps (fire, plumbing)
def pump_set(k, L=4.8, r=0.82, body='red'):
    """Horizontal end-suction pump set on a skid with AV pads, motor at -X, pump at +X, origin at the skid centre on
    the floor. Returns the shaft height and the suction / discharge nozzle positions (local)."""
    b, s = k.c(body), k.c('steel')
    av_pads(k, -L / 2, -0.55, L / 2, 0.55)
    s.box(-L / 2, -0.55, 0.08, L / 2, -0.38, 0.3); s.box(-L / 2, 0.38, 0.08, L / 2, 0.55, 0.3)   # channel rails
    s.box(-L / 2, -0.55, 0.3, L / 2, 0.55, 0.36)                             # base plate
    zc = 0.36 + r * 1.05
    ml = L * 0.42; mx = -L / 2 + 0.1 + ml / 2
    b.cyl((mx, 0, zc), r * 0.78, ml, axis='X', seg=14)                       # motor frame
    for i in range(0 if LITE else 4):                                        # cooling ribs
        b.cyl((mx - ml * 0.35 + i * ml * 0.23, 0, zc), r * 0.86, 0.06, axis='X', seg=14)
    k.c('dark').cyl((mx - ml / 2 - 0.12, 0, zc), r * 0.7, 0.24, axis='X', seg=14)   # fan cowl
    b.box(mx - ml * 0.35, -r * 0.6, 0.36, mx + ml * 0.35, r * 0.6, zc - r * 0.7)   # motor feet
    k.c('warn').box(mx + ml / 2 + 0.02, -r * 0.4, zc - r * 0.4, mx + ml / 2 + 0.45, r * 0.4, zc + r * 0.45)   # coupling guard
    px = L / 2 - 0.15 - r * 0.6
    b.cyl((px - r * 0.55, 0, zc), r * 0.35, r * 0.6, axis='X', seg=10)          # bearing bracket
    b.cyl((px, 0, zc), r * 1.15, r * 0.75, axis='Y', seg=16)                   # volute
    b.box(px - r * 0.5, -r * 0.35, 0.36, px + r * 0.5, r * 0.35, zc - r)       # pump foot
    b.cyl((L / 2 - 0.05, 0, zc), r * 0.42, 0.3, axis='X', seg=10)              # suction nozzle (end)
    b.cyl((L / 2 + 0.08, 0, zc), r * 0.62, 0.06, axis='X', seg=10)             # suction flange
    b.cyl((px, 0, zc + r * 1.15 + 0.2), r * 0.36, 0.4, seg=10)                # discharge nozzle (top)
    b.cyl((px, 0, zc + r * 1.15 + 0.42), r * 0.55, 0.06, seg=10)
    nameplate(k, mx - 0.3, -r * 0.79, zc - 0.1, 0.5, 0.2, face=-1)
    accent_edge(k, mx - ml / 2, -r * 0.8, zc + r * 0.78, mx + ml / 2, -r * 0.8)
    return zc, (L / 2 + 0.11, 0, zc), (px, 0, zc + r * 1.15 + 0.45)

def vertical_pump(k, x, y, r=0.18, h=1.1, body='red'):
    """Vertical multistage pump (jockey / booster): base, stage stack, motor with fan cowl, two nozzles at the
    base. Returns the top of the base (nozzle height)."""
    b = k.c(body)
    k.c('steel').box(x - r * 1.8, y - r * 1.8, 0, x + r * 1.8, y + r * 1.8, 0.12)
    b.cyl((x, y, 0.32), r * 1.25, 0.4, seg=12)                                # pump foot / inlet chamber
    k.c('galv').cyl((x, y, 0.52 + h / 2), r, h, seg=12)                       # stainless stage stack
    for i in range(0 if LITE else 3): b.cyl((x, y, 0.6 + i * h / 3), r * 1.12, 0.05, seg=12)
    b.cyl((x, y, 0.52 + h + 0.08), r * 1.2, 0.16, seg=12)                     # motor stool
    b.cyl((x, y, 0.52 + h + 0.16 + 0.3), r * 1.35, 0.6, seg=12)               # motor
    k.c('dark').cyl((x, y, 0.52 + h + 0.16 + 0.65), r * 1.1, 0.12, seg=12)     # fan cowl
    for d in (-1, 1): b.cyl((x + d * r * 1.6, y, 0.32), r * 0.5, r * 1.0, axis='X', seg=8)
    return 0.32

def pressure_vessel(k, x, y, r=0.35, h=1.3):
    v = k.c('water')
    v.cyl((x, y, 0.35 + h / 2), r, h, seg=12)
    v.sphere((x, y, 0.35 + h), r, seg=12, rings=4, sz=0.5)
    v.sphere((x, y, 0.35), r, seg=12, rings=4, sz=0.5)
    for a in range(3):
        t = a * 2 * math.pi / 3
        k.c('steel').box(x + r * 0.8 * math.cos(t) - 0.04, y + r * 0.8 * math.sin(t) - 0.04, 0, x + r * 0.8 * math.cos(t) + 0.04,
                         y + r * 0.8 * math.sin(t) + 0.04, 0.3)

def grp_tank(k, L=6.0, W=4.5, H=3.0, panel=1.0):
    """GRP sectional water tank on steel bearers, origin at the floor corner: off-white body, flange ribs on the 1 m
    panel grid (sides + roof), roof manhole, vent with cowl, external ladder, name plate."""
    if LITE: panel = 2.0
    g, s = k.c('grp'), k.c('base')
    nb = int(L / panel) + 1
    for i in range(nb): s.box(i * L / (nb - 1) - 0.06, -0.1, 0, i * L / (nb - 1) + 0.06, W + 0.1, 0.2)   # bearers
    z0 = 0.2
    g.box(0, 0, z0, L, W, z0 + H)
    for i in range(1, int(round(L / panel))):                                 # vertical flange ribs, long faces
        x = i * panel
        g.box(x - 0.04, -0.06, z0, x + 0.04, 0.0, z0 + H); g.box(x - 0.04, W, z0, x + 0.04, W + 0.06, z0 + H)
    for j in range(1, int(round(W / panel))):                                 # vertical ribs, end faces
        y = j * panel
        g.box(-0.06, y - 0.04, z0, 0.0, y + 0.04, z0 + H); g.box(L, y - 0.04, z0, L + 0.06, y + 0.04, z0 + H)
    for j in range(1, int(round(H / panel))):                                 # horizontal ribs, all round
        z = z0 + j * panel
        g.box(-0.06, -0.06, z - 0.04, L + 0.06, 0.0, z + 0.04); g.box(-0.06, W, z - 0.04, L + 0.06, W + 0.06, z + 0.04)
        g.box(-0.06, 0.0, z - 0.04, 0.0, W, z + 0.04); g.box(L, 0.0, z - 0.04, L + 0.06, W, z + 0.04)
    for i in range(1, int(round(L / panel))):                                 # roof ribs
        g.box(i * panel - 0.04, 0, z0 + H, i * panel + 0.04, W, z0 + H + 0.05)
    g.cyl((L * 0.3, W * 0.5, z0 + H + 0.12), 0.32, 0.2, seg=12)               # manhole
    k.c('water').cyl((L * 0.7, W * 0.5, z0 + H + 0.35), 0.08, 0.7, seg=8)     # vent ...
    k.c('water').cyl((L * 0.7, W * 0.5, z0 + H + 0.75), 0.18, 0.12, seg=8, r2=0.05)   # ... and cowl
    ladder(k, L + 0.25, W * 0.3, 0.0, z0 + H + 0.9, axis='Y')
    nameplate(k, 0.4, -0.06, z0 + H * 0.6, 0.8, 0.35, face=-1)

# ---------------------------------------------------------------- POWER
def switchgear(k, n=6, w=0.9, d=1.2, h=2.3):
    """MV switchgear line-up along +X, fronts on -Y, RAL 7035: plinth, panels with LV compartment door, main door,
    door seams, indicator LEDs (glow red / green), mimic strip, busbar duct, name plates, top accent."""
    g = k.c('ral7035')
    k.c('dark').box(0, 0.05, 0, n * w, d, 0.1)
    for i in range(n):
        x = i * w
        g.box(x + 0.01, 0.0, 0.1, x + w - 0.01, d, h)
        k.c('seam').box(x + 0.06, -0.025, h - 0.62, x + w - 0.06, 0.0, h - 0.08)   # LV compartment door
        k.c('seam').box(x + 0.06, -0.025, 0.25, x + w - 0.06, 0.0, h - 0.7)       # main door
        k.c('dark').box(x + 0.15, -0.045, h * 0.62, x + w - 0.15, -0.025, h * 0.65)   # mimic strip
        for j, lx in enumerate(() if LITE else (0.25, 0.4, 0.55)):
            k.glow(('red', 'green', 'green')[j]).cyl((x + lx, -0.035, h - 0.3), 0.025, 0.03, axis='Y', seg=6)
        k.c('dark').box(x + w - 0.16, -0.06, h * 0.35, x + w - 0.12, -0.025, h * 0.5)   # handle
        nameplate(k, x + 0.2, -0.025, h - 0.5, 0.5, 0.12, face=-1)
    k.c('seam').box(0, 0.25, h, n * w, d - 0.15, h + 0.35)                    # busbar / gas duct
    accent_edge(k, 0, -0.01, h, n * w, -0.01)

def cable_ladder(k, x, y, z0, z1, w=0.9, step=1.5, axis='X', bundles=('cable',)):
    """Vertical galvanised cable ladder (riser): rails, rungs every `step` m, cable bundles laid on it."""
    if LITE: step *= 2
    s = k.c('galv')
    for d in (-w / 2, w / 2):
        if axis == 'X': s.box(x + d - 0.04, y - 0.05, z0, x + d + 0.04, y + 0.05, z1)
        else:           s.box(x - 0.05, y + d - 0.04, z0, x + 0.05, y + d + 0.04, z1)
    z = z0 + step / 2
    while z < z1:
        if axis == 'X': s.box(x - w / 2, y - 0.03, z - 0.02, x + w / 2, y + 0.03, z + 0.02)
        else:           s.box(x - 0.03, y - w / 2, z - 0.02, x + 0.03, y + w / 2, z + 0.02)
        z += step
    for i, b in enumerate(bundles):                                           # cable bundles
        o = (i - (len(bundles) - 1) / 2) * 0.22
        if axis == 'X': k.c(b).box(x + o - 0.07, y + 0.03, z0, x + o + 0.07, y + 0.12, z1)
        else:           k.c(b).box(x + 0.03, y + o - 0.07, z0, x + 0.12, y + o + 0.07, z1)

def tray_run(k, a, b, z, w=0.6, bundles=('cable',)):
    """Horizontal galvanised ladder tray from a to b (2D, axis-aligned) at height z: rails, rungs, cable bundles."""
    rs = 1.2 if LITE else 0.6                   # rung spacing
    (ax, ay), (bx, by) = a, b
    s = k.c('galv')
    if ay == by:
        for d in (-w / 2, w / 2): s.box(min(ax, bx), ay + d - 0.02, z, max(ax, bx), ay + d + 0.02, z + 0.1)
        x = min(ax, bx) + 0.3
        while x < max(ax, bx): s.box(x - 0.02, ay - w / 2, z, x + 0.02, ay + w / 2, z + 0.03); x += rs
        for i, c_ in enumerate(bundles):
            o = (i - (len(bundles) - 1) / 2) * 0.18
            k.c(c_).box(min(ax, bx), ay + o - 0.06, z + 0.03, max(ax, bx), ay + o + 0.06, z + 0.12)
    else:
        for d in (-w / 2, w / 2): s.box(ax + d - 0.02, min(ay, by), z, ax + d + 0.02, max(ay, by), z + 0.1)
        y = min(ay, by) + 0.3
        while y < max(ay, by): s.box(ax - w / 2, y - 0.02, z, ax + w / 2, y + 0.02, z + 0.03); y += rs
        for i, c_ in enumerate(bundles):
            o = (i - (len(bundles) - 1) / 2) * 0.18
            k.c(c_).box(ax + o - 0.06, min(ay, by), z + 0.03, ax + o + 0.06, max(ay, by), z + 0.12)

def generator(k, L=10.5, W=2.8, H=3.0):
    """Containerised diesel generator, origin at the floor corner, long axis X: base / fuel skid with a yellow-black
    hatch, dark green-grey enclosure, roof, corner posts, louvre banks and doors on both long faces, radiator grille
    on the +X end, roof silencer, exhaust stack with rain cap (returns the stack position)."""
    g = k.c('gen')
    k.c('dark').box(0, 0, 0, L, W, 0.35)                                       # base fuel tank skid
    if not LITE:                                                               # yellow / black hatch on the skid
        n = int(L / 0.6)
        for i in range(n):
            k.c('warn' if i % 2 else 'cable').obox((0.3 + i * 0.6, -0.01, 0.17), (0.32, 0.03, 0.3), ry=40)
    g.box(0.05, 0.05, 0.35, L - 0.05, W - 0.05, H)
    g.box(-0.08, -0.08, H, L + 0.08, W + 0.08, H + 0.1)                        # roof
    for x in (0.0, L):
        for y in (0.0, W): k.c('dark').box(x - 0.1, y - 0.1, 0.35, x + 0.1, y + 0.1, H)   # corner posts
    for yf, d in ((0.05, -1), (W - 0.05, 1)):
        for bank in (L * 0.18, L * 0.62):                                      # louvre banks
            for i in range(4 if LITE else 7):
                k.c('dark').obox((bank, yf + d * 0.04, 0.9 + i * 0.26), (1.6, 0.05, 0.04), rx=d * 35)
        for xd in (L * 0.38, L * 0.82):                                        # doors
            k.c('seam').box(xd - 0.45, yf + d * 0.0, 0.5, xd + 0.45, yf + d * 0.03, H - 0.3)
            k.c('dark').box(xd + 0.3, yf + d * 0.03, H * 0.45, xd + 0.35, yf + d * 0.07, H * 0.55)
    for j in range(8):                                                         # radiator grille, +X end
        k.c('dark').box(L - 0.02, 0.3 + j * (W - 0.6) / 7 - 0.03, 0.6, L + 0.04, 0.3 + j * (W - 0.6) / 7 + 0.03, H - 0.3)
    k.c('galv').cyl((L * 0.3, W / 2, H + 0.55), 0.38, 2.4, axis='X', seg=12)   # roof silencer
    for x in (L * 0.3 - 0.8, L * 0.3 + 0.8): k.c('steel').box(x - 0.08, W / 2 - 0.3, H + 0.1, x + 0.08, W / 2 + 0.3, H + 0.3)
    sx = L * 0.3 + 1.2
    k.c('galv').cyl((sx, W / 2, H + 1.6), 0.2, 2.2, seg=10)                    # stack
    k.c('galv').cyl((sx, W / 2, H + 2.8), 0.32, 0.25, seg=10, r2=0.05)          # rain cap
    nameplate(k, 1.0, 0.05, 1.6, 0.8, 0.35, face=-1)
    accent_edge(k, 0.05, 0.0, H, L - 0.05, 0.0)
    return sx

# ---------------------------------------------------------------- SMART
def server_rack(k, x0, y0, w=0.6, d=1.1, h=2.2, face=-1):
    """42U rack cabinet, matte black: plinth, body, perforated front door (frame + perforation strips), handle, status
    LEDs (glow green / blue), roof fans."""
    r = k.c('rack')
    r.box(x0 + 0.02, y0 + 0.02, 0, x0 + w - 0.02, y0 + d - 0.02, 0.08)
    r.box(x0, y0, 0.08, x0 + w, y0 + d, h)
    yf = y0 if face < 0 else y0 + d
    o = face * 0.02
    k.c('dark').box(x0 + 0.03, min(yf, yf + o), 0.12, x0 + w - 0.03, max(yf, yf + o), h - 0.05)   # door
    for i in range(0 if LITE else 4):                                                     # perforation strips
        xs = x0 + 0.1 + i * (w - 0.2) / 3
        r.box(xs - 0.02, min(yf + o, yf + 2 * o), 0.3, xs + 0.02, max(yf + o, yf + 2 * o), h - 0.25)
    k.c('galv').box(x0 + w - 0.09, min(yf + o, yf + 4 * o), h * 0.45, x0 + w - 0.06, max(yf + o, yf + 4 * o), h * 0.6)
    for j in range(2 if LITE else 4):                                                     # status LEDs (QA: bigger)
        zl = 0.5 + j * 0.42
        k.glow('green' if j % 2 == 0 else 'blue').box(x0 + 0.06, min(yf + 2 * o, yf + 3 * o), zl, x0 + 0.34,
                                                      max(yf + 2 * o, yf + 3 * o), zl + 0.07)
    for fx in (0.3, 0.7): k.c('dark').cyl((x0 + w / 2, y0 + d * fx, h + 0.04), 0.1, 0.08, seg=8)

def bms_console(k, x0, y0, z0):
    """Operator console: three angled dark desk segments with monitors (glow screens) on stands, and a 2 x 4 video
    wall (glow cyan panels) behind (+Y)."""
    c = k.c('console')
    for i, rz in enumerate((-20, 0, 20)):
        cx = x0 + 0.6 + i * 1.0
        c.obox((cx, y0 + 0.4, z0 + 0.72), (1.0, 0.75, 0.05), rz=rz)                       # desk top
        c.obox((cx, y0 + 0.65, z0 + 0.36), (0.95, 0.06, 0.7), rz=rz)                      # modesty panel
        for mx in (-0.25, 0.25):                                                           # monitors
            k.c('black').obox((cx + mx, y0 + 0.64, z0 + 1.05), (0.5, 0.04, 0.32), rz=rz)
            k.glow('cyan').obox((cx + mx, y0 + 0.615, z0 + 1.05), (0.44, 0.01, 0.26), rz=rz)
            c.obox((cx + mx, y0 + 0.68, z0 + 0.85), (0.04, 0.04, 0.22), rz=rz)
    k.c('black').box(x0, y0 + 0.92, z0, x0 + 3.0, y0 + 1.0, z0 + 2.0)                      # video wall frame
    for r_ in range(2):
        for c_ in range(4):
            sx = x0 + 0.1 + c_ * 0.72; sz = z0 + 0.75 + r_ * 0.6
            k.glow('cyan' if (r_ + c_) % 3 else 'blue').box(sx, y0 + 0.9, sz, sx + 0.68, y0 + 0.92, sz + 0.55)

def cctv_dome(k, x, y, z, dx, dy):
    """Wall-mounted CCTV: plate, arm pointing (dx, dy), pendant housing and dome (white), status LED."""
    rz = math.degrees(math.atan2(dy, dx)) if (dx or dy) else 0.0
    u = k.at(x, y, z, rz).c('dome')
    u.box(-0.04, -0.12, -0.12, 0.0, 0.12, 0.12)                                             # wall plate
    u.box(0.0, -0.04, -0.04, 0.45, 0.04, 0.04)                                              # arm
    u.cyl((0.5, 0.0, -0.05), 0.13, 0.16, seg=10)                                           # pendant housing
    u.c('dark').sphere((0.5, 0.0, -0.14), 0.12, seg=8, rings=3, sz=0.8)                    # smoked dome
    u.glow('red').box(0.6, -0.02, 0.0, 0.64, 0.02, 0.03)                                   # status LED

def card_reader(k, x, y, z, rot=0.0):
    u = k.at(x, y, z, rot).c('black')
    u.box(-0.06, -0.02, 0.0, 0.06, 0.0, 0.16)
    u.glow('green').box(-0.04, -0.03, 0.11, 0.04, -0.02, 0.13)

def speed_gate(k, x, y):
    """Speed-gate cabinet (brushed steel), glass flap, top lid with a green arrow (glow)."""
    k.c('galv').box(x - 0.11, y - 0.8, 0.0, x + 0.11, y + 0.8, 0.95)
    k.c('dark').box(x - 0.13, y - 0.82, 0.95, x + 0.13, y + 0.82, 1.0)
    k.c('#9FB4C2').box(x + 0.11, y - 0.3, 0.35, x + 0.55, y + 0.3, 0.9)
    k.glow('green').box(x - 0.05, y - 0.75, 1.0, x + 0.05, y - 0.55, 1.01)
