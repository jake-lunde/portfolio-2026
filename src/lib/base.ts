/* Base path for URL writes done outside Next's router (history.replaceState,
   fallback hrefs). Inlined at build; '' in dev and on Vercel. */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/* The canonical ORIGIN, which BASE above is not (that one is a path
   prefix and is empty in every environment that matters). Absolute URLs
   have exactly one job here: link previews and the crawler files, which
   have to name the host because they are read off-site: metadataBase in
   the root layout, plus robots.ts and sitemap.ts.

   The apex 308s to www.lunde.co (Vercel's primary domain is the www
   host), so absolute URLs name www: an og:image that redirects is the
   classic reason a LinkedIn or Slack unfurl comes back image-less, and
   a canonical should be the URL the server actually answers on. Jake
   still gives out the bare domain; the redirect carries people there. */
export const SITE = 'https://www.lunde.co'
