/* Bake a Slopes GPX (one ski day) into JSON for the Slopes viz.
   Coordinates are normalized to local meters (consistent with the ride
   pipeline). Runs vs lifts are classified from sustained elevation trend.
   Usage: node scripts/slopes-bake.mjs "ref/March 15, 2026 - Sun Peaks Resort.gpx" */

import { readFileSync, writeFileSync } from 'node:fs'

const src = process.argv[2]
const xml = readFileSync(src, 'utf8')

const pts = [...xml.matchAll(
  /<trkpt lat="([-\d.]+)" lon="([-\d.]+)">\s*(?:<ele>([-\d.]+)<\/ele>)?\s*(?:<time>([^<]+)<\/time>)?/g
)].map((m) => ({ lat: +m[1], lon: +m[2], ele: +(m[3] ?? 0), t: +new Date(m[4]) }))

if (pts.length < 50) throw new Error(`only ${pts.length} points parsed`)

const lat0 = pts.reduce((s, p) => s + p.lat, 0) / pts.length
const lon0 = pts.reduce((s, p) => s + p.lon, 0) / pts.length
const R = 6371000
const rad = Math.PI / 180
for (const p of pts) {
  p.x = R * (p.lon - lon0) * rad * Math.cos(lat0 * rad)
  p.y = -R * (p.lat - lat0) * rad
}

// cumulative distance + smoothed elevation + speed
pts[0].d = 0
for (let i = 1; i < pts.length; i++) {
  pts[i].d = pts[i - 1].d + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
}
const smooth = (get, w) => (i) => {
  const a = Math.max(0, i - w), b = Math.min(pts.length - 1, i + w)
  let s = 0
  for (let j = a; j <= b; j++) s += get(pts[j])
  return s / (b - a + 1)
}
const sEle = smooth((p) => p.ele, 5)
for (let i = 0; i < pts.length; i++) {
  const a = pts[Math.max(0, i - 4)], b = pts[Math.min(pts.length - 1, i + 4)]
  const dt = (b.t - a.t) / 1000
  pts[i].v = dt > 0 ? (b.d - a.d) / dt : 0
  pts[i].se = sEle(i)
}

// classify: sustained elevation trend over a ±12-point window
const W = 12
const state = pts.map((_, i) => {
  const a = pts[Math.max(0, i - W)].se
  const b = pts[Math.min(pts.length - 1, i + W)].se
  const de = b - a
  return de > 4 ? 'lift' : de < -4 ? 'run' : 'idle'
})
// segment + merge blips shorter than 8 points
const segs = []
for (let i = 0; i < pts.length; i++) {
  const last = segs[segs.length - 1]
  if (last && last.type === state[i]) last.end = i
  else segs.push({ type: state[i], start: i, end: i })
}
for (let i = 1; i < segs.length; i++) {
  if (segs[i].end - segs[i].start < 8 && segs[i - 1]) segs[i].type = segs[i - 1].type
}
const merged = []
for (const s of segs) {
  const last = merged[merged.length - 1]
  if (last && last.type === s.type) last.end = s.end
  else merged.push({ ...s })
}

const M2MI = 1 / 1609.344
const M2FT = 3.28084
const runs = merged
  .filter((s) => s.type === 'run' && pts[s.start].se - pts[s.end].se > 30)
  .map((s, i) => ({
    n: i + 1,
    start: s.start,
    end: s.end,
    dropFt: Math.round((pts[s.start].se - pts[s.end].se) * M2FT),
    maxMph: +(Math.max(...pts.slice(s.start, s.end + 1).map((p) => p.v)) * 2.236936).toFixed(1),
    min: +(((pts[s.end].t - pts[s.start].t) / 60000).toFixed(1)),
  }))

// downsample for payload
const step = Math.max(1, Math.floor(pts.length / 900))
const keepIdx = pts.map((_, i) => i).filter((i) => i % step === 0)
const remap = new Map(keepIdx.map((orig, i) => [orig, i]))
const nearest = (orig) => {
  let i = orig
  while (!remap.has(i) && i > 0) i--
  return remap.get(i) ?? 0
}

const round = (n, p = 1) => Math.round(n * 10 ** p) / 10 ** p
const data = {
  resort: 'Sun Peaks Resort',
  date: new Date(pts[0].t).toISOString().slice(0, 10),
  stats: {
    runs: runs.length,
    verticalFt: runs.reduce((s, r) => s + r.dropFt, 0),
    maxMph: Math.max(...runs.map((r) => r.maxMph), 0),
    distanceMi: round(pts[pts.length - 1].d * M2MI),
    topFt: Math.round(Math.max(...pts.map((p) => p.ele)) * M2FT),
  },
  points: keepIdx.map((i) => [
    round(pts[i].x),
    round(pts[i].y),
    round(pts[i].se * M2FT),
    round(pts[i].v * 2.236936),
    Math.round((pts[i].t - pts[0].t) / 1000),
  ]),
  segs: merged.map((s) => ({ type: s.type, start: nearest(s.start), end: nearest(s.end) })),
  runs: runs.map((r) => ({ ...r, start: nearest(r.start), end: nearest(r.end) })),
}

writeFileSync('src/programs/visualizers/slopes-data.json', JSON.stringify(data))
console.log(
  `${data.points.length} pts · ${runs.length} runs · ${data.stats.verticalFt} ft vert · max ${data.stats.maxMph} mph`
)
