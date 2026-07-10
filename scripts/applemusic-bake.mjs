/* Fold the Apple Music era into the baked Scrobbles data.
   Fetches the aggregated recent-played snapshot from the live site
   (which holds the tokens) and annotates scrobbles-data.json with an
   `apple` section + the index where the last.fm signal drops off.
   Usage: node scripts/applemusic-bake.mjs [origin] */

import { readFileSync, writeFileSync } from 'node:fs'

const origin = process.argv[2] ?? 'https://lunde.co'
const path = 'src/programs/visualizers/scrobbles-data.json'

const res = await fetch(`${origin}/api/apple-history`, { redirect: 'follow' })
if (!res.ok) throw new Error(`apple-history returned ${res.status}`)
const apple = await res.json()
if (!apple.configured) throw new Error('Apple Music not configured on the server')

const data = JSON.parse(readFileSync(path, 'utf8'))

// dropoff = start of the trailing run of zero-play weeks
let gapFrom = data.weeks.length
while (gapFrom > 0 && data.weeks[gapFrom - 1].plays === 0) gapFrom--

data.apple = {
  baked: new Date().toISOString().slice(0, 10),
  gapFrom,
  sampled: apple.sampled,
  artists: apple.artists.slice(0, 8),
}

writeFileSync(path, JSON.stringify(data))
console.log(
  `apple era: weeks ${gapFrom}–${data.weeks.length - 1} · ${apple.sampled} recent plays · top: ${apple.artists[0]?.name ?? '—'}`
)
