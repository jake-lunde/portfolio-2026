'use client'

import { useCallback, useEffect, useState } from 'react'

/* Private review desk for the moderated photo wall. Not linked anywhere —
   reached only via /wall-review?key=<CC_FEED_KEY>. Reads the key from the
   URL on mount (no useSearchParams/Suspense needed), then talks to
   /api/wall?admin=1 for the pending queue and plain /api/wall for the
   live photos. */

type PendingItem = { pathname: string; url: string; uploadedAt: string }
type Status = 'loading' | 'ok' | 'unauthorized'

const CREAM = '#E7E1D2'
const INK = '#17150D'
const LINE = 'rgba(23,21,13,.25)'

function pathnameFromLiveUrl(url: string): string | null {
  try {
    return new URL(url).pathname.replace(/^\/+/, '')
  } catch {
    return null
  }
}

export default function WallReviewPage() {
  const [key, setKey] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [pending, setPending] = useState<PendingItem[]>([])
  const [live, setLive] = useState<string[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setKey(params.get('key'))
  }, [])

  const loadLive = useCallback(async () => {
    try {
      const res = await fetch('/api/wall')
      const data = await res.json()
      setLive(Array.isArray(data.photos) ? data.photos : [])
    } catch {
      setLive([])
    }
  }, [])

  const loadPending = useCallback(async (k: string) => {
    try {
      const res = await fetch(`/api/wall?admin=1&key=${encodeURIComponent(k)}`)
      if (res.status === 401) {
        setStatus('unauthorized')
        return
      }
      const data = await res.json()
      setPending(Array.isArray(data.pending) ? data.pending : [])
      setStatus('ok')
    } catch {
      setStatus('unauthorized')
    }
  }, [])

  useEffect(() => {
    if (!key) return
    loadPending(key)
    loadLive()
  }, [key, loadPending, loadLive])

  const act = useCallback(
    async (pathname: string, verdict: 'approve' | 'reject', fromLive: boolean) => {
      if (!key) return
      setBusy(pathname)
      try {
        const res = await fetch('/api/wall', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin: true, key, pathname, verdict }),
        })
        if (res.status === 401) {
          setStatus('unauthorized')
          return
        }
        if (!res.ok) return
        if (fromLive) {
          loadLive()
        } else {
          setPending((p) => p.filter((item) => item.pathname !== pathname))
          if (verdict === 'approve') loadLive()
        }
      } finally {
        setBusy(null)
      }
    },
    [key, loadLive]
  )

  const wrap: React.CSSProperties = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    background: CREAM,
    color: INK,
    minHeight: '100vh',
    padding: '24px',
  }

  if (!key) {
    return (
      <div style={wrap}>
        <p>NO KEY PROVIDED</p>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div style={wrap}>
        <p>LOADING…</p>
      </div>
    )
  }

  if (status === 'unauthorized') {
    return (
      <div style={wrap}>
        <p>BAD KEY</p>
      </div>
    )
  }

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 16, fontWeight: 'normal', marginBottom: 4 }}>WALL REVIEW</h1>
      <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 24 }}>
        {pending.length} pending · {live.length} live
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 13, marginBottom: 12, borderBottom: `1px solid ${LINE}`, paddingBottom: 4 }}>
          LIVE ({live.length}/3)
        </h2>
        {live.length === 0 ? (
          <p style={{ fontSize: 12, opacity: 0.6 }}>NO LIVE PHOTOS</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {live.map((url) => {
              const p = pathnameFromLiveUrl(url)
              return (
                <div key={url} style={{ border: `1px solid ${LINE}`, padding: 8 }}>
                  <img src={url} alt="" style={{ maxWidth: 240, display: 'block', marginBottom: 8 }} />
                  <button
                    type="button"
                    disabled={!p || busy === p}
                    onClick={() => p && act(p, 'reject', true)}
                    style={btnStyle}
                  >
                    {busy === p ? '…' : 'REMOVE'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 13, marginBottom: 12, borderBottom: `1px solid ${LINE}`, paddingBottom: 4 }}>
          PENDING
        </h2>
        {pending.length === 0 ? (
          <p style={{ fontSize: 12, opacity: 0.6 }}>NO PENDING SUBMISSIONS</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {pending.map((item) => (
              <div key={item.pathname} style={{ border: `1px solid ${LINE}`, padding: 8 }}>
                <img src={item.url} alt="" style={{ maxWidth: 240, display: 'block', marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    disabled={busy === item.pathname}
                    onClick={() => act(item.pathname, 'approve', false)}
                    style={btnStyle}
                  >
                    {busy === item.pathname ? '…' : 'APPROVE'}
                  </button>
                  <button
                    type="button"
                    disabled={busy === item.pathname}
                    onClick={() => act(item.pathname, 'reject', false)}
                    style={btnStyle}
                  >
                    {busy === item.pathname ? '…' : 'REJECT'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  background: CREAM,
  color: INK,
  border: `1px solid ${INK}`,
  padding: '4px 10px',
  cursor: 'pointer',
}
