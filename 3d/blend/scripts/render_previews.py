# Background job: blender -b aljazira_tower.blend -P render_previews.py -- <frames_dir> <out_dir> [systems]
# Per system: a temporary camera moves hero -> CAM_<s> (via PATH_<s>_* if any) -> hero, the way the live
# model will: position eased along the polyline, look-at target eased PIVOT_hero -> PIVOT_<s>, lens and
# shift eased, facade_opacity 1 -> 0.15 -> 1. Nothing is saved back to the .blend.
import bpy, sys, os, time, math
from mathutils import Vector
exec(open(r'C:\aljazira-3d\blend\scripts\render_wb.py', encoding='utf-8').read())
args = sys.argv[sys.argv.index('--') + 1:]
frames_dir, out_dir = args[0], args[1]
systems = args[2].split(',') if len(args) > 2 else ['hvac', 'fire', 'plumbing', 'power', 'smart']
GO, HOLD = 72, 24                          # 3 s in, 1 s hold, 3 s out @ 24 fps

def ease(t): return t*t*t*(t*(t*6 - 15) + 10)

def along(pts, u):
    seg = [(pts[i+1] - pts[i]).length for i in range(len(pts) - 1)]
    d = u * sum(seg)
    for i, L in enumerate(seg):
        if d <= L or i == len(seg) - 1:
            return pts[i].lerp(pts[i+1], 0 if L == 0 else min(1, d / L))
        d -= L

sc = bpy.context.scene
O = bpy.data.objects
hero, piv_h, root_f = O['CAM_hero'], O['PIVOT_hero'], O['ARCH_facade']
log = []
for s in systems:
    t0 = time.time()
    cam_s, piv_s = O['CAM_' + s], O['PIVOT_' + s]
    path = sorted([o for o in O if o.name.startswith('PATH_%s_' % s)], key=lambda o: o.name)
    pts = [hero.matrix_world.translation.copy()] + [o.matrix_world.translation.copy() for o in path] \
          + [cam_s.matrix_world.translation.copy()]
    tgt0, tgt1 = piv_h.matrix_world.translation.copy(), piv_s.matrix_world.translation.copy()
    pc = bpy.data.objects.new('PREVIEW_cam', bpy.data.cameras.new('PREVIEW_cam'))
    sc.collection.objects.link(pc)
    pc.data.sensor_fit = 'HORIZONTAL'; pc.data.sensor_width = 36; pc.data.clip_start = 0.5; pc.data.clip_end = 5000
    pc.rotation_mode = 'QUATERNION'
    n_total = 2*GO + HOLD
    for f in range(1, n_total + 1):
        if f <= GO: e = ease((f - 1) / (GO - 1))
        elif f <= GO + HOLD: e = 1.0
        else: e = ease(1 - (f - GO - HOLD) / GO)
        eye = along(pts, e); tgt = tgt0.lerp(tgt1, e)
        pc.location = eye
        pc.rotation_quaternion = (tgt - eye).to_track_quat('-Z', 'Y')
        pc.data.lens = hero.data.lens + (cam_s.data.lens - hero.data.lens) * e
        pc.data.shift_y = hero.data.shift_y * (1 - e)
        root_f['facade_opacity'] = 1.0 + (0.15 - 1.0) * e
        for obj, path_ in ((pc, 'location'), (pc, 'rotation_quaternion'), (pc.data, 'lens'), (pc.data, 'shift_y')):
            obj.keyframe_insert(path_, frame=f)
        root_f.keyframe_insert('["facade_opacity"]', frame=f)
    setup_workbench(720)
    sc.camera = pc; sc.frame_start, sc.frame_end = 1, n_total
    d = os.path.join(frames_dir, s); os.makedirs(d, exist_ok=True)
    sc.render.filepath = os.path.join(d, 'f_####')
    bpy.ops.render.render(animation=True)
    # fallback end-frame still from the static CAM_<s>, facade ghosted
    root_f.animation_data_clear(); root_f['facade_opacity'] = 0.15
    still(os.path.join(out_dir, s + '_end.png'), 'CAM_' + s, 1, 1024)
    root_f['facade_opacity'] = 1.0
    bpy.data.objects.remove(pc, do_unlink=True)
    log.append('%s %d frames %.1fs' % (s, n_total, time.time() - t0))
    print('DONE', log[-1], flush=True)
open(os.path.join(frames_dir, 'render_log.txt'), 'w').write('\n'.join(log))
