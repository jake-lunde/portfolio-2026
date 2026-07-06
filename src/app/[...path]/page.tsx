import type { Metadata } from 'next'
import { Desktop } from '@/components/shell/Desktop'
import { ALL_PATHS, windowsForPath } from '@/programs/resolve'
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
  return {}
}

export default async function DeepLink({ params }: Props) {
  const { path } = await params
  return <Desktop initialWindows={windowsForPath(path)} />
}
