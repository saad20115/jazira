# Background job: blender -b --factory-startup -P measure_hero.py -- <render.png> [ref.png]
# Corner-proof pixel check on the actual images (1024 px frame; the render is scaled to it): gold pilaster runs on
# a few rows, and the crown light line (topmost bright pixel) on a few columns, for the ref and the render side by
# side, so the errors are measured, not taken from the solve.
import bpy, sys
args = sys.argv[sys.argv.index('--') + 1:]
paths = [args[1] if len(args) > 1 else r'C:\aljazira-3d\ref\tower-render.png', args[0]]   # (ref, render)

def load(p):
    im = bpy.data.images.load(p); w, h = im.size
    px = list(im.pixels)                                     # RGBA floats, bottom row first
    def at(x, y):                                            # x, y in 1024 space, y from the top
        X = min(w - 1, int(x * w / 1024)); Y = min(h - 1, int(y * h / 1024)); i = ((h - 1 - Y) * w + X) * 4
        return px[i:i + 3]
    return at

def gold(c): return c[0] > 0.42 and c[0] - c[2] > 0.16 and c[1] > 0.28
def lum(c): return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def runs(at, y, x0=300, x1=780):
    out, start = [], None
    for x in range(x0, x1):
        g = gold(at(x, y))
        if g and start is None: start = x
        if not g and start is not None:
            if x - start >= 4: out.append((start, x - 1))
            start = None
    return out

def crown(at, x, y0=60, y1=200):
    """y of the crown light line in column x: the first warm pixel below the (blue) sky. The line is the top
    edge of the building, so this is its silhouette."""
    for y in range(y0, y1):
        c = at(x, y)
        if c[0] > c[2] and lum(c) > 0.25: return y
    return None

def pilasters(at, y0=260, y1=640, step=4, frac=0.75):
    """Columns that are gold on >= frac of the rows y0..y1 (a pilaster, not lit windows); returned as runs."""
    cols = [x for x in range(300, 780) if sum(gold(at(x, y)) for y in range(y0, y1, step)) >= frac * (y1 - y0) / step]
    out = []
    for x in cols:
        if out and x == out[-1][1] + 1: out[-1][1] = x
        else: out.append([x, x])
    return [tuple(r) for r in out]

for name, p in zip(("ref", "render"), paths):
    at = load(p)
    print("MEAS", name, "pilaster_cols", pilasters(at))
    print('MEAS', name, 'crown_y', {x: crown(at, x) for x in (395, 450, 520, 577, 640, 670)})
