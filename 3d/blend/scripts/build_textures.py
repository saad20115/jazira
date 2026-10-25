# Procedural textures (numpy -> PNG in C:\aljazira-3d\textures). All <= 2K. Re-run to regenerate.
import bpy, os
import numpy as np

TEX = __import__('os').environ.get('AJ_TEX', r'C:\aljazira-3d\textures') + r''
os.makedirs(TEX, exist_ok=True)
rng = np.random.default_rng(42)

def save(name, rgb, colorspace='sRGB'):
    """rgb: (h, w, 3) float 0..1, row 0 = TOP of the image."""
    h, w, _ = rgb.shape
    rgba = np.ones((h, w, 4), np.float32); rgba[..., :3] = np.clip(rgb, 0, 1)
    img = bpy.data.images.get(name)
    if img is not None: bpy.data.images.remove(img)
    img = bpy.data.images.new(name, w, h, alpha=False)
    img.pixels.foreach_set(rgba[::-1].ravel())           # Blender stores bottom row first
    path = os.path.join(TEX, name + '.png')
    img.filepath_raw = path; img.file_format = 'PNG'; img.save()
    bpy.data.images.remove(img)
    img = bpy.data.images.load(path); img.colorspace_settings.name = colorspace
    return img

WARM = np.array([1.0, 0.80, 0.30]); COOL = np.array([0.85, 0.9, 1.0])     # golden-yellow office light (ref)
ROOM = np.array([1.0, 0.84, 0.50])                                          # v021 N-6: warm-white office interior

# ---- curtain wall emission (R5, matched to ref\tower-render.png): 64 modules of 1.2 m x 24 rows of 3.6 m
#      (CW_UV su = 76.8 m, so one module = 32 px); row 0 at the bottom of the UV space, row edges = floor levels.
#      Each floor: unlit plenum glass (top 12 %), window band (62 %) with a room behind it, unlit glass + thin spandrel (26 %).
#      v021 (owner N-1): every floor is a soft, mostly CONTINUOUS warm band like the ref, with gentle per-bay level /
#      colour variation interpolated smoothly across the bays (no hard-edged dark rectangles: they read as a
#      checkerboard), a few softly dimmed stretches, the L22 plant floor dark. Unlit glass has NO emission.
CW_BANDS = (0.12, 0.74)                                   # window band = [0.06, 0.90] of the cell, from the top
                                                          # (v021 N-6: the rest of each floor is unlit glass that reflects the sky, so the wall reads as one continuous reflective curtain wall)
# per floor, UV row 0 (GF) upwards: M office floor, P part-lit (dimmed stretches), T terrace level (rows 18-22: the
# stepped boxes, brightest, N-2), D dark (L22 plant floor).
FLOOR_LIT = 'MMM' + 'MMMMMMMMMMPMMMM' + 'TTTTT' + 'D'     # row = (z + 1.8) / 3.6: T = L17-L21, D = L22
def cw_emit():
    W, H, cols, rows = 2048, 1536, 64, 24
    cw, rh = W // cols, H // rows
    w0, w1 = int(rh * CW_BANDS[0]), int(rh * CW_BANDS[1])
    wh = w1 - w0
    out = np.zeros((H, W, 3), np.float32)
    yy = np.linspace(0, 1, wh)[:, None]                    # 0 = window head (ceiling), 1 = sill
    xb = (np.arange(W) + 0.5) / cw - 0.5                   # pixel x in bay units (bay c centred on c)
    def smooth(vals):                                      # per-bay values -> per-pixel, cosine-eased between bays
        i0 = np.clip(np.floor(xb).astype(int), 0, cols - 1); i1 = np.clip(i0 + 1, 0, cols - 1)
        f = xb - np.floor(xb); f = (1 - np.cos(np.pi * f)) / 2
        return vals[i0] * (1 - f) + vals[i1] * f
    for r in range(rows):                                  # r = 0 is the bottom row
        y0 = H - (r + 1) * rh
        kind = FLOOR_LIT[r]
        if kind == 'D': continue
        c = np.arange(cols)
        wave = sum(np.sin(c / cols * 2 * np.pi * k + rng.uniform(0, 2 * np.pi)) / k for k in (2, 5, 11))   # gentle drift
        lvl = rng.uniform(0.55, 0.95) * (1.0 + 0.12 * wave / 1.6) * rng.uniform(0.88, 1.08, cols)
        if kind == 'T': lvl = lvl * 0.6                     # notch floors: dim on the outer faces; MAT_glass_terrace's
                                                           # higher strength lights the recessed boxes (N-2)
        n_dim = {'M': int(rng.integers(2, 4)), 'P': 4, 'T': 0}[kind]   # v022 N-6b: wide dim stretches -> lit rooms in patches
        for _ in range(n_dim):                             # a few softly dimmed stretches (blinds / empty office)
            a = int(rng.integers(0, cols)); L = int(rng.integers(4, 12))
            lvl[a:a + L] *= rng.uniform(0.12, 0.35)
        tint = rng.uniform(0.96, 1.04, cols)                 # slight per-bay colour temperature drift
        cool = rng.random() < 0.1
        lv, tn = smooth(lvl), smooth(tint)
        # v021 (owner N-6): a ROOM behind each pane, not a flat band. Ceiling with rows of light panels shrinking and
        # dimming with depth (perspective cue), warm back wall with soft partitions, dark furniture / desk band with
        # the odd screen, a lit floor strip. Warm-white office light (the ref), not ochre.
        temp = (ROOM * 0.8 + COOL * 0.2) if cool else ROOM
        xm = np.arange(W) % cw                               # pixel x inside the bay
        y = yy[:, 0]
        room = np.zeros((wh, W), np.float32)
        ceil = y < 0.24; wall = (y >= 0.24) & (y < 0.72); desk = (y >= 0.72) & (y < 0.86); flr = y >= 0.86
        room[ceil] = 0.36 + 0.2 * (1 - y[ceil, None] / 0.24)
        part = np.ones(W, np.float32)                        # soft partitions / columns every few bays
        for px in rng.choice(W, size=int(rng.integers(4, 9)), replace=False):
            part *= 1 - 0.45 * np.exp(-((np.arange(W) - px) / 10.0) ** 2)
        room[wall] = (0.68 - 0.2 * (y[wall, None] - 0.24) / 0.48) * part[None, :]
        room[desk] = 0.16
        room[flr] = 0.28
        for (ya, yb), (per, wid), b in (((0.02, 0.09), (16, 11), 2.6),    # near row of ceiling panels
                                          ((0.12, 0.165), (16, 7), 1.9),    # middle row: smaller, dimmer
                                          ((0.19, 0.22), (8, 4), 1.5)):     # back row
            rows_ = (y >= ya) & (y < yb); cols_ = (np.arange(W) % per) < wid
            room[np.ix_(rows_, cols_)] = b
        scr = (rng.random(cols) < 0.35)                      # the odd lit screen on a desk
        for c_ in np.nonzero(scr)[0]:
            xs_ = c_ * cw + int(rng.integers(6, cw - 9)); ys_ = (y >= 0.73) & (y < 0.78)
            room[ys_, xs_:xs_ + 4] = 1.3
        win = (room * lv[None, :])[..., None] * temp[None, None, :]
        win[..., 0] *= tn[None, :]; win[..., 2] /= tn[None, :]
        # v022 N-6b: no per-bay mullion gap any more: the built mullions (every 2nd module) carry the rhythm
        out[y0 + w0:y0 + w1, :] = win
    return save('tex_cw_emit', out)

# ---- curtain wall metal / roughness, ONE texel per module (64 x 24, bilinear): glTF metallicRoughness
#      (G = roughness, B = metallic). Column-wise variation (panels tilt / coat slightly differently) breaks the sky
#      reflection into the vertical streaks of the ref; small per-panel jitter on top.
def cw_mr():
    cols, rows = 64, 24
    rough_c = rng.uniform(0.03, 0.11, cols); metal_c = rng.uniform(0.45, 0.70, cols)   # v022 N-6b: some Fresnel, on a light blue-grey glass base (was 0.72-0.96)
    mr = np.ones((rows, cols, 3), np.float32)
    jr, jm = rng.normal(0, 0.012, (rows, cols)), rng.normal(0, 0.02, (rows, cols))
    pair = lambda a: np.repeat(a[..., ::2], 2, axis=-1)   # v022 N-6b: one panel step per 2 modules, the mullion rhythm
    mr[..., 1] = np.clip(pair(rough_c)[None, :] + pair(jr), 0.02, 0.2)       # (same draws as before: rng sequence kept)
    mr[..., 2] = np.clip(pair(metal_c)[None, :] + pair(jm), 0.35, 0.8)
    return save('tex_cw_mr', mr, colorspace='Non-Color')

# ---- curtain wall normal map: ONE module cell (1.2 m x 3.6 m), repeated 64 x 24 over the curtain-wall UV by a
#      Mapping node (-> glTF KHR_texture_transform, REPEAT). 64 x 128 px = 53 x 36 px/m, so close system views
#      stay crisp and the hero (~15 px/m) mips down. Bevelled mullion edge + head and sill lines of the window
#      band (CW_BANDS). Tangent space, +Y up; written linear (Non-Color).
CW_NORMAL_TILE = (64, 128)
CW_NORMAL_REPEAT = (64, 24)
def cw_normal():
    cw, rh = CW_NORMAL_TILE
    n = np.zeros((rh, cw, 3), np.float32); n[..., 2] = 1.0
    xs = np.arange(cw); ys = np.arange(rh)                   # ys: 0 = top of the cell
    for d, sx in ():                                         # v022 N-6b: no per-module mullion bevel (it read as noise)
        n[:, xs == d, 0] = sx                                # mullion bevel at the cell's left edge
    h, s = int(rh * CW_BANDS[0]), int(rh * CW_BANDS[1])
    for d, sy in ((h - 2, 0.5), (h - 1, 0.5), (h, -0.3), (h + 1, -0.3),     # window head
                  (s - 2, 0.45), (s - 1, 0.6), (s, -0.3), (s + 1, -0.3)):   # sill / top of the spandrel
        n[ys == d, :, 1] = sy
    n[(ys >= rh - 3), :, 1] = -0.5                          # slab line at the bottom of the cell
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return save('tex_cw_normal', n * 0.5 + 0.5, colorspace='Non-Color')


# ---- podium (C6): 2-storey glazed lobby, 12 large panes of 2 m x 9 m per 24 m (v = z / 9). High-contrast warm
#      interior seen through the glass: bright coffered ceiling with light rows per storey, darker floor zone,
#      dark interior columns every 3 panes, warm stone back wall glow, champagne mullions, transom, L01 slab edge.
def podium_emit():
    W, H, cols = 1024, 384, 12
    cw = W // cols
    z = np.linspace(9.0, 0.0, H)[:, None]                    # row 0 = top (z = 9 m)
    x = np.arange(W)[None, :]
    def zr(a, b): return slice(int((9.0 - b) / 9.0 * H), int((9.0 - a) / 9.0 * H))
    g = np.zeros((H, 1), np.float32)
    gf = (z < 4.7); l1 = (z > 5.15) & (z < 8.4)
    # v021 (owner N-3): the lobby is the brightest element of the frame, a glowing 2-storey glass box: the whole
    # height lit (floor zone too), a warmer golden-white, so it out-shines the cream fascia band above it
    g[gf] = 0.62 + 0.38 * (z[gf] / 4.7) ** 1.6               # ground storey: ceiling at 4.7 m
    g[l1] = 0.58 + 0.42 * ((z[l1] - 5.15) / 3.25) ** 1.6     # upper storey: ceiling at 8.4 m
    LOBBY = np.array([1.0, 0.66, 0.12])                     # golden amber: stays warm under AgX at high emission
    out = (g * np.ones((1, W)))[..., None] * LOBBY
    out *= (0.85 + 0.3 * np.abs(np.sin(x / W * np.pi * 5.0)))[..., None]   # back-wall glow pools
    for zc in (4.45, 8.15):                                  # ceiling light rows
        out[zr(zc - 0.12, zc), :] = LOBBY * 1.5
    for c in range(0, cols, 3):                              # interior columns (dark, in front of the glow)
        x0 = c * cw + cw // 2
        out[zr(0.0, 8.4), x0 - 5:x0 + 5] *= 0.18
    for c in range(cols + 1):                                # champagne mullions
        out[:, max(0, c * cw - 3):c * cw + 3] = LOBBY * 0.22
    out[zr(4.7, 5.15)] = 0.03                                # L01 slab edge
    out[zr(2.95, 3.05)] = LOBBY * 0.22                        # transom at door height
    out[zr(8.4, 9.0)] = 0.02                                 # roof edge / fascia zone
    return save('tex_podium_emit', out)

# ---- champagne pilaster / crown / fascia wash (C4): 8 x 128, v = z / 92 (row 0 = top). Uplight from the base
#      fading up the shaft, a second wash from the crown; values are emission (x MAT_gold_fin strength).
def pilaster_wash():
    z = np.linspace(92.0, 0.0, 128)[:, None]
    w = 0.18 + 0.82 * np.exp(-z / 22.0) + 0.5 * np.exp(-(92.0 - z) / 6.0)
    col = np.array([1.0, 0.80, 0.52])
    return save('tex_pilaster_wash', (np.clip(w, 0, 1) * np.ones((1, 8)))[..., None] * col)

# ---- system glow palette (natural-colour systems): 8 x 1 texels, sRGB (the byte image stores sRGB as written), one
#      per mep_parts.PAL index (as 16 px swatches, 128 x 16): gold accent (#EFCB76), LED green, LED red, screen cyan, LED blue, white, amber, unused.
#      A system's glow mesh puts each face's UV on one texel, so one emissive material carries every glow colour.
def glow_palette():
    hexes = ['EFCB76', '32E07A', 'FF3B30', '38C6F0', '3C7BFF', 'FFFFFF', 'FFB020', '000000']
    sw = np.array([[int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] for h in hexes], np.float32)
    px = np.repeat(np.repeat(sw[None, :, :], 16, axis=0), 16, axis=1)   # 16 x 16 px swatches: survive mips + block compression
    return save('tex_glow_palette', px)

def hvac_fans(n=512, blades=6):
    """v020 rotor texture (RGBA): `blades` swept blades in fan grey #3A3F45 on transparent, a hub, and a lighter
    smear band behind each blade's trailing edge (the motion-blur arc; alpha stays binary for glTF MASK). The disc UV
    covers the full square, centred; the viewer rotates this texture about (0.5, 0.5)."""
    v = (np.arange(n) + 0.5) / n - 0.5
    X, Y = np.meshgrid(v, -v)                                   # row 0 = top
    r = np.hypot(X, Y); th = np.arctan2(Y, X)
    fan = np.array([0x3A, 0x3F, 0x45]) / 255; smear = np.array([0x55, 0x5B, 0x62]) / 255
    rgb = np.broadcast_to(fan, (n, n, 3)).copy(); a = np.zeros((n, n), np.float32)
    rr = r / 0.5                                                # 0 at the hub centre, 1 at the rim
    span = (rr > 0.16) & (rr < 0.97)
    for j in range(blades):
        c = 2 * np.pi * j / blades + 0.55 * rr                  # swept blade centre line
        d = np.angle(np.exp(1j * (th - c)))                      # signed angle to it, -pi..pi (rotation is +angle)
        w = 0.16 + 0.14 * rr                                     # wider towards the tip
        blade = span & (d > -w) & (d < w * 0.55)                 # leading edge at -w ... trailing at +0.55 w
        trail = span & (d >= w * 0.55) & (d < w * 0.55 + 0.22 * (0.4 + rr))   # smear arc behind the trailing edge
        a[blade | trail] = 1.0; rgb[trail] = smear
    a[rr <= 0.18] = 1.0                                          # hub
    rgba = np.concatenate([rgb, a[..., None]], axis=2)
    img = bpy.data.images.get('tex_hvac_fans')
    if img is not None: bpy.data.images.remove(img)
    img = bpy.data.images.new('tex_hvac_fans', n, n, alpha=True)
    img.pixels.foreach_set(rgba[::-1].astype(np.float32).ravel())
    path = os.path.join(TEX, 'tex_hvac_fans.png')
    img.filepath_raw = path; img.file_format = 'PNG'; img.save()
    bpy.data.images.remove(img)
    return bpy.data.images.load(path)

def save_rgba(name, rgba):
    img = bpy.data.images.get(name)
    if img is not None: bpy.data.images.remove(img)
    h, w, _ = rgba.shape
    img = bpy.data.images.new(name, w, h, alpha=True)
    img.pixels.foreach_set(np.clip(rgba, 0, 1)[::-1].astype(np.float32).ravel())
    path = os.path.join(TEX, name + '.png')
    img.filepath_raw = path; img.file_format = 'PNG'; img.save()
    bpy.data.images.remove(img)
    return bpy.data.images.load(path)

# ---- v022 (realism C): one vegetation atlas for MAT_vegetation (alpha MASK), 512 x 512, u from the left:
#      [0, 0.125) palm bark: grey-brown with leaf-scar rings (v = up the trunk);
#      [0.125, 0.25) broadleaf canopy: mottled greens (tree C);
#      [0.25, 1] one palm frond seen flat: v = 0 at the crown -> 1 at the tip, u across; a rachis down the middle and
#      pinnate leaflets sloping toward the tip, tapering, with gaps (alpha 0) between them; tips a little dry.
def vegetation():
    n = 512
    rgba = np.zeros((n, n, 4), np.float32)
    y = np.linspace(0, 1, n)[:, None]                              # image row 0 = top = v 1; flipped below
    bark = np.array([0.36, 0.30, 0.24]) * (0.85 + 0.15 * np.sin(y * 2 * np.pi * 46)[..., None]) \
        * (0.9 + 0.1 * rng.random((n, 64, 1)))
    rgba[:, :64, :3] = bark; rgba[:, :64, 3] = 1
    blot = rng.random((n // 8, 8, 1)).repeat(8, 0).repeat(8, 1)
    rgba[:, 64:128, :3] = np.array([0.12, 0.24, 0.09]) * (0.7 + 0.6 * blot); rgba[:, 64:128, 3] = 1
    fw = n - 128; xs = (np.arange(fw) + 0.5) / fw * 2 - 1            # -1..1 across the frond
    v = 1 - (np.arange(n) + 0.5) / n                               # v along the frond (0 = crown) for each image row
    V, X = np.meshgrid(v, xs, indexing='ij')
    half = 0.15 + 0.85 * np.sin(np.clip(V, 0, 1) * np.pi * 0.95) ** 0.7   # leaflet reach, tapering to the tip
    k = np.abs(X) / np.maximum(half, 1e-3)                          # 0 at the rachis, 1 at the leaflet tips
    phase = (V * 34 + np.abs(X) * 3.2) % 1.0                        # leaflets slope toward the tip
    leaf = (phase < 0.55 - 0.25 * k) & (k < 1) & (V > 0.04)
    rach = np.abs(X) < 0.035
    a = (leaf | rach).astype(np.float32)
    g = np.array([0.15, 0.30, 0.10]) * (0.8 + 0.4 * rng.random((n, fw, 1)))
    dry = np.clip((V - 0.75) * 3, 0, 1)[..., None] * np.clip(k, 0, 1)[..., None]
    col = g * (1 - 0.5 * dry) + np.array([0.42, 0.36, 0.20]) * 0.5 * dry
    col[rach] = [0.30, 0.32, 0.16]
    rgba[:, 128:, :3] = col; rgba[:, 128:, 3] = a
    return save_rgba('tex_vegetation', rgba)

cw_emit(); cw_mr(); cw_normal(); podium_emit(); pilaster_wash(); glow_palette(); hvac_fans()   # R5: no city, sky or city-lights ground
vegetation()                                     # v022: last, so the rng sequence (and every texture above) is unchanged
print('textures ok')
