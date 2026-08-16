import type { Metadata } from 'next'
import { Desktop } from '@/components/shell/Desktop'
import { windowsForPath } from '@/programs/resolve'

/* Title, description and the whole link-preview card come from the root
   layout — the home page IS the default. Only the canonical is stated
   here, because the layout cannot state one without every deep link
   inheriting it (see the note in layout.tsx). */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function Home() {
  return <Desktop initialWindows={windowsForPath([])} />
}
