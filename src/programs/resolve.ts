import type { ComponentType } from 'react'
import { getProgram, PROGRAMS } from '@/programs/registry'
import { CASES, getCase } from '@/programs/projects/cases'
import { VIZ, getViz } from '@/programs/visualizers/vizRegistry'

export type ResolvedWindow = {
  id: string
  name: string
  meta: string
  chrome: 'paper' | 'crt' | 'bare'
  component: ComponentType | null
  size: { w: number; h: number }
  pos: { x: number; y: number }
  path: string | null
  /** copy key for the titlebar's "what is this" explainer (see registry) */
  explainer?: string
  /** requires macrodata refinement (the sphere) before the body shows */
  gated?: boolean
}

/* A window id is a program id, `case:<slug>`, or `viz:<id>`. */

export function resolveWindow(id: string): ResolvedWindow | null {
  if (id.startsWith('viz:')) {
    const v = getViz(id.slice(4))
    if (!v?.component) return null
    const i = VIZ.indexOf(v)
    return {
      id,
      name: v.name,
      meta: `VIZ-${v.no} · ${v.source.toUpperCase()}`,
      chrome: 'crt',
      component: v.component,
      size: v.size,
      pos: { x: 250 + i * 16, y: 48 + i * 14 },
      path: `/visualizers/${v.id}`,
    }
  }
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
      gated: true,
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
    explainer: p.explainer,
    gated: id === 'projects',
  }
}

/* Deep link → initial open windows (deterministic, SSR-safe). */

export function windowsForPath(path: string[]): string[] {
  /* The printer (cv) is FURNITURE: it sits on the desk under every desktop
     deep link, not only at the root — the URL is view-state over one desk,
     and the desk always has its machine. First in the list = lowest z.
     Mobile strips it back out (Desktop.tsx) unless /cv is the target. */
  const withFurniture = (ids: string[]) => (ids.includes('cv') ? ids : ['cv', ...ids])
  if (path.length === 0) return withFurniture(['readme']) // first-run window
  if (path[0] === 'readme') return withFurniture(['readme'])
  if (path[0] === 'projects') {
    if (path[1] && getCase(path[1])) return withFurniture(['projects', `case:${path[1]}`])
    return withFurniture(['projects'])
  }
  if (path[0] === 'visualizers') {
    const slug = path[1] === 'flowers' ? 'models' : path[1] // legacy alias
    if (slug && getViz(slug)?.component) return withFurniture(['visualizers', `viz:${slug}`])
    return withFurniture(['visualizers'])
  }
  const p = PROGRAMS.find((x) => x.path === `/${path.join('/')}`)
  return p ? withFurniture([p.id]) : withFurniture(['readme'])
}

export const ALL_PATHS: string[][] = [
  [],
  ['readme'],
  ['projects'],
  ['cases'],
  ['music'],
  ['fun'],
  ['feedback'],
  ['guestbook'],
  ['visualizers'],
  ...CASES.filter((c) => c.status === 'live').map((c) => ['projects', c.slug]),
  ...VIZ.filter((v) => v.status === 'live').map((v) => ['visualizers', v.id]),
]
