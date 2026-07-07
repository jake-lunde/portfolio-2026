/* Bake a photoscan OBJ into a low-poly JSON mesh for the visualizers.
   Vertex-clustering decimation: snap vertices to a grid, merge, drop
   degenerate faces. The crystalline low-poly look is the point.
   Usage: node scripts/obj-to-model.mjs "ref/flowers 1/flowers 1.obj" flowers */

import { readFileSync, writeFileSync } from 'node:fs'

const src = process.argv[2]
const name = process.argv[3] ?? 'model'
const TARGET_FACES = 2600

const text = readFileSync(src, 'utf8')
const verts = []
const faces = []

for (const line of text.split('\n')) {
  if (line.startsWith('v ')) {
    const [, x, y, z] = line.split(/\s+/)
    verts.push([+x, +y, +z])
  } else if (line.startsWith('f ')) {
    const idx = line
      .slice(2)
      .trim()
      .split(/\s+/)
      .map((w) => parseInt(w.split('/')[0], 10) - 1)
    for (let i = 1; i < idx.length - 1; i++) faces.push([idx[0], idx[i], idx[i + 1]])
  }
}

// normalize: center on centroid, scale so max extent = 1
const c = [0, 1, 2].map((k) => verts.reduce((s, v) => s + v[k], 0) / verts.length)
let maxR = 0
for (const v of verts) {
  for (const k of [0, 1, 2]) v[k] -= c[k]
  maxR = Math.max(maxR, Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2]))
}
for (const v of verts) for (const k of [0, 1, 2]) v[k] /= maxR

function decimate(res) {
  const cell = new Map() // grid key -> new index
  const remap = new Array(verts.length)
  const outVerts = []
  for (let i = 0; i < verts.length; i++) {
    const key = verts[i].map((x) => Math.round(x * res)).join(',')
    let j = cell.get(key)
    if (j === undefined) {
      j = outVerts.length
      cell.set(key, j)
      outVerts.push([0, 0, 0, 0]) // accumulate for average
    }
    const o = outVerts[j]
    o[0] += verts[i][0]; o[1] += verts[i][1]; o[2] += verts[i][2]; o[3]++
    remap[i] = j
  }
  const seen = new Set()
  const outFaces = []
  for (const [a, b, cc] of faces) {
    const [i, j, k] = [remap[a], remap[b], remap[cc]]
    if (i === j || j === k || i === k) continue
    const key = [i, j, k].sort((x, y) => x - y).join(',')
    if (seen.has(key)) continue
    seen.add(key)
    outFaces.push([i, j, k])
  }
  return {
    verts: outVerts.map((o) => [o[0] / o[3], o[1] / o[3], o[2] / o[3]]),
    faces: outFaces,
  }
}

// find the grid resolution whose face count lands nearest the target
let best = null
for (let res = 8; res <= 128; res += 4) {
  const d = decimate(res)
  if (!best || Math.abs(d.faces.length - TARGET_FACES) < Math.abs(best.d.faces.length - TARGET_FACES)) {
    best = { res, d }
  }
  if (d.faces.length > TARGET_FACES * 1.5) break
}

const round = (n) => Math.round(n * 1000) / 1000
const out = {
  name,
  verts: best.d.verts.map((v) => v.map(round)),
  faces: best.d.faces,
}

writeFileSync(`src/programs/visualizers/${name}-model.json`, JSON.stringify(out))
console.log(
  `res=${best.res} · ${out.verts.length} verts · ${out.faces.length} faces (from ${verts.length}/${faces.length})`
)
