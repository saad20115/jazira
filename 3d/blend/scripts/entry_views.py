# R5: ONE definition of the "system entered" state, shared by the GLB export (scene extras 'enter' + per-system
# 'section', via motion_extras.py) and the Cycles end stills (render_ends.py), so still and live match.
# Blender space here; motion_extras converts to glTF.
import bpy
from mathutils import Vector

ENTER = {
    'facade_opacity': 0.08,          # remaining (far-side) facade: a faint veil, not a milky glass box
    'interior_opacity': 0.08,        # slabs / core that are not the system's own floors
    'glass_emissive_scale': 0.15,    # lit rooms barely glow while you look through them
    'transparent_depth_write': False,
    'floor_slab_opacity': 1.0,       # the system's own floor slabs (SYS_<s>.floor_slabs) stay solid
    'other_systems_opacity': 0.12,   # the other four systems step back
    'site_emissive_scale': 0.08,     # baked site light (lobby-lit plinth / canopies / plaza) dims while entered (v019c)
    'site_occlusion_scale': 0.7,     # ... and their black occlusion eases, so the sky tints them navy as in Cycles
}
SECTION_MARGIN = 2.0                 # the section plane sits this far in front of PIVOT_<s>, towards CAM_<s>

def section_blender(s):
    """Vertical plane facing from CAM_<s> to PIVOT_<s>: (n, q) in Blender space. Facade and interior geometry on the
    camera side of it (n . (p - q) < 0) is cut away; the systems and the system's own floor slabs are never cut."""
    O = bpy.data.objects
    pv = O['PIVOT_' + s].matrix_world.translation.copy()
    n = pv - O['CAM_' + s].matrix_world.translation; n.z = 0; n.normalize()
    return n, pv - n * SECTION_MARGIN
