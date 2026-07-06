import type { ComponentType } from 'react'
import { getProgram, PROGRAMS } from '@/programs/registry'
import { CASES, getCase } from '@/programs/projects/cases'

export type ResolvedWindow = {
  id: string
  name: string
  meta: string
  chrome: 'paper' | 'crt'
  component: ComponentType | null
  size: { w: number; h: number }
  pos: { x: number; y: number }
  path: string | null
}

/* A window id is either a program id, or `case:<slug>`. */

export function resolveWindow(id: string): ResolvedWindow | null {
  if (id.startsWith('case:')) {
    const c = getCase(id.slice(5))
    if (!c) return null
    return {
      id,
      name: c.name,
      meta: `${c.no} / SPEC`,
      chrome: 'paper',
      component: c.component ?? null,
      size: { w: 860, h: 640 },
      pos: { x: 170, y: 40 },
      path: `/projects/${c.slug}`,
    }
  }
  const p = getProgram(id)
  if (!p) return null
  return {
    id,
    name: p.name,
    meta: p.meta,
    chrome: p.chrome ?? 'paper',
    component: p.component,
    size: p.size,
    pos: p.pos,
    path: p.path ?? null,
  }
}

/* Deep link → initial open windows (deterministic, SSR-safe). */

export function windowsForPath(path: string[]): string[] {
  if (path.length === 0) return ['readme'] // first-run window
  if (path[0] === 'readme') return ['readme']
  if (path[0] === 'projects') {
    if (path[1] && getCase(path[1])) return ['projects', `case:${path[1]}`]
    return ['projects']
  }
  const p = PROGRAMS.find((x) => x.path === `/${path.join('/')}`)
  return p ? [p.id] : ['readme']
}

export const ALL_PATHS: string[][] = [
  [],
  ['readme'],
  ['projects'],
  ...CASES.filter((c) => c.status === 'live').map((c) => ['projects', c.slug]),
]
