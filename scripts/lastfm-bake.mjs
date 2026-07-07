/* Bake Last.fm listening data into static JSON for the Scrobbles viz.
   The API key is never committed — pass it per run:
   LASTFM_API_KEY=xxx LASTFM_USER=jakelunde node scripts/lastfm-bake.mjs */

import { writeFileSync } from 'node:fs'

const KEY = process.env.LASTFM_API_KEY
const USER = process.env.LASTFM_USER ?? 'jakelunde'
if (!KEY) throw new Error('LASTFM_API_KEY required')

const api = async (params) => {
  const url =
    'https://ws.audioscrobbler.com/2.0/?format=json&api_key=' +
    KEY +
    '&' +
    new URLSearchParams(params)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${params.method}: ${res.status}`)
  return res.json()
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// top artists, 12 months
const top = await api({ method: 'user.gettopartists', user: USER, period: '12month', limit: 14 })
const artists = []
for (const a of top.topartists.artist) {
  // genre = top community tag
  let genre = ''
  try {
    const tags = await api({ method: 'artist.gettoptags', artist: a.name, autocorrect: 1 })
    genre = tags.toptags?.tag?.find((t) => !/^seen live$/i.test(t.name))?.name?.toLowerCase() ?? ''
  } catch {}
  artists.push({ name: a.name, plays: +a.playcount, genre })
  await sleep(210)
}

// top albums for artwork (hover layer)
const albums = await api({ method: 'user.gettopalbums', user: USER, period: '12month', limit: 14 })
const art = albums.topalbums.album.map((al) => ({
  album: al.name,
  artist: al.artist.name,
  img: al.image?.find((i) => i.size === 'large')?.['#text'] ?? '',
}))

// weekly scrobble counts, last 52 weeks
const chartList = await api({ method: 'user.getweeklychartlist', user: USER })
const weeks = chartList.weeklychartlist.chart.slice(-52)
const series = []
for (const w of weeks) {
  try {
    const c = await api({
      method: 'user.getweeklytrackchart',
      user: USER,
      from: w.from,
      to: w.to,
    })
    const tracks = c.weeklytrackchart?.track ?? []
    const plays = (Array.isArray(tracks) ? tracks : [tracks]).reduce(
      (s, t) => s + (+t.playcount || 0),
      0
    )
    series.push({ from: +w.from * 1000, plays })
  } catch {
    series.push({ from: +w.from * 1000, plays: 0 })
  }
  await sleep(210)
}

const data = {
  user: USER,
  baked: new Date().toISOString().slice(0, 10),
  totalYear: series.reduce((s, w) => s + w.plays, 0),
  artists,
  art,
  weeks: series,
}

writeFileSync('src/programs/visualizers/scrobbles-data.json', JSON.stringify(data))
console.log(
  `${artists.length} artists · ${series.length} weeks · ${data.totalYear} scrobbles/yr · top: ${artists[0]?.name}`
)
