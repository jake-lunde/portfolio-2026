import createMDX from '@next/mdx'

/* Canonical host is Vercel (server build: API routes live here). The earlier
   GitHub Pages static-export mode was retired 2026-07-07 — export is
   incompatible with the guestbook API routes. */

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
}

const withMDX = createMDX({})

export default withMDX(nextConfig)
