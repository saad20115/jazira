# Background job: blender -b aljazira_tower.blend -P check_mep_envelope.py
# Corner revision check: every SYS_ mesh vertex (in the tower plan frame) must lie inside the storey outline at its
# height (build_arch.outline), on the roof inside the roof outline, or at ground level on the plinth. Prints the
# offending objects with a count and one sample point each. Read-only.
import bpy
exec(open(r'C:\aljazira-3d\blend\scripts\lib.py').read())
src = open(r'C:\aljazira-3d\blend\scripts\build_arch.py', encoding='utf-8').read()
exec(src.split('# ---- ARCH_core')[0])                      # NOTCH, outline() etc. without rebuilding anything

def inside(poly, x, y):
    c = False
    for i in range(len(poly)):
        (x0, y0), (x1, y1) = poly[i], poly[(i + 1) % len(poly)]
        if (y0 > y) != (y1 > y) and x < x0 + (y - y0) * (x1 - x0) / (y1 - y0): c = not c
    return c

bad = 0
for c in bpy.data.collections:
    if not c.name.startswith('SYS_'): continue
    for o in c.objects:
        if o.type != 'MESH': continue
        n, sample = 0, None
        for v in o.data.vertices:
            p = to_local(o.matrix_world @ v.co)
            if p.z <= 0.6 and -37.5 <= p.x <= 27 and -24 <= p.y <= 24: continue          # on the plinth
            z = min(p.z, ROOF_Z) if p.z < ROOF_Z + 0.01 else ROOF_Z
            poly = outline(top=True) if p.z >= ROOF_Z - 0.01 else outline(p.z)
            if not inside(poly, p.x, p.y):
                n += 1; sample = sample or tuple(round(k, 1) for k in p)
        if n:
            bad += 1; print('ENVELOPE_FAIL', c.name, o.name, n, sample)
print('ENVELOPE_DONE', 'failures', bad)
