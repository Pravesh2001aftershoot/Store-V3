"""Finds the faces in the gallery photos and groups them by person.

Writes src/gallery/assets/photos/faces.json, which the gallery's face filter reads. Run it again
after adding or removing photos:

    npm run photos:faces
    python3 scripts/faces.py --sheet <dir>   # also writes a crop per face, <person>_<n>.jpg, to check the groups

Needs the `face_recognition` package (dlib's face model), installed once in a virtualenv:

    python3.13 -m venv .venv-faces
    .venv-faces/bin/pip install dlib-bin face_recognition_models "setuptools<81" pillow numpy
    .venv-faces/bin/pip install --no-deps face_recognition

A production gallery would get the same data from a face-recognition service when photos are uploaded.
"""

import json
import os
import sys
from pathlib import Path

import dlib
import face_recognition
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / 'src/gallery/assets/photos'
OUT = PHOTOS / 'faces.json'

MAX_SIDE = 1400   # photos are scaled down to this before detecting
MIN_FACE = 0.06   # face height as a share of the photo's short edge; smaller faces are background guests
MATCH = 0.48      # face-distance threshold for "same person" (dlib's default is 0.6; lower is stricter)
MIN_SHARP = 160   # Laplacian variance of the face at 100px; below this it's blurry (or not a face at all)
KEY_MIN = 5       # a person needs to be in at least this many photos to be a key face
KEY_MAX = 12

sheet = Path(sys.argv[sys.argv.index('--sheet') + 1]) if '--sheet' in sys.argv else None
files = sorted(
    (f for f in os.listdir(PHOTOS) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))),
    key=lambda s: [int(t) if t.isdigit() else t for t in __import__('re').split(r'(\d+)', s)],
)

def sharpness(crop):
    a = np.asarray(crop.convert('L').resize((100, 100)), dtype=float)
    lap = a[1:-1, 1:-1] * 4 - a[:-2, 1:-1] - a[2:, 1:-1] - a[1:-1, :-2] - a[1:-1, 2:]
    return lap.var()


def is_face(crop):
    """Second opinion from dlib's CNN detector, which rejects the HOG detector's flowers and tattoos."""
    c = crop.copy()
    c.thumbnail((240, 240))
    return len(face_recognition.face_locations(np.asarray(c), number_of_times_to_upsample=1, model='cnn')) > 0


faces = []  # (file, box [x, y, w, h] normalised top-left, size, encoding, crop)
for n, name in enumerate(files):
    img = ImageOps.exif_transpose(Image.open(PHOTOS / name)).convert('RGB')
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    W, H = img.size
    arr = np.asarray(img)
    locs = face_recognition.face_locations(arr, number_of_times_to_upsample=1, model='hog')
    locs = [l for l in locs if (l[2] - l[0]) / min(W, H) >= MIN_FACE]
    for (top, right, bottom, left), enc in zip(locs, face_recognition.face_encodings(arr, locs, num_jitters=2, model='large')):
        size = (bottom - top) / min(W, H)
        pad = (bottom - top) * 0.35
        crop = img.crop((max(0, left - pad), max(0, top - pad), min(W, right + pad), min(H, bottom + pad)))
        if sharpness(crop) < MIN_SHARP or not is_face(crop):
            continue
        box = [round(left / W, 4), round(top / H, 4), round((right - left) / W, 4), round((bottom - top) / H, 4)]
        faces.append((name, box, size, enc, crop))
    if n % 50 == 0:
        print(f'{n}/{len(files)} photos, {len(faces)} faces', file=sys.stderr)

labels = dlib.chinese_whispers_clustering([dlib.vector(f[3].tolist()) for f in faces], MATCH)
groups = {}
for i, label in enumerate(labels):
    groups.setdefault(label, []).append(i)

ranked = sorted(
    ((members, len({faces[i][0] for i in members})) for members in groups.values()),
    key=lambda g: -g[1],
)
ranked = [g for g in ranked if g[1] >= KEY_MIN][:KEY_MAX]

people, by_file = [], {}
for n, (members, count) in enumerate(ranked):
    pid = f'person-{n + 1}'
    # Cover face: the largest one, which is usually the sharpest and closest to the camera.
    cover = max(members, key=lambda i: faces[i][2])
    people.append({'id': pid, 'photos': count, 'cover': {'file': faces[cover][0], 'box': faces[cover][1]}})
    for k, i in enumerate(sorted(members, key=lambda i: -faces[i][2])):
        name, box, _, _, crop = faces[i]
        by_file.setdefault(name, []).append({'person': pid, 'box': box})
        if sheet:
            sheet.mkdir(parents=True, exist_ok=True)
            crop.resize((120, int(120 * crop.height / crop.width))).save(sheet / f'{pid}_{k:03d}.jpg')

OUT.write_text(json.dumps({'people': people, 'photos': by_file}, separators=(',', ':')))
print(f'{len(files)} photos, {len(faces)} faces, {len(groups)} groups -> {len(people)} key faces: {[c for _, c in ranked]}')
