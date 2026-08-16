import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/base'
import { ALL_PATHS } from '@/programs/resolve'
import { CASES } from '@/programs/projects/cases'

/* Every URL worth a crawl, off the same list that prerenders them.

   ALL_PATHS is the source because a path that earns a static page is a
   path that earns an index entry — the two lists are the same judgment
   made once. /inspect comes out: it renders the same document /readme
   does and already points its canonical there, so listing it would ask a
   crawler to fetch a duplicate. /edit was never in ALL_PATHS.

   Cases in `soon` stay out too. They resolve (the shelf boxes them, the
   deep link opens) but the window has no case study behind it yet, and an
   outline is not a page to send anyone to. Union with the live list below
   anyway, so a case that becomes live is in the sitemap the same commit
   it ships, whatever ALL_PATHS is doing that day.

   `lastModified` is build time. Nothing here carries a real edit date,
   and a deploy IS when this content last changed, so the honest answer
   and the available one are the same answer. */
export default function sitemap(): MetadataRoute.Sitemap {
  const built = new Date()

  const paths = ALL_PATHS.filter((p) => p[0] !== 'inspect' && p[0] !== 'edit').map((p) =>
    p.join('/'),
  )
  for (const c of CASES) {
    if (c.status !== 'live') continue
    const p = `projects/${c.slug}`
    if (!paths.includes(p)) paths.push(p)
  }

  return paths.map((p) => ({
    url: p ? `${SITE}/${p}` : `${SITE}`,
    lastModified: built,
  }))
}
