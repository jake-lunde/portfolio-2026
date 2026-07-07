/* Bake a Flighty CSV export into flight-log JSON for the Flights viz.
   Fetches airport coords (OpenFlights) and a US states outline at bake
   time; only the airports/paths actually needed are committed.
   Usage: node scripts/flighty-bake.mjs "ref/FlightyExport-2026-07-07.csv" */

import { readFileSync, writeFileSync } from 'node:fs'

const src = process.argv[2] ?? 'ref/FlightyExport-2026-07-07.csv'

// minimal CSV parser (handles quoted fields)
function parseCSV(text) {
  const rows = []
  let row = [], cur = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') q = false
      else cur += ch
    } else if (ch === '"') q = true
    else if (ch === ',') { row.push(cur); cur = '' }
    else if (ch === '\n' || ch === '\r') {
      if (cur !== '' || row.length) { row.push(cur); rows.push(row); row = []; cur = '' }
    } else cur += ch
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row) }
  return rows
}

const [header, ...rows] = parseCSV(readFileSync(src, 'utf8'))
const col = (name) => header.indexOf(name)
const C = {
  date: col('Date'), airline: col('Airline'), flight: col('Flight'),
  from: col('From'), to: col('To'), canceled: col('Canceled'),
  dep: col('Gate Departure (Actual)'), arr: col('Gate Arrival (Actual)'),
  aircraft: col('Aircraft Type Name'),
}

const flights = rows
  .filter((r) => r.length > 4 && r[C.canceled] !== 'true' && r[C.from] && r[C.to])
  .map((r) => ({
    date: r[C.date],
    airline: r[C.airline],
    flight: r[C.flight],
    from: r[C.from],
    to: r[C.to],
    aircraft: r[C.aircraft] || '',
    dep: r[C.dep] || '',
    arr: r[C.arr] || '',
  }))
  .sort((a, b) => a.date.localeCompare(b.date))

const iatas = [...new Set(flights.flatMap((f) => [f.from, f.to]))]
console.log(`${flights.length} flights · airports: ${iatas.join(' ')}`)

// airport coords from OpenFlights
const dat = await (await fetch(
  'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat'
)).text()
const coords = {}
for (const row of parseCSV(dat)) {
  const iata = row[4]
  if (iatas.includes(iata)) coords[iata] = { lat: +row[6], lon: +row[7] }
}
const missing = iatas.filter((i) => !coords[i])
if (missing.length) console.warn('MISSING COORDS:', missing)

// US states outline (contiguous; keep AK/HI only if flown to)
const gj = await (await fetch(
  'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'
)).json()
const usedLats = Object.values(coords).map((c) => c.lat)
const usedLons = Object.values(coords).map((c) => c.lon)
const keepAK = usedLons.some((l) => l < -130)
const keepHI = usedLats.some((l, i) => l < 23 && usedLons[i] < -150)

// projection: equirectangular over combined bounds of outline + airports
const allPts = []
for (const f of gj.features) {
  if (f.properties.name === 'Alaska' && !keepAK) continue
  if (f.properties.name === 'Hawaii' && !keepHI) continue
  if (f.properties.name === 'Puerto Rico') continue
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  for (const poly of polys) for (const ring of poly) for (const [lon, lat] of ring) allPts.push([lon, lat])
}
// bounds come from the US outline only — the doc wants a map of America;
// airports beyond it (international) clamp to the frame edge as off-map pins
const lat0 = allPts.reduce((s, p) => s + p[1], 0) / allPts.length
const kx = Math.cos((lat0 * Math.PI) / 180)
const lons = allPts.map((p) => p[0] * kx)
const lats = allPts.map((p) => p[1])
const minX = Math.min(...lons), maxX = Math.max(...lons)
const minY = Math.min(...lats), maxY = Math.max(...lats)
const W = 640
const scale = (W - 20) / (maxX - minX)
const H = Math.round((maxY - minY) * scale + 20)
const px = (lon, lat) => [
  +((lon * kx - minX) * scale + 10).toFixed(1),
  +((maxY - lat) * scale + 10).toFixed(1),
]

// state outline paths, downsampled
const statePaths = []
for (const f of gj.features) {
  if (f.properties.name === 'Alaska' && !keepAK) continue
  if (f.properties.name === 'Hawaii' && !keepHI) continue
  if (f.properties.name === 'Puerto Rico') continue
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  let d = ''
  for (const poly of polys) {
    for (const ring of poly) {
      const step = Math.max(1, Math.floor(ring.length / 60))
      const pts = ring.filter((_, i) => i % step === 0)
      d += 'M' + pts.map(([lon, lat]) => px(lon, lat).join(',')).join('L') + 'Z'
    }
  }
  statePaths.push(d)
}

const airports = Object.fromEntries(
  iatas.map((i) => {
    const [x, y] = px(coords[i].lon, coords[i].lat)
    const cx = Math.max(14, Math.min(W - 14, x))
    const cy = Math.max(14, Math.min(H - 14, y))
    const off = cx !== x || cy !== y
    return [i, off ? [cx, cy, 1] : [cx, cy]]
  })
)

const data = {
  baked: new Date().toISOString().slice(0, 10),
  viewH: H,
  states: statePaths,
  airports,
  flights: flights.map((f) => ({
    date: f.date,
    airline: f.airline,
    no: f.flight,
    from: f.from,
    to: f.to,
    aircraft: f.aircraft,
  })),
}

writeFileSync('src/programs/visualizers/flights-data.json', JSON.stringify(data))
const yr = (y) => flights.filter((f) => f.date.startsWith(y)).length
console.log(`baked · H=${H} · states=${statePaths.length} · 2024:${yr('2024')} 2025:${yr('2025')} 2026:${yr('2026')}`)
