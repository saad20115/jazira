# R5 dusk sky: ONE definition used by the Cycles world, the GLB extras (extras.sky) and the web viewer, so the
# hero still and the live model see the same sky and the same lighting (no HDRI, zero texture bytes).
#   colour(dir) = ramp(elevation) + glow_color * max(0, dot(dir, glow_dir)) ** glow_exponent
#                                 * exp(-(elevation_deg / glow_height_deg)^2)        (smooth, no hard edges)
#   ramp: linear interpolation in elevation DEGREES between the stops, clamped outside them.
# Colours are linear-sRGB radiance (Cycles world strength 1.0 / three.js environmentIntensity 1.0).
import bpy, math

SKY = {
    'stops': [                                   # (elevation_deg, linear RGB)
        (-10.0, (0.170, 0.190, 0.250)),          # below the horizon: dusk blue-grey ground haze (v021 N-5: was navy, read black)
        (-3.0,  (0.172, 0.224, 0.352)),          # v021: holds the band just under the horizon at its v020 value
        (0.0,   (0.230, 0.300, 0.470)),          # horizon: pale blue haze
        (4.0,   (0.080, 0.190, 0.540)),          # dusk blue (CAM_hero sees the sky only up to ~9 deg elevation)
        (10.0,  (0.020, 0.075, 0.320)),          # deep blue, top of the hero frame
        (60.0,  (0.008, 0.030, 0.150)),          # zenith
    ],
    'glow_azimuth_deg': 95.0,                    # Blender world azimuth (from +X towards +Y): right of the tower in the hero
                                                 # frame, 16 deg off the east face's mirror direction (79 deg)
    'glow_color': (1.40, 0.55, 0.14),            # orange sunset glow (exponent 60: soft in azimuth) ...
    'glow_exponent': 60.0,
    'glow_height_deg': 2.5,                      # ... Gaussian in elevation, sigma 2.5 deg: a band on the horizon
}

def glow_dir_blender():
    a = math.radians(SKY['glow_azimuth_deg'])
    return (math.cos(a), math.sin(a), 0.0)

def sky_extras():
    """extras.sky for the GLB, in glTF space (+Y up; Blender (x, y, z) -> glTF (x, z, -y))."""
    gx, gy, gz = glow_dir_blender()
    return {
        'model': 'ramp(elevation_deg, linear) + glow_color * max(0, dot(dir, glow_dir)) ^ glow_exponent'
                 ' * exp(-(elevation_deg / glow_height_deg) ^ 2)',
        'color_space': 'linear-srgb radiance; environmentIntensity 1, background = same function',
        'stops': [{'elevation_deg': e, 'color': list(c)} for e, c in SKY['stops']],
        'glow_dir': [round(gx, 6), round(gz, 6), round(-gy, 6)],
        'glow_color': list(SKY['glow_color']),
        'glow_exponent': SKY['glow_exponent'],
        'glow_height_deg': SKY['glow_height_deg'],
    }

def build_world(strength=1.0):
    """Cycles/EEVEE world from SKY: direction -> elevation ramp + glow lobe. strength 0 = black (bakes)."""
    sc = bpy.context.scene
    w = bpy.data.worlds.get('WORLD_dusk') or bpy.data.worlds.new('WORLD_dusk')
    sc.world = w; w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear(); N = nt.nodes.new; L = nt.links.new
    out = N('ShaderNodeOutputWorld'); bg = N('ShaderNodeBackground'); bg.inputs['Strength'].default_value = strength
    tc = N('ShaderNodeTexCoord')
    nrm = N('ShaderNodeVectorMath'); nrm.operation = 'NORMALIZE'; L(tc.outputs['Generated'], nrm.inputs[0])
    sep = N('ShaderNodeSeparateXYZ'); L(nrm.outputs['Vector'], sep.inputs['Vector'])
    asin = N('ShaderNodeMath'); asin.operation = 'ARCSINE'; L(sep.outputs['Z'], asin.inputs[0])
    deg = N('ShaderNodeMath'); deg.operation = 'MULTIPLY'; deg.inputs[1].default_value = 180.0 / math.pi
    L(asin.outputs[0], deg.inputs[0])
    lo, hi = SKY['stops'][0][0], SKY['stops'][-1][0]
    mr = N('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = lo; mr.inputs['From Max'].default_value = hi
    mr.clamp = True; L(deg.outputs[0], mr.inputs['Value'])
    ramp = N('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'LINEAR'
    els = ramp.color_ramp.elements
    while len(els) < len(SKY['stops']): els.new(0.5)
    for el, (e, c) in zip(els, SKY['stops']):
        el.position = (e - lo) / (hi - lo); el.color = (*c, 1.0)
    L(mr.outputs['Result'], ramp.inputs['Fac'])
    dot = N('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'
    dot.inputs[1].default_value = glow_dir_blender(); L(nrm.outputs['Vector'], dot.inputs[0])
    mx = N('ShaderNodeMath'); mx.operation = 'MAXIMUM'; mx.inputs[1].default_value = 0.0; L(dot.outputs['Value'], mx.inputs[0])
    pw = N('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = SKY['glow_exponent']; L(mx.outputs[0], pw.inputs[0])
    dv = N('ShaderNodeMath'); dv.operation = 'DIVIDE'; dv.inputs[1].default_value = SKY['glow_height_deg']
    L(deg.outputs[0], dv.inputs[0])                                        # Gaussian in elevation: exp(-(el / h)^2)
    sq = N('ShaderNodeMath'); sq.operation = 'MULTIPLY'; L(dv.outputs[0], sq.inputs[0]); L(dv.outputs[0], sq.inputs[1])
    ng = N('ShaderNodeMath'); ng.operation = 'MULTIPLY'; ng.inputs[1].default_value = -1.0; L(sq.outputs[0], ng.inputs[0])
    hf = N('ShaderNodeMath'); hf.operation = 'EXPONENT'; L(ng.outputs[0], hf.inputs[0])
    gm = N('ShaderNodeMath'); gm.operation = 'MULTIPLY'; L(pw.outputs[0], gm.inputs[0]); L(hf.outputs[0], gm.inputs[1])
    gc = N('ShaderNodeVectorMath'); gc.operation = 'SCALE'; gc.inputs[0].default_value = SKY['glow_color']
    L(gm.outputs[0], gc.inputs['Scale'])
    add = N('ShaderNodeVectorMath'); add.operation = 'ADD'
    L(ramp.outputs['Color'], add.inputs[0]); L(gc.outputs['Vector'], add.inputs[1])
    L(add.outputs['Vector'], bg.inputs['Color']); L(bg.outputs['Background'], out.inputs['Surface'])
    return w
