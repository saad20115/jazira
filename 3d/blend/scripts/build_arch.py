# ARCH_facade / ARCH_core / ARCH_podium.
exec(open(r'C:\aljazira-3d\blend\scripts\lib.py').read())

# Plan (tower frame, metres; the ARCH_ roots turn it by TOWER_ROT_DEG, see lib.py). Tower x[-21,21] y[-18,18];
# west wing x[-37,-21] y[-16.5,18]. R5 corner revision (brief section 8), read from ref\tower-render.png at 100 %:
# - CAM_hero looks at the SOUTH-EAST corner (21, -18). Both faces meeting there are curtain wall: the S face (left
#   in the hero, 42 m from the corner to the left pilaster at x = -21) and the E face (right, 23.7 m to the right
#   pilaster at y = 5.7), i.e. the ref's 195 : 110 px between the pilasters;
# - beyond the pilasters the flanks step back: the lower west wing on the left, the E face 2 m back (x = 19) and
#   up to the tower parapet on the right;
# - the stepped setback is a nested notch cut into that corner, the same on both faces (mirrored about the corner
#   diagonal): 3 terraces + the crown storey, widening as they rise;
# - the crown: a champagne ring with a gold light line on top of the glass parapet, following the glass (notch
#   included, owner 2026-10-23), rising from the left pilaster to the right one;
# - the 2-storey lobby wraps the corner between the pilasters, with a bronze canopy on each face.
NOTCH = [(level_z(17), 10.8, 4.8),            # (from z, notch along the S face, along the E face): measured on the
         (level_z(19), 16.8, 7.2),             # ref, then snapped to the 1.2 m mullion grid (v018: built, not drawn)
         (level_z(20), 21.6, 14.4),            # L20-L21
         (level_z(22), 21.6, 14.4)]            # L22 + roof: the crown storey (set back from the S face, CROWN_SB)
TOP_Z = level_z(22)
CX, CY = 21.0, -18.0                           # the camera corner
RP_Y = 0.1                                     # right pilaster centre on the E face
FLANK_X = 15.5                                 # E face north of the right pilaster: 5.5 m back, so ~9 m of it shows
                                               # beyond the right pilaster (the ref's right strip, ~45 px)
WING_X = -21.0                                 # west wing: x < -21, its own darker glass (C7)
WING_Y = -16.5                                 # wing front, 1.5 m behind the S face: the ref's left strip (~60 px)
WING_W = -37.0                                 # wing west end: ~16 m of wing, ~12 m of it showing beyond the left pilaster

POD_H = 9.0                                    # lobby height (GF + L01)
PIL_W, PIL_D = 3.0, 1.2                        # pilasters: 3 m wide, 1.2 m proud of the face
LOBBY_PTS = [(-21.0 + PIL_W / 2, CY), (CX, CY), (CX, RP_Y - PIL_W / 2)]   # lobby glazing: S face, corner, E face

def notch(z):
    a = (0.0, 0.0)
    for z0, s, e in NOTCH:
        if z0 <= z + 1e-6: a = (s, e)
    return a

CROWN_SB = 2.5                                 # owner: the last step is two levels, the upper (crown storey) set back
                                               # from the S face along its whole length (the ref shows the S face roof
                                               # edge in front of it, the gold line on the set-back glass)
def tower_line(z):
    """Tower outline without the wing, (-21,-18) CCW round to (-21,18), through the corner notch active at z."""
    s, e = notch(z)
    y0 = CY + CROWN_SB if z >= TOP_Z - 1e-6 else CY
    pts = [(-21.0, y0)] + ([(CX - s, y0), (CX - s, CY + e), (CX, CY + e)] if s > 0 else [(CX, y0)])
    return pts + [(CX, RP_Y + PIL_W / 2), (FLANK_X, RP_Y + PIL_W / 2), (FLANK_X, 18.0), (-21.0, 18.0)]

def outline(z=0.0, top=False):
    return [(WING_W, WING_Y), (WING_X, WING_Y)] + tower_line(ROOF_Z if top else z) + [(WING_W, 18.0)]

TOWER_PARAPET = tower_line(ROOF_Z)             # the wing keeps its lower roof line (ref outline)

# ---- ARCH_core: one slab object per level (so the web can keep a system's own floor opaque), core.
#      A slab takes the outline of the storey BELOW it, so it is also the terrace floor in front of a recess.
LEVEL_NAMES = ['GF'] + ['L%02d' % n for n in range(1, 23)]
for n, lname in enumerate(LEVEL_NAMES):
    z = level_z(n)
    build('CORE_slab_' + lname, 'ARCH_core', lambda bm, z=z: poly_slab(bm, outline(z - 0.01), z - 0.3, z))
build('CORE_slab_RF', 'ARCH_core', lambda bm: poly_slab(bm, outline(top=True), ROOF_Z - 0.4, ROOF_Z))
replace('CORE_slabs')
# core + lift overrun, kept out of the notch (the crown storey's notch reaches x = -0.2, y = -1.4)
boxes('CORE_core', 'ARCH_core', [(-8, -1.2, -0.3, 5, 7, ROOF_Z), (-8, -1.2, ROOF_Z, -2, 3, ROOF_Z + 3.4)])

# ---- ARCH_facade: curtain wall (one object per orientation, for real-time transparency sorting; the west wing and
#      the notch faces have their own materials), mullions, floor lines, pilasters, crown beam + light lines, lobby
MODULE = 1.2                             # R5: curtain-wall module (ref ~35 bays across the 42 m front)
CW_UV = dict(su=64 * MODULE, sv=86.4, ov=1.8)   # 64 modules across, 24 x 3.6 m rows up (slab lines on row edges)
# per-face u offset (UV units) so module edges (= texture mullion lines) land on the geometry mullions:
# u = s / su + ou with s = position along the face tangent; module edges where s = 1.2 k - ou * su
CW_OU = {'S': 0.5 / 64, 'N': 0.5 / 64, 'E': 0.0, 'W': 0.0}

def face_of(a, b):
    nx, ny = b[1] - a[1], -(b[0] - a[0])                       # outward normal (outline is CCW)
    return ('E' if nx > 0 else 'W') if abs(nx) > abs(ny) else ('N' if ny > 0 else 'S')

def is_wing(a, b):
    return max(a[0], b[0]) <= WING_X + 1e-6 and not (a[0] == b[0] == WING_X)   # the -21 step faces stay tower

def is_lobby(a, b, z0):
    """The two camera faces below POD_H are the lobby glass (FAC_podium_glass), not curtain wall."""
    return z0 < POD_H - 1e-6 and (a[1] == b[1] == CY or a[0] == b[0] == CX)

# The crown: parapet top, gold ring and pilaster tops at ONE level all round, planar faces, mitred corners (v018,
# owner + QA: the earlier fitted, kinked crown read as a hip roof). 88.75 m is the best level fit to the ref's crown
# line (worst 11.8 px at the far left end, <= 8.8 px elsewhere: the ref's line is steeper than a level parapet can
# be in this perspective; a buildable crown wins over the pixel match).
CROWN_Z = 88.75
CROWN_L_TOP = CROWN_R_TOP = CROWN_Z
PIL_TOP = TOP_Z + 1.0          # owner (v019b): every gold pilaster / side frame stops 1 m above the L22 floor (a parapet
                               # height); the front ones then turn 90 deg and run inward over the L22 roof terrace as a
                               # 1 m gold parapet band up to the set-back crown storey, which rises clear above them
BAND_T = 0.6                   # gold parapet band thickness
def crown_top(p): return CROWN_Z
def beam_under(p): return crown_top(p) - 0.9   # underside of the champagne crown beam = top of the glass parapet

def cw_spans():
    """(outline, z0, z1) per storey band; z1 None = the parapet, whose top follows beam_under()."""
    zs = [0.0, POD_H] + [s[0] for s in NOTCH] + [ROOF_Z]
    return [(outline(zs[i]), zs[i], zs[i + 1]) for i in range(len(zs) - 1)] \
           + [(TOWER_PARAPET, ROOF_Z, None)]                     # parapet: tower only (closed loop)

def part_of(a, b):
    """'wing', 'terrace' (the notch faces of the stepped terraces: own brighter glass, C5) or 'tower'."""
    if is_wing(a, b): return 'wing'
    AS, AE = NOTCH[-1][1], NOTCH[-1][2]
    on_face = a[1] == b[1] == CY or a[0] == b[0] == CX
    if not on_face and min(a[0], b[0]) >= CX - AS - 1e-6 and max(a[1], b[1]) <= CY + AE + 1e-6:
        return 'terrace'
    return 'tower'

def segments():
    """(a, b, z0, z1a, z1b) for every curtain-wall run (glass, mullions and floor lines all come from here)."""
    out = []
    for pts, z0, z1 in cw_spans():
        for i in range(len(pts)):
            a, b = pts[i], pts[(i + 1) % len(pts)]
            if (Vector(b) - Vector(a)).length > 0.01 and not is_lobby(a, b, z0):
                out.append((a, b, z0, z1 if z1 else beam_under(a), z1 if z1 else beam_under(b)))
    return out

def wall(bm, a, b, z0, z1a, z1b):
    vs = [bm.verts.new(v) for v in [(a[0], a[1], z0), (b[0], b[1], z0), (b[0], b[1], z1b), (a[0], a[1], z1a)]]
    bm.faces.new(vs)

def cw_part(side, part):
    def fn(bm):
        for a, b, z0, z1a, z1b in segments():
            if face_of(a, b) == side and part_of(a, b) == part:
                wall(bm, a, b, z0, z1a, z1b)
    return fn
def clamp_parapet_v(o):                    # parapet above the roof (v > 1) would wrap to the GF row: hold it on the
    for d in o.data.uv_layers['UVMap'].data:  # top row (dark, unlit) instead
        if d.uv.y > 0.999: d.uv.y = 0.999
for side in 'SENW':
    o = build('FAC_cw_' + side, 'ARCH_facade', cw_part(side, 'tower'))
    uv_world(o, ou=CW_OU[side], **CW_UV); clamp_parapet_v(o)
def f_wing(bm):
    for side in 'SNW': cw_part(side, 'wing')(bm)
o = build('FAC_cw_wing', 'ARCH_facade', f_wing)
uv_world(o, ou=0.5 / 64, **CW_UV); clamp_parapet_v(o)   # S/N wing faces on the S/N grid; W face (u = -y/su) on whole modules
def f_terrace(bm):
    for side in 'SE': cw_part(side, 'terrace')(bm)
o = build('FAC_cw_terrace', 'ARCH_facade', f_terrace)
uv_world(o, ou=0.5 / 64, **CW_UV); clamp_parapet_v(o)
replace('FAC_curtainwall')

# ---- mullions + floor lines. Vertex colour 'Col' (MAT_mullion is white x COLOR_0): the outward face is a light,
#      silvery blue that catches the sky (the ref's vertical rhythm), the sides / top / bottom are dark blue-steel,
#      so a grazing view reads as glass + fine lines, not as louvres.
# NB the 'Col' layer is a byte (sRGB-stored) colour: the values below are sRGB, the exporter linearises them.
MULL_LIGHT = (0.26, 0.24, 0.22, 1.0)       # sRGB: dark bronze-grey mullion faces (v022 N-6b: thinner, darker, not gold-lit; v021 champagne 0.55/0.50/0.42)
MULL_DARK = (0.020, 0.035, 0.070, 1.0)     # sRGB, near black blue-steel sides
LOBBY_MULL = (0.20, 0.16, 0.11, 1.0)       # sRGB, dark bronze lobby mullions (L-4)
PIER = (0.10, 0.09, 0.08, 1.0)             # sRGB, dark metal lobby corner pier (L-4)
MULL_W, MULL_D = 0.16, 0.12             # L-2: the ref's mullions read ~2 px wide in the hero

def obox(bm, col, p, t, n, w, d, z0, z1, front, other):
    """Box centred on p (2D) across tangent t (width w), from the face out along n (depth d), z0..z1; no bottom.
    Faces facing n get `front`, the rest `other` (vertex colour layer col)."""
    p, t, n = Vector((p[0], p[1], 0)), Vector((t[0], t[1], 0)), Vector((n[0], n[1], 0))
    c = [p - t * w / 2, p - t * w / 2 + n * d, p + t * w / 2 + n * d, p + t * w / 2]
    if (c[1] - c[0]).cross(c[2] - c[1]).z < 0: c.reverse()          # counter-clockwise from above
    vb = [bm.verts.new((v.x, v.y, z0)) for v in c]; vt = [bm.verts.new((v.x, v.y, z1)) for v in c]
    faces = [bm.faces.new([vb[i], vb[(i + 1) % 4], vt[(i + 1) % 4], vt[i]]) for i in range(4)] + [bm.faces.new(vt)]
    for f in faces:
        f.normal_update()
        c_ = front if (f.normal.x * n.x + f.normal.y * n.y) > 0.9 else other
        for l in f.loops: l[col] = c_

def runs():
    return [r for r in segments() if (Vector(r[1]) - Vector(r[0])).length > 0.5]

def frame(a, b):
    t = (Vector(b) - Vector(a)).normalized()
    return t, Vector((t.y, -t.x))                                      # tangent, outward normal (CCW outline)

def f_mullions(bm):
    col = bm.loops.layers.color.new('Col')
    for a, b, z0, z1a, z1b in runs():
        t, n = frame(a, b)
        off = -CW_OU[face_of(a, b)] * CW_UV['su']                     # module edges at s = 1.2 k + off
        s0, s1 = Vector(a).dot(t), Vector(b).dot(t)
        k0, k1 = math.ceil((s0 - off) / MODULE + 1e-6), math.floor((s1 - off) / MODULE - 1e-6)
        for k in range(k0, k1 + 1):
            if k % 2: continue                                         # v022 N-6b: one mullion per 2 modules (ref rhythm)
            s = k * MODULE + off
            if s0 + 0.3 < s < s1 - 0.3:
                p = Vector(a) + t * (s - s0)
                z1 = z1a + (z1b - z1a) * (s - s0) / (s1 - s0)           # parapet top (crown_top; level since v018)
                obox(bm, col, p, t, n, MULL_W, MULL_D, z0, z1, MULL_LIGHT, MULL_DARK)
    # corner mullions: the camera corner (lobby fascia up to the first terrace) and every corner of the stepped boxes,
    # at the normal mullion width and value (owner / QA v018: the steps are built glass, not drawn frames)
    obox(bm, col, (CX, CY + MULL_W / 2), (1, 0), (0, -1), MULL_W, MULL_W, POD_H, NOTCH[0][0], MULL_LIGHT, MULL_DARK)
    tops = [n[0] for n in NOTCH[1:]] + [None]
    for (z0, s_, e_), z1 in zip(NOTCH, tops):
        if z1 is not None and abs(z1 - z0) < 1e-6: continue
        for x, y in ((CX - s_, CY + (CROWN_SB if z0 >= TOP_Z - 1e-6 else 0.0)), (CX, CY + e_), (CX - s_, CY + e_)):
            top = z1 if z1 is not None else beam_under((x, y))
            obox(bm, col, (x, y + MULL_W / 2), (1, 0), (0, -1), MULL_W, MULL_W, z0, top, MULL_LIGHT, MULL_DARK)
    # L-4: lobby glazing mullions every 2 m (the panes of tex_podium_emit) and the dark-metal corner pier
    for a, b in zip(LOBBY_PTS, LOBBY_PTS[1:]):
        t, n = frame(a, b); L = (Vector(b) - Vector(a)).length
        for k in range(1, int(L / 2.0) + 1):
            s = k * 2.0
            if s < L - 0.5:
                obox(bm, col, Vector(a) + t * s, t, n, 0.12, 0.15, 0.0, 8.4, LOBBY_MULL, LOBBY_MULL)
    obox(bm, col, (CX, CY + 0.45), (1, 0), (0, -1), 0.9, 0.9, 0.0, 8.4, PIER, PIER)
build('FAC_mullions', 'ARCH_facade', f_mullions)

FLOOR_LINE = (0.20, 0.24, 0.30, 1.0)       # sRGB: v022 N-6b: subtle blue-grey slab lines (were MULL_DARK, read as a tile grid)
def f_floorlines(bm):                       # thin slab-edge lines at every floor, subtle (the verticals lead)
    col = bm.loops.layers.color.new('Col')
    th, d = 0.08, 0.10                      # v022 N-6b: thinner (was 0.14 x 0.12)
    for a, b, z0, z1a, z1b in runs():
        z1 = max(z1a, z1b)
        t, n = frame(a, b); L = (Vector(b) - Vector(a)).length
        for k in range(2, 23):
            z = level_z(k)
            if z0 < z <= z1 + 1e-6:
                obox(bm, col, (Vector(a) + Vector(b)) / 2, t, n, L, d, z - th / 2, z + th / 2, FLOOR_LINE, FLOOR_LINE)
build('FAC_floorlines', 'ARCH_facade', f_floorlines)

# ---- C4 pilasters (champagne gold, MAT_gold_fin with an uplight wash texture on v = z / 92): one at each end of
#      the two camera faces, both rising into the crown frame (ref).
LEFT_PIL = (-21.0 - PIL_W / 2, CY - PIL_D, -21.0 + PIL_W / 2, CY + 0.6)           # x0, y0, x1, y1
RIGHT_PIL = (CX - 0.6, RP_Y - PIL_W / 2, CX + PIL_D, RP_Y + PIL_W / 2)
def f_pilasters(bm):
    for x0, y0, x1, y1 in (LEFT_PIL, RIGHT_PIL):                     # flat tops at the L22 floor
        add_box(bm, x0, y0, 0.0, x1, y1, PIL_TOP)
    add_box(bm, FLANK_X - 0.5, 17.5, 0.0, FLANK_X + 0.5, 18.5, PIL_TOP)    # back-east corner of the tower
    for x, y in [(WING_W, 18.0), (WING_W, WING_Y), (-21.0, WING_Y)]:        # wing corners, same level
        add_box(bm, x - 0.5, y - 0.5, 0.0, x + 0.5, y + 0.5, PIL_TOP)
    # the 90 deg return over the L22 roof terrace (in front of the crown storey, set back CROWN_SB from the S face):
    # the left pilaster's top runs back to the crown wall; a gold parapet band runs along the terrace's S edge and
    # its east end (the notch edge), 1 m high, so the terrace is enclosed and the frame reads as an inverted L
    s_top = notch(TOP_Z)[0]
    # clean 90 deg butt joints (owner v019b): the left return stops at the wing face and the crown wall, the band
    # stops against the east-end return, which runs from the band's outer edge to the crown wall
    add_box(bm, LEFT_PIL[0], LEFT_PIL[1], TOP_Z, LEFT_PIL[2], WING_Y, PIL_TOP)
    add_box(bm, WING_X, WING_Y, TOP_Z, LEFT_PIL[2], CY + CROWN_SB, PIL_TOP)
    add_box(bm, LEFT_PIL[2], CY - BAND_T / 2, TOP_Z, CX - s_top - BAND_T / 2, CY + BAND_T / 2, PIL_TOP)
    add_box(bm, CX - s_top - BAND_T / 2, CY - BAND_T / 2, TOP_Z, CX - s_top + BAND_T / 2, CY + CROWN_SB, PIL_TOP)
o = build('FAC_goldfins', 'ARCH_facade', f_pilasters)
uv_world(o, su=92.0, sv=92.0, top_uv=(0.5, 0.99))            # v = z / 92 -> wash gradient; tops take the top colour
replace('FAC_crownband')

# ---- C5 crown: champagne ring on top of the glass parapet, following the glass (tower outline at the roof, notch
#      included), level all round at CROWN_Z
def ring_segments():
    """Crown ring segments (a, b, convex at a, convex at b): the whole parapet outline, notch included (owner: the gold
    top edge follows the glass). CCW outline: a left turn is a convex corner, a right turn a concave (inner) one."""
    pts = TOWER_PARAPET; n = len(pts)
    def convex(i):
        p0, p1, p2 = Vector(pts[i - 1]), Vector(pts[i]), Vector(pts[(i + 1) % n])
        t0, t1 = (p1 - p0).normalized(), (p2 - p1).normalized()
        return t0.x * t1.y - t0.y * t1.x > 0
    return [(pts[i], pts[(i + 1) % n], convex(i), convex((i + 1) % n)) for i in range(n)]

def ring_ext(cv_a, cv_b, o0, o1):
    """Clean 90 deg joints (owner v019b: nothing passes through a corner) for a strip offset o0..o1 outward from the
    face line: convex corner -> the incoming member runs on by o1, the outgoing starts o0 early; concave (inner)
    corner -> the incoming member stops o1 short, the outgoing starts o0 late. No overlap, no stub."""
    return (o0 if cv_a else -o0), (o1 if cv_b else -o1)

def sbox(bm, a, b, n, d, dz0, dz1, ext=(0.0, 0.0), out=0.0):
    """Box along a->b (2D), from out to out + d along n, extended by ext = (at a, at b); its bottom / top are
    crown_top() + dz0 / dz1 at each end (level since v018)."""
    a, b = Vector((a[0], a[1])), Vector((b[0], b[1])); t = (b - a).normalized(); n = Vector((n[0], n[1]))
    ends = [a - t * ext[0], b + t * ext[1]]
    c = [(ends[0] + n * out, 0), (ends[0] + n * (out + d), 0), (ends[1] + n * (out + d), 1), (ends[1] + n * out, 1)]
    zb = [crown_top(e) + dz0 for e in ends]; zt = [crown_top(e) + dz1 for e in ends]
    vb = [bm.verts.new((p.x, p.y, zb[k])) for p, k in c]; vt = [bm.verts.new((p.x, p.y, zt[k])) for p, k in c]
    for i in range(4):
        bm.faces.new([vb[i], vb[(i + 1) % 4], vt[(i + 1) % 4], vt[i]])
    bm.faces.new(vt); bm.faces.new(vb[::-1])

def f_crownbeam(bm):
    for a, b, cva, cvb in ring_segments():
        t, n = frame(a, b)
        sbox(bm, a, b, n, 0.6, -0.9, 0.0, ext=ring_ext(cva, cvb, 0.0, 0.6))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
o = build('FAC_crownbeam', 'ARCH_facade', f_crownbeam)
uv_world(o, su=92.0, sv=92.0, top_uv=(0.5, 0.99))

def f_crownlight(bm):
    col = bm.loops.layers.color.new('Col')
    W = (1, 1, 1, 1)
    # gold light line along the outer top edge of the crown ring (C5) ...
    for a, b, cva, cvb in ring_segments():
        t, n = frame(a, b)
        sbox(bm, a, b, n, 0.05, -0.45, -0.2, ext=ring_ext(cva, cvb, 0.6, 0.65), out=0.6)
    # ... the glowing inner edge (towards the corner) of each pilaster (C4), above the lobby fascia ...
    x1 = LEFT_PIL[2]
    add_box(bm, x1, CY - PIL_D - 0.05, 9.8, x1 + 0.22, CY - PIL_D + 0.05, PIL_TOP)
    add_box(bm, LEFT_PIL[0], CY - PIL_D - 0.05, PIL_TOP - 0.22, x1 + 0.22, CY - PIL_D + 0.05, PIL_TOP)   # ... returning across the top
    y0 = RIGHT_PIL[1]
    add_box(bm, CX + PIL_D - 0.05, y0 - 0.22, 9.8, CX + PIL_D + 0.05, y0, PIL_TOP)
    add_box(bm, CX + PIL_D - 0.05, y0 - 0.22, PIL_TOP - 0.22, CX + PIL_D + 0.05, RIGHT_PIL[3], PIL_TOP)
    # ... and a lit edge along each terrace (the notch outline of the storey below it), so the steps read (C5)
    ps, pe = 0.0, 0.0
    for z0, s_, e_ in NOTCH:
        if z0 >= TOP_Z - 1e-6:                                    # crown storey: the gold parapet band is its edge;
            x_a, x_b = LEFT_PIL[2], CX - s_                       # its lit line runs along the band top, front edge
            add_box(bm, x_a, CY - BAND_T / 2 - 0.05, PIL_TOP - 0.18, x_b + BAND_T / 2 + 0.05, CY - BAND_T / 2, PIL_TOP)
            add_box(bm, x_b + BAND_T / 2, CY - BAND_T / 2 - 0.05, PIL_TOP - 0.18, x_b + BAND_T / 2 + 0.05, CY + CROWN_SB, PIL_TOP)   # follows the turn, stops at the crown wall
            continue
        x_s = CX - s_
        pts = [(x_s, CY), (CX - ps, CY), (CX - ps, CY + pe), (CX, CY + pe), (CX, CY + e_)]
        for p, q in zip(pts, pts[1:]):
            L = (Vector(q) - Vector(p)).length
            if L < 0.5: continue
            t, n = frame(p, q)
            obox(bm, col, (Vector(p) + Vector(q)) / 2 + n * 0.02, t, n, L, 0.12, z0 - 0.12, z0 + 0.2, W, W)   # thin warm slab-edge line
            # (v021 N-2: 0.32 m tall, ~2.5 px at CAM_hero 1024; was 0.16 m, sub-pixel)
        ps, pe = s_, e_
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
build('FAC_crown_light', 'ARCH_facade', f_crownlight)

# ---- C6 lobby: 2-storey glazing on both camera faces between the pilasters (inside the tower footprint),
#      champagne fascia band, bronze canopy on each face, stone plinth.
LOBBY = LOBBY_PTS
def f_podglass(bm):
    walls(bm, LOBBY, 0.0, POD_H, closed=False)
uv_world(build('FAC_podium_glass', 'ARCH_facade', f_podglass), su=24.0, sv=POD_H)   # 12 bays of 2 m per texture

replace('POD_roof_frame'); replace('POD_canopies'); replace('POD_roof')
x0, y1 = LOBBY[0][0], LOBBY[2][1]
boxes('POD_plinth', 'ARCH_podium', [(-37.5, -24, -0.6, 27, 24, -0.02)])        # 0.6 m plinth; plaza is at -0.6
# (top 2 cm under CORE_slab_GF: coplanar, the warm plinth bake z-fought through the entered GF deck in live, QA v019c)
o = build('POD_fascia', 'ARCH_podium', lambda bm: [add_box(bm, *b) for b in [
    (x0, CY - 0.5, 8.4, CX + 0.5, CY + 0.3, 9.8),            # fascia band round the lobby top: S face ...
    (CX - 0.3, CY - 0.5, 8.4, CX + 0.5, y1, 9.8),            # ... E face
    (x0, CY - 0.15, 4.85, CX + 0.15, CY + 0.15, 5.15),       # L01 slab edge lines
    (CX - 0.15, CY - 0.15, 4.85, CX + 0.15, y1, 5.15)]])
uv_world(o, su=92.0, sv=92.0, ov=46.0, top_uv=(0.5, 0.6))    # same wash material as the pilasters, but read ~46 m
                                                             # higher (wash ~0.25, not the 0.72 of the pilaster foot):
                                                             # the cream band must not out-shine the lobby (v021 N-3)

CANOPY_S = (-17.1, 6.4)                                      # x range on the S face
CANOPY_E = (-7.5, -1.6)                                       # y range on the E face
def f_canopies(bm):
    # sloped bronze canopies over the two entrances, 6 m deep, 1 m drop to the outer edge
    def canopy(p0, p1, p2, p3, z_in, z_out, t=0.25):
        top = [bm.verts.new((*p, z)) for p, z in ((p0, z_in), (p1, z_in), (p2, z_out), (p3, z_out))]
        bot = [bm.verts.new((v.co.x, v.co.y, v.co.z - t)) for v in top]
        bm.faces.new(top); bm.faces.new(bot[::-1])
        for i in range(4):
            j = (i + 1) % 4
            bm.faces.new([bot[i], bot[j], top[j], top[i]])
    (a, b), (c, d) = CANOPY_S, CANOPY_E
    canopy((a, CY), (b, CY), (b, CY - 6.0), (a, CY - 6.0), 6.9, 5.9)
    canopy((CX, c), (CX, d), (CX + 6.0, d), (CX + 6.0, c), 6.9, 5.9)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
build('POD_canopies', 'ARCH_podium', f_canopies)

# ---- canopy downlights (C6): warm point lights under the two canopies, parented to the ARCH_podium root so they
#      turn with the tower. Cycles lights the entrances with them; the web gets the same pools from the lamp-pool
#      bake (bake_lamp_pools.py picks up every LGT_ light).
ld = bpy.data.lights.get('LGT_canopy') or bpy.data.lights.new('LGT_canopy', 'POINT')
ld.energy = 770.0; ld.color = (1.0, 0.78, 0.5); ld.shadow_soft_size = 0.2   # v021 N-5: lit forecourt (was 350)
for o in [o for o in bpy.data.objects if o.name.startswith('LGT_canopy_')]: bpy.data.objects.remove(o, do_unlink=True)
for i, (x, y) in enumerate([(-12.0, CY - 3.0), (-5.0, CY - 3.0), (2.0, CY - 3.0),
                            (CX + 3.0, -6.4), (CX + 3.0, -4.6), (CX + 3.0, -2.8)]):
    lo = bpy.data.objects.new('LGT_canopy_%02d' % i, ld); coll('LIGHTS').objects.link(lo)
    lo.parent = root('ARCH_podium'); lo.location = (x, y, 5.0)

# ---- v021 (owner N-6): warm base uplights grazing up each pilaster's gold face (bright at the base, fading upward);
#      Cycles only: the web carries the same read in tex_pilaster_wash
ud = bpy.data.lights.get('LGT_uplight') or bpy.data.lights.new('LGT_uplight', 'SPOT')
ud.energy = 2500.0; ud.color = (1.0, 0.80, 0.55); ud.spot_size = math.radians(16); ud.spot_blend = 0.6; ud.shadow_soft_size = 0.1
for o in [o for o in bpy.data.objects if o.name.startswith('LGT_uplight_')]: bpy.data.objects.remove(o, do_unlink=True)
LX = (LEFT_PIL[0] + LEFT_PIL[2]) / 2; RY = (RIGHT_PIL[1] + RIGHT_PIL[3]) / 2
for i, (x, y) in enumerate([(LX - 0.8, CY - PIL_D - 0.7), (LX + 0.8, CY - PIL_D - 0.7),
                            (CX + PIL_D + 0.7, RY - 0.8), (CX + PIL_D + 0.7, RY + 0.8)]):
    lo = bpy.data.objects.new('LGT_uplight_%02d' % i, ud); coll('LIGHTS').objects.link(lo)
    lo.parent = root('ARCH_podium'); lo.location = (x, y, 0.15)
    lo.rotation_euler = (math.radians(180 - 4), 0, 0) if i < 2 else (math.radians(180), math.radians(-4), 0)   # up, leaning onto the face
