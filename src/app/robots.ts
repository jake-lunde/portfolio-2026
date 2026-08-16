import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/base'

/* What a crawler is welcome to. Everything on the desk is public and
   wants indexing; the four disallows are the back rooms:
   /api/ has no documents in it, /dev/ is the icon proof sheet, /edit is
   Jake's copy editor behind a password, /wall-review and /musickit-setup
   are one-off operator pages. INSPECT.MODE is left OUT of this list on
   purpose: /inspect renders the same document /readme does, so it carries
   a canonical instead (src/app/[...path]/page.tsx) and a disallow would
   only stop the crawler reading that. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dev/', '/edit', '/wall-review', '/musickit-setup'],
    },
    sitemap: `${SITE}/sitemap.xml`,
  }
}
