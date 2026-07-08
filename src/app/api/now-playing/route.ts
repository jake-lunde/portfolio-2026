import { NextResponse } from "next/server";
import { getDeveloperToken } from "@/lib/appleMusicToken";

export const runtime = "nodejs";
// This data changes constantly — never let Next.js or Vercel cache the response.
export const dynamic = "force-dynamic";

const RECENT_TRACKS_URL =
  "https://api.music.apple.com/v1/me/recent/played/tracks?limit=1";

export async function GET() {
  const musicUserToken = process.env.MUSIC_USER_TOKEN;

  // not configured yet → 200 with hasTrack:false so the widget hides quietly
  if (!musicUserToken) {
    return NextResponse.json({ hasTrack: false, configured: false });
  }

  let developerToken: string;
  try {
    developerToken = getDeveloperToken();
  } catch {
    return NextResponse.json({ hasTrack: false, configured: false });
  }

  const appleRes = await fetch(RECENT_TRACKS_URL, {
    headers: {
      Authorization: `Bearer ${developerToken}`,
      "Music-User-Token": musicUserToken,
    },
    cache: "no-store",
  });

  if (!appleRes.ok) {
    const detail = await appleRes.text();
    return NextResponse.json(
      { error: `Apple Music API returned ${appleRes.status}`, detail },
      { status: appleRes.status }
    );
  }

  const json = await appleRes.json();
  const item = json?.data?.[0];

  if (!item) {
    return NextResponse.json({ hasTrack: false });
  }

  const artwork = item.attributes?.artwork;
  const artworkUrl = artwork
    ? artwork.url
        .replace("{w}", String(artwork.width ?? 500))
        .replace("{h}", String(artwork.height ?? 500))
    : null;

  return NextResponse.json({
    hasTrack: true,
    // Apple's API only exposes recent play history, not live playback state —
    // this is your most recently played track, not necessarily playing right now.
    title: item.attributes?.name ?? null,
    artist: item.attributes?.artistName ?? null,
    album: item.attributes?.albumName ?? null,
    artworkUrl,
    appleMusicUrl: item.attributes?.url ?? null,
  });
}
