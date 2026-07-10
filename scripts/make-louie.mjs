/* Louie, hand-modeled — no scan yet, so build him from primitives the way
   the pixel sprite was built from squares: overlapping low-res UV spheres
   (flat-shaded shells read as one fluffy poodle). Same JSON contract as
   obj-to-model.mjs output. Usage: node scripts/make-louie.mjs */

import { writeFileSync } from 'node:fs'

const verts = []
const faces = []

/** low-res UV sphere at center c, radii r (per-axis), rings×segs */
function blob([cx, cy, cz], [rx, ry, rz], rings = 6, segs = 8, jitter = 0) {
  const base = verts.length
  for (let i = 0; i <= rings; i++) {
    const phi = (i / rings) * Math.PI
    for (let j = 0; j < segs; j++) {
      const theta = (j / segs) * Math.PI * 2
      const jr = 1 + (jitter ? (Math.sin(i * 7.3 + j * 3.1) * 0.5 + 0.5) * jitter : 0)
      verts.push([
        cx + rx * jr * Math.sin(phi) * Math.cos(theta),
        cy + ry * jr * Math.cos(phi),
        cz + rz * jr * Math.sin(phi) * Math.sin(theta),
      ])
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = base + i * segs + j
      const b = base + i * segs + ((j + 1) % segs)
      const c = base + (i + 1) * segs + j
      const d = base + (i + 1) * segs + ((j + 1) % segs)
      if (i > 0) faces.push([a, b, c])
      if (i < rings - 1) faces.push([b, d, c])
    }
  }
}

// proportions from the ref photos: compact body, big round head, floppy
// ears, snout, four legs, pom tail. y up, z forward (nose +z). jitter = curls.
blob([0, 0.05, -0.1], [0.62, 0.5, 0.85], 7, 10, 0.10) // body fluff
blob([0, 0.72, 0.62], [0.44, 0.42, 0.4], 6, 9, 0.12) // head fluff
blob([0, 0.98, 0.6], [0.3, 0.18, 0.26], 5, 8, 0.14) // topknot
blob([0, 0.58, 0.98], [0.17, 0.14, 0.22], 4, 7, 0) // snout
blob([0, 0.55, 1.19], [0.07, 0.06, 0.07], 3, 6, 0) // nose
blob([-0.42, 0.62, 0.62], [0.13, 0.3, 0.18], 5, 7, 0.1) // ear L
blob([0.42, 0.62, 0.62], [0.13, 0.3, 0.18], 5, 7, 0.1) // ear R
blob([-0.3, -0.62, 0.42], [0.14, 0.34, 0.14], 4, 7, 0.06) // leg FL
blob([0.3, -0.62, 0.42], [0.14, 0.34, 0.14], 4, 7, 0.06) // leg FR
blob([-0.3, -0.62, -0.52], [0.14, 0.34, 0.14], 4, 7, 0.06) // leg BL
blob([0.3, -0.62, -0.52], [0.14, 0.34, 0.14], 4, 7, 0.06) // leg BR
blob([0, 0.42, -0.95], [0.18, 0.2, 0.18], 4, 7, 0.16) // tail pom

// normalize like the flowers pipeline: center + unit max extent
const c = [0, 1, 2].map((k) => verts.reduce((s, v) => s + v[k], 0) / verts.length)
let maxR = 0
for (const v of verts) {
  for (const k of [0, 1, 2]) v[k] -= c[k]
  maxR = Math.max(maxR, Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2]))
}
for (const v of verts) for (const k of [0, 1, 2]) v[k] /= maxR

const round = (n) => Math.round(n * 1000) / 1000
writeFileSync(
  'src/programs/visualizers/louie-model.json',
  JSON.stringify({ name: 'louie', verts: verts.map((v) => v.map(round)), faces })
)
console.log(`louie: ${verts.length} verts · ${faces.length} faces`)
