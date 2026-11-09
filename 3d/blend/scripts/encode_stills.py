# Background job (factory startup): blender -b --factory-startup -P encode_stills.py -- <stills_dir> <scaled_dir>
# Website stills package (brief §3 / §6) from a release: the 2048 PNG masters in <stills_dir> plus their lanczos
# downscales in <scaled_dir> (ffmpeg, <name>_<w>.png) are encoded to .webp (ffmpeg libwebp) and .jpg (Blender, no
# view transform) at quality 85, then stills_manifest.json lists every file (name, bytes, w x h, format,
# sha256), the release it derives from (GLB hashes) and the render settings.
import bpy, sys, os, json, hashlib, glob, subprocess
args = sys.argv[sys.argv.index('--') + 1:]
stills, scaled = args[0], args[1]
REL = args[2] if len(args) > 2 else 'v020'                       # release name
GLB_DIR = args[3] if len(args) > 3 else r'C:\aljazira-3d\web'    # where that release's GLBs + manifest live
Q = 85
SIZES = {'hero': (2048, 1440, 828), 'end': (2048, 1440)}

def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()

sc = bpy.context.scene                                  # jpg writer: Standard view = sRGB pixels out unchanged
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = Q
sc.render.image_settings.color_mode = 'RGB'

def encode(src, stem):
    """jpg: Blender JPEG writer at Q. webp: ffmpeg libwebp lossy at Q (Blender's Image.save copied the PNG bytes)."""
    img = bpy.data.images.load(src); img.colorspace_settings.name = 'sRGB'
    pj = os.path.join(stills, stem + '.jpg')
    img.save_render(filepath=pj, scene=sc)              # (Image.save copies an unmodified file's bytes as they are)
    bpy.data.images.remove(img)
    pw = os.path.join(stills, stem + '.webp')
    subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-c:v', 'libwebp', '-quality', str(Q), '-compression_level', '6',
                    '-preset', 'photo', '-y', pw], check=True)
    return [pw, pj]

masters = sorted(glob.glob(os.path.join(stills, '*_2048.png')))
for m in masters:
    base = os.path.basename(m)[:-len('_2048.png')]               # hero | <s>_end
    for w in SIZES['hero' if base == 'hero' else 'end']:
        src = m if w == 2048 else os.path.join(scaled, '%s_%d.png' % (base, w))
        encode(src, '%s_%d' % (base, w))
        print('ENCODED', base, w, flush=True)

files = []
for p in sorted(glob.glob(os.path.join(stills, '*'))):
    n = os.path.basename(p)
    if n == 'stills_manifest.json': continue
    e = {'name': n, 'bytes': os.path.getsize(p), 'sha256': sha(p)}
    if n.endswith(('.png', '.webp', '.jpg')):
        img = bpy.data.images.load(p); e['size'] = list(img.size); bpy.data.images.remove(img)
        e['format'] = {'png': 'PNG (master, 8-bit RGB)', 'webp': 'WebP q%d' % Q, 'jpg': 'JPEG q%d' % Q}[n.rsplit('.', 1)[1]]
    else:
        e['format'] = 'JSON hotspots (x, y 0-1 from top-left through CAM_<s>; filter on in_frame)'
    files.append(e)
web = GLB_DIR
manifest = {
    'release': REL,
    'derived_from': {n: {'bytes': os.path.getsize(os.path.join(web, n)), 'sha256': sha(os.path.join(web, n))}
                     for n in ('tower.glb', 'tower-lite.glb', 'manifest.json')},
    'master_blend': 'blend/aljazira_tower_r5c_%s.blend' % REL,
    'render': {'engine': 'Cycles (OptiX GPU)', 'spp': 256, 'adaptive_threshold': 0.02, 'denoiser': 'OptiX',
               'view_transform': 'AgX', 'look': 'AgX - Medium High Contrast', 'exposure': 0.0,
               'camera': {'hero': 'CAM_hero', 'ends': 'CAM_<s>'}, 'resolution_master': [2048, 2048],
               'state_ends': 'entered (highlight variant, faded facade / interior, section plane, glow on, fans as '
                             'static rotors) = render_ends.py, matching the live end'},
    'downscale': 'ffmpeg lanczos from the 1:1 2048 master, no reframing (photo -> live crossfade stays exact)',
    'encode': 'jpg: Blender JPEG writer quality %d (Standard view, pixels unchanged); webp: ffmpeg libwebp lossy quality %d, compression_level 6, preset photo' % (Q, Q),
    'files': files,
}
json.dump(manifest, open(os.path.join(stills, 'stills_manifest.json'), 'w'), indent=1)
print('MANIFEST %d files' % len(files), flush=True)
