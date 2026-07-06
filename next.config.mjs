import createMDX from '@next/mdx'

/* Static-export mode (GitHub Pages) is opt-in via env so local dev and a
   future Vercel deploy keep full defaults:
   NEXT_OUTPUT=export NEXT_PUBLIC_BASE_PATH=/portfolio-2026 npm run build */
const isExport = process.env.NEXT_OUTPUT === 'export'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  ...(isExport && {
    output: 'export',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    images: { unoptimized: true },
  }),
}

const withMDX = createMDX({})

export default withMDX(nextConfig)
