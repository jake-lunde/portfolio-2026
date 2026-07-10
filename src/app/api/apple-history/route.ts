import { NextResponse } from 'next/server'
import { getDeveloperToken } from '@/lib/appleMusicToken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* Recent listening via Apple Music. Reality check (per HERTZ research):
   Apple's API caps recently-played at ~50 tracks, max limit 10 per page,
   and provides NO played-at timestamps — so this is an unordered
   snapshot, not a dated history. We aggregate it per artist and let the
   bake script fold it into the Scrobbles viz as the "Apple era". */

const BASE = 'https://api.music.apple.com/v1/me/recent/played/tracks'

export async function GET() {
  const musicUserToken = process.env.MUSIC_USER_TOKEN
  if (!musicUserToken) {
    return NextResponse.json({ configured: false, sampled: 0, artists: [] })
  }

  let developerToken: string
  try {
    developerToken = getDeveloperToken()
  } catch {
    return NextResponse.json({ configured: false, sampled: 0, artists: [] })
  }

  const headers = {
    Authorization: `Bearer ${developerToken}`,
    'Music-User-Token': musicUserToken,
  }

  const byArtist = new Map<string, number>()
  let sampled = 0
  // page until the ~50-item cap; hard stop at offset 90 as a guard
  for (let offset = 0; offset <= 90; offset += 10) {
    const res = await fetch(`${BASE}?limit=10&offset=${offset}`, {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) break
    const json = await res.json()
    const items: Array<{ attributes?: { artistName?: string } }> = json?.data ?? []
    if (items.length === 0) break
    for (const item of items) {
      const artist = item.attributes?.artistName
      if (!artist) continue
      byArtist.set(artist, (byArtist.get(artist) ?? 0) + 1)
      sampled++
    }
    if (!json?.next) break
  }

  const artists = [...byArtist.entries()]
    .map(([name, plays]) => ({ name, plays }))
    .sort((a, b) => b.plays - a.plays)

  return NextResponse.json({ configured: true, sampled, artists })
}
