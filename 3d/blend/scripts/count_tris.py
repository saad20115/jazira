# Background job: blender -b aljazira_tower.blend -P count_tris.py
# Triangles per collection: rendered (every object, instances included) and stored (unique meshes, = GLB).
import bpy
dg = bpy.context.evaluated_depsgraph_get()
tot_r = tot_s = 0
for c in bpy.context.scene.collection.children:
    rendered = stored = 0; objs = 0; seen = set()
    for o in c.objects:
        if o.type != 'MESH': continue
        objs += 1
        me = o.evaluated_get(dg).to_mesh(); me.calc_loop_triangles(); n = len(me.loop_triangles)
        o.evaluated_get(dg).to_mesh_clear()
        rendered += n
        if o.data.name not in seen: stored += n; seen.add(o.data.name)
    tot_r += rendered; tot_s += stored
    print('TRIS %-13s objects %4d  stored %6d  rendered %6d' % (c.name, objs, stored, rendered))
print('TRIS TOTAL stored %d rendered %d' % (tot_s, tot_r))
