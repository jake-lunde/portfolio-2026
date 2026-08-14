import type { Metadata } from 'next'
import { Desktop } from '@/components/shell/Desktop'
import { ALL_PATHS, inspectForPath, windowsForPath } from '@/programs/resolve'
import { BASE } from '@/lib/base'
import { getCase } from '@/programs/projects/cases'

type Props = { params: Promise<{ path: string[] }> }

export function generateStaticParams() {
  return ALL_PATHS.filter((p) => p.length > 0).map((path) => ({ path }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path } = await params
  if (path[0] === 'projects' && path[1]) {
    const c = getCase(path[1])
    if (c) {
      return {
        title: c.name,
        description: `${c.name} — a case study by Jake Lunde, design engineer.`,
      }
    }
  }
  if (path[0] === 'projects') return { title: 'Projects' }
  if (path[0] === 'readme') return { title: 'README' }
  /* /inspect prerenders the same desktop /readme does — it only arms a
     tool over the top, which is client state a crawler never sees. Two
     URLs, one document: point the canonical at the real one. */
  if (path[0] === 'inspect') {
    return { title: 'INSPECT.MODE', alternates: { canonical: `${BASE}/readme` } }
  }
  /* /edit is the same desktop again, holding the copy editor instead of
     the picker. Nothing behind the password prompt is worth indexing. */
  if (path[0] === 'edit') {
    return {
      title: 'INSPECT.MODE',
      robots: { index: false, follow: false },
      alternates: { canonical: `${BASE}/readme` },
    }
  }
  return {}
}

export default async function DeepLink({ params }: Props) {
  const { path } = await params
  return (
    <Desktop initialWindows={windowsForPath(path)} initialInspect={inspectForPath(path)} />
  )
}
