import type { Metadata } from 'next'
import { Desktop } from '@/components/shell/Desktop'
import { NotFoundNotice } from '@/components/shell/NotFoundNotice'
import { windowsForPath } from '@/programs/resolve'

/* THE 404, and it stays inside the machine. Next serves this for anything
   the catch-all calls notFound() on (src/app/[...path]/page.tsx), with a
   real 404 status behind it — the old behaviour rendered the desk under a
   200, so every typo was a page and the crawlers indexed them.

   What the visitor gets is the desk with README open, same as /readme, and
   one line in the corner saying which part went wrong. Nobody arrives at a
   dead end asking to be sent home; they are already home. */

export const metadata: Metadata = {
  title: 'NOT FOUND',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <>
      <Desktop initialWindows={windowsForPath(['readme'])} />
      <NotFoundNotice />
    </>
  )
}
