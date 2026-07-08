"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    MusicKit: any;
  }
}

/**
 * One-time-use page. Its only job is to run MusicKit JS's authorize() flow
 * so YOU (the Apple ID holder) can grant this app access to your listening
 * history, and hand you the resulting Music User Token to paste into env vars.
 *
 * Safe to delete this page once you've grabbed the token — nothing else
 * depends on it. If Apple ever invalidates the token, just bring it back.
 */
export default function MusicKitSetupPage() {
  const [developerToken, setDeveloperToken] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/developer-token")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setDeveloperToken(d.token);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  useEffect(() => {
    if (!developerToken) return;

    const script = document.createElement("script");
    script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
    script.async = true;
    script.onload = async () => {
      try {
        await window.MusicKit.configure({
          developerToken,
          app: { name: "Now Playing Setup", build: "1.0.0" },
        });
        setReady(true);
      } catch (e) {
        setError(String(e));
      }
    };
    script.onerror = () => setError("Failed to load MusicKit JS from Apple's CDN.");
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [developerToken]);

  const authorize = async () => {
    setError(null);
    try {
      const music = window.MusicKit.getInstance();
      const token = await music.authorize();
      setUserToken(token);
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 640 }}>
      <h1>MusicKit one-time setup</h1>
      <p>
        This grabs your personal Music User Token. Click authorize, sign in
        with the Apple ID on your Apple Music subscription, then copy the
        token below into a <code>MUSIC_USER_TOKEN</code> environment variable
        in Vercel (and redeploy).
      </p>
      <button onClick={authorize} disabled={!ready} style={{ padding: "8px 16px" }}>
        {ready ? "Authorize with Apple Music" : "Loading MusicKit…"}
      </button>
      {userToken && (
        <>
          <p style={{ marginTop: 24 }}>Your Music User Token:</p>
          <textarea
            readOnly
            value={userToken}
            rows={4}
            style={{ width: "100%", fontFamily: "monospace" }}
            onFocus={(e) => e.currentTarget.select()}
          />
        </>
      )}
      {error && <p style={{ color: "crimson", marginTop: 24 }}>{error}</p>}
    </main>
  );
}
