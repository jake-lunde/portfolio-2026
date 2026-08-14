'use client'

/* THE ARMING KEY — one shared secret, one storage slot, two modes.
 *
 * EDIT.MODE (copy) and INSPECT.MODE's token SAVE both authenticate against
 * the same EDIT_MODE_KEY, verified server-side and timing-safe by
 * /api/copy-commit/verify. Arming once should therefore cover both, which
 * only works if they agree on where the key is parked — hence this module
 * rather than a string duplicated in two components.
 *
 * The key lives in sessionStorage: it dies with the tab, is never rendered,
 * never logged, and never leaves the machine except as the x-edit-key header
 * on a request to this site's own API. */

const KEY_STORE = 'lunde-edit-key'

export function readEditKey(): string {
  try {
    return sessionStorage.getItem(KEY_STORE) ?? ''
  } catch {
    return ''
  }
}

export function writeEditKey(key: string): void {
  try {
    sessionStorage.setItem(KEY_STORE, key)
  } catch {
    /* private mode, quota, no storage — the caller re-prompts next time */
  }
}

export function clearEditKey(): void {
  try {
    sessionStorage.removeItem(KEY_STORE)
  } catch {}
}

/** Trade a typed key for an armed session. `true` on accept, `'badkey'` on
    a rejected key, `'throttled'` when the verify endpoint has rate-limited
    this IP, `'unconfigured'` when the deployment has no key at all. */
export async function verifyEditKey(
  entered: string,
): Promise<true | 'badkey' | 'throttled' | 'unconfigured'> {
  const res = await fetch('/api/copy-commit/verify', {
    method: 'POST',
    headers: { 'x-edit-key': entered },
  })
  if (res.status === 501) return 'unconfigured'
  if (res.status === 429) return 'throttled'
  if (!res.ok) return 'badkey'
  writeEditKey(entered)
  return true
}
