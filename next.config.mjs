import createMDX from '@next/mdx'

/* Canonical host is Vercel (server build: API routes live here). The earlier
   GitHub Pages static-export mode was retired 2026-07-07 — export is
   incompatible with the guestbook API routes. */

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],

}

/* ⚠️ CDN-caching /api/cc-feed: THREE approaches tried, none survives to
   production, don't burn a fourth session on it without new information.
   The handler's own `Cache-Control`, segment `revalidate`, and a
   next.config `headers()` entry all get replaced by
   `max-age=0, must-revalidate` on the deployed function — the route reads
   its blob with `no-store`, which pins the segment dynamic, and a dynamic
   function's own headers win at the edge. (The next.config header DID
   apply against a local `next start`, which is what made it look fixed.)
   The polling cost is handled where it is actually provable instead: a
   module-scope cache in the route (one Blob `list()` per 20s per warm
   instance) and clients that never poll a hidden tab. */

const withMDX = createMDX({})

export default withMDX(nextConfig)
