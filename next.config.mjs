import createMDX from '@next/mdx'

/* Canonical host is Vercel (server build: API routes live here). The earlier
   GitHub Pages static-export mode was retired 2026-07-07 — export is
   incompatible with the guestbook API routes. */

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],

  /* COMMAND.CTR's feed is polled by a chip that lives on the desktop for as
     long as a tab is open, and every uncached read costs a billed Blob
     `list()`. The route itself can't advertise this: it reads a blob with
     `no-store`, which keeps the segment dynamic, and Next then stamps
     `max-age=0, must-revalidate` over anything the handler sets (confirmed
     against production, twice). Setting it here applies the header at the
     edge instead, so the CDN answers the polls and only ~3 reads a minute
     ever reach the function no matter how many people are watching. */
  async headers() {
    return [
      {
        source: '/api/cc-feed',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=20, stale-while-revalidate=60',
          },
        ],
      },
    ]
  },
}

const withMDX = createMDX({})

export default withMDX(nextConfig)
