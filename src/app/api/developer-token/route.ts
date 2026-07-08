import { NextResponse } from "next/server";
import { getDeveloperToken } from "@/lib/appleMusicToken";

export const runtime = "nodejs";

/**
 * Only exists so the /musickit-setup page can hand MusicKit JS a valid
 * developer token in the browser. Developer tokens are meant to be used
 * client-side by MusicKit JS — this is normal, not a leak of your private key.
 */
export async function GET() {
  try {
    const token = getDeveloperToken();
    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
