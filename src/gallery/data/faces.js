// Faces in the gallery photos, grouped by person ("key faces").
//
// The data comes from `src/gallery/assets/photos/faces.json`, written by `npm run photos:faces`
// (scripts/faces.py), which finds the faces in every local photo and groups them by person. Each
// face has a box (x, y, w, h as fractions of the photo, from the top left). Without that file, or
// without local photos, the gallery has no key faces and the People button is left out.
//
// Scanning a face is simulated in the prototype: there's no face matching in the browser, so a scan
// always "finds" `SCAN_MATCH`. A real gallery would send the selfie to the same service that grouped
// the faces and get a person id back.

import { localPhotos } from '../../data/gallery'

const raw = Object.values(import.meta.glob('../assets/photos/faces.json', { eager: true, import: 'default' }))[0] || { people: [], photos: {} }
const byName = Object.fromEntries(localPhotos.map((p) => [p.name, p]))

/** Person ids in each photo: `Map<photoId, Set<personId>>`. */
export const facesByPhoto = new Map(
  Object.entries(raw.photos)
    .filter(([name]) => byName[name])
    .map(([name, faces]) => [byName[name].id, new Set(faces.map((f) => f.person))])
)

/** Key faces, most photographed first: `{ id, label, photo, box }`. `photo` + `box` draw the face. */
export const people = raw.people
  .filter((p) => byName[p.cover.file])
  .map((p, i) => ({ id: p.id, label: `Person ${i + 1}`, photo: byName[p.cover.file], box: p.cover.box }))

export const personById = Object.fromEntries(people.map((p) => [p.id, p]))

/** Who a face scan "finds" in the prototype. */
export const SCAN_MATCH = people[0]?.id ?? null

/**
 * Photos (from `photos`, in order) showing the chosen people. `mode` 'any' keeps photos with at
 * least one of them; 'all' keeps only photos where every one of them is in the same shot.
 */
export function withFaces(photos, ids, mode = 'any') {
  if (!ids.length) return []
  return photos.filter((p) => {
    const here = facesByPhoto.get(p.id)
    if (!here) return false
    return mode === 'all' ? ids.every((id) => here.has(id)) : ids.some((id) => here.has(id))
  })
}
