/* Base path for URL writes done outside Next's router (history.replaceState,
   fallback hrefs). Inlined at build; '' in dev and on Vercel. */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/* The canonical ORIGIN, which BASE above is not (that one is a path
   prefix and is empty in every environment that matters). Absolute URLs
   have exactly one job here: link previews and the crawler files, which
   have to name the host because they are read off-site: metadataBase in
   the root layout, plus robots.ts and sitemap.ts.

   ⚠️ The apex 308s to www.lunde.co, so every absolute URL written from
   here takes one redirect on the way. Scrapers follow it and the bare
   domain is the one Jake gives out, which is why it stays. If a preview
   ever comes back image-less, flipping this one string to the www host is
   the first thing to try. */
export const SITE = 'https://lunde.co'
