# Background job: blender -b aljazira_tower.blend -P drawcall_audit.py
# Lists every mesh object with its material and the web role that forbids merging it:
# variant (SYS_*), opacity (ARCH_facade / ARCH_core), floor_slab (named in a SYS root's floor_slabs), instanced.
import bpy
O = bpy.data.objects
slabs = set()
for o in O:
    if o.name.startswith('SYS_') and 'floor_slabs' in o.keys():
        slabs |= set(o['floor_slabs'])
for o in sorted((o for o in O if o.type == 'MESH'), key=lambda o: (o.users_collection[0].name, o.name)):
    c = o.users_collection[0].name
    m = o.material_slots[0].material.name if o.material_slots and o.material_slots[0].material else '-'
    role = []
    if c.startswith('SYS_'): role.append('variant')
    if c in ('ARCH_facade', 'ARCH_core'): role.append('opacity')
    if o.name in slabs: role.append('floor_slab')
    if o.parent and o.parent.name.startswith('SITE_inst_'): role.append('instanced')
    print('AUDIT %-13s %-24s %-18s %s' % (c, o.name, m, ','.join(role) or 'MERGEABLE'))
print('AUDIT slabs referenced:', sorted(slabs))
