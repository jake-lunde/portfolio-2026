/* Bake a Strava GPX export into privacy-safe ride data for RideViz.
   Usage: node scripts/gpx-to-ride.mjs ref/stravaride.gpx
   - raw lat/lon never leaves this script: points are re-based to local
     meters around the route centroid
   - first/last TRIM_M meters are dropped so endpoints don't identify home
   - output: src/programs/visualizers/ride-data.json (committed) */

import { readFileSync, writeFileSync } from 'node:fs'

const TRIM_M = 150
const TARGET_POINTS = 700

const src = process.argv[2] ?? 'ref/stravaride.gpx'
const xml = readFileSync(src, 'utf8')

const name = xml.match(/<name>([^<]*)<\/name>/)?.[1] ?? 'ride'
const type = xml.match(/<type>([^<]*)<\/type>/)?.[1] ?? ''

const pts = [...xml.matchAll(
  /<trkpt lat="([-\d.]+)" lon="([-\d.]+)">\s*<ele>([-\d.]+)<\/ele>\s*<time>([^<]+)<\/time>/g
)].map((m) => ({
  lat: +m[1],
  lon: +m[2],
  ele: +m[3],
  t: +new Date(m[4]),
}))

if (pts.length < 10) throw new Error(`only ${pts.length} points parsed`)

// equirectangular projection around centroid → meters
const lat0 = pts.reduce((s, p) => s + p.lat, 0) / pts.length
const lon0 = pts.reduce((s, p) => s + p.lon, 0) / pts.length
const R = 6371000
const rad = Math.PI / 180
for (const p of pts) {
  p.x = R * (p.lon - lon0) * rad * Math.cos(lat0 * rad)
  p.y = -R * (p.lat - lat0) * rad // screen y grows downward
}

// cumulative distance
let dist = 0
pts[0].d = 0
for (let i = 1; i < pts.length; i++) {
  const dx = pts[i].x - pts[i - 1].x
  const dy = pts[i].y - pts[i - 1].y
  dist += Math.hypot(dx, dy)
  pts[i].d = dist
}

// privacy trim
const kept = pts.filter((p) => p.d >= TRIM_M && p.d <= dist - TRIM_M)

// smoothed speed (m/s) over a ±5-point window
for (let i = 0; i < kept.length; i++) {
  const a = kept[Math.max(0, i - 5)]
  const b = kept[Math.min(kept.length - 1, i + 5)]
  const dt = (b.t - a.t) / 1000
  kept[i].v = dt > 0 ? (b.d - a.d) / dt : 0
}

// downsample evenly by index
const step = Math.max(1, Math.floor(kept.length / TARGET_POINTS))
const out = kept.filter((_, i) => i % step === 0)

// stats
const M2MI = 1 / 1609.344
const M2FT = 3.28084
let gain = 0
for (let i = 1; i < kept.length; i++) {
  const de = kept[i].ele - kept[i - 1].ele
  if (de > 0) gain += de
}
const movingMs = kept.filter((p) => p.v > 0.5).length > 0
  ? kept[kept.length - 1].t - kept[0].t
  : 0
const maxV = Math.max(...kept.map((p) => p.v))
const totalMi = (kept[kept.length - 1].d - kept[0].d) * M2MI

const startDate = new Date(pts[0].t)
const round = (n, p = 1) => Math.round(n * 10 ** p) / 10 ** p

const data = {
  name,
  type,
  date: startDate.toISOString().slice(0, 10),
  stats: {
    distanceMi: round(totalMi),
    elevGainFt: Math.round(gain * M2FT),
    movingMin: Math.round(movingMs / 60000),
    avgMph: round(totalMi / (movingMs / 3600000)),
    maxMph: round(maxV * 2.236936),
  },
  // parallel arrays, rounded for payload size
  points: out.map((p) => [
    round(p.x),
    round(p.y),
    round(p.ele * M2FT),          // ft
    round(p.v * 2.236936),        // mph
    round((p.d - kept[0].d) * M2MI, 2), // mi
    Math.round((p.t - kept[0].t) / 1000), // s elapsed
  ]),
}

writeFileSync('src/programs/visualizers/ride-data.json', JSON.stringify(data))
console.log(
  `${out.length} pts · ${data.stats.distanceMi} mi · +${data.stats.elevGainFt} ft · avg ${data.stats.avgMph} mph · "${name}"`
)
