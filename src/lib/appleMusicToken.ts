import jwt from "jsonwebtoken";

// Apple caps developer token lifetime at ~6 months. We sign one and reuse it
// from memory until it's close to expiring, so we're not re-signing on every request.
const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * 180;

let cached: { token: string; expiresAt: number } | null = null;

function getPrivateKey(): string {
  const base64Key = process.env.APPLE_PRIVATE_KEY_BASE64;
  if (!base64Key) {
    throw new Error(
      "Missing APPLE_PRIVATE_KEY_BASE64 env var. Base64-encode your .p8 file's contents and set it."
    );
  }
  return Buffer.from(base64Key, "base64").toString("utf-8");
}

/**
 * Signs (or returns a cached) Apple Music API developer token.
 * This token proves your APP is allowed to call the API — it is NOT tied
 * to any individual user. Safe to expose to a browser (MusicKit JS needs it client-side).
 */
export function getDeveloperToken(): string {
  const now = Math.floor(Date.now() / 1000);

  // Reuse the cached token as long as it's not within 5 minutes of expiring.
  if (cached && cached.expiresAt - now > 300) {
    return cached.token;
  }

  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;

  if (!teamId || !keyId) {
    throw new Error("Missing APPLE_TEAM_ID or APPLE_KEY_ID env var.");
  }

  const token = jwt.sign({}, getPrivateKey(), {
    algorithm: "ES256",
    issuer: teamId,
    keyid: keyId,
    expiresIn: TOKEN_LIFETIME_SECONDS,
  });

  cached = { token, expiresAt: now + TOKEN_LIFETIME_SECONDS };
  return token;
}
