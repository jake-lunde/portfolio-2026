import { Suspense } from 'react'
import type { Metadata } from 'next'
import { StylerLibrary } from '@/components/inspect/StylerLibrary'

/* /styler — the component library, and STYLER's front door.
 *
 * A real route rather than an entry in the catch-all's table (lib/resolve
 * .ts), because this is not a program window: the shelf and the stage both
 * take the whole viewport and neither wants a desktop, a boot sequence or a
 * menubar underneath them. A file at this path wins over [...path] anyway,
 * so nothing in the router's own list has to know about it.
 *
 * NOINDEX. A tool page for whoever is styling the system, not a page a
 * search result should land somebody on with no way back to the desktop.
 *
 * The Suspense boundary is `useSearchParams`' price: a client component
 * reading the query string bails the whole route out to client rendering
 * unless it is inside one. The fallback is nothing on purpose — the shelf
 * waits for the client anyway (StylerLibrary.tsx says why), so a skeleton
 * here would be a flash of furniture that is about to be replaced by the
 * same furniture.
 */

export const metadata: Metadata = {
  title: 'STYLER',
  description: 'Every component in LUNDE OS that takes tokens, on one shelf.',
  robots: { index: false, follow: false },
}

export default function StylerPage() {
  return (
    <Suspense fallback={null}>
      <StylerLibrary />
    </Suspense>
  )
}
