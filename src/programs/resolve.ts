import type { ComponentType } from 'react'
import { getProgram, PROGRAMS } from '@/programs/registry'
import type { ProgramDef } from '@/programs/registry'
import { CASES, getCase } from '@/programs/projects/cases'
import { VIZ, getViz } from '@/programs/visualizers/vizRegistry'
import type { InspectTool } from '@/store/inspect'

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
  /** titlebar action link — wins over both the doc-id and the explainer
      in the meta slot (see registry) */
  titleAction?: ProgramDef['titleAction']
  /** requires macrodata refinement (the sphere) before the body shows */
  gated?: boolean
  /** keeps full opacity when unfocused — the program owns a 3D context and
      the recede is a `filter`, which flattens one (see registry.tsx) */
  noRecede?: true
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
      /* wide enough that the evolution rail (360px + berth) sits clear
         of the column; clamps to the desktop on smaller screens, where
         the rail overlaps the plates instead (Jake-approved) */
      size: { w: 1280, h: 720 },
      /* x hugs left so width + x fits a 1280 laptop exactly — the rail
         lives on the window's right edge and must never hang offscreen */
      pos: { x: 24, y: 40 },
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
    titleAction: p.titleAction,
    noRecede: p.noRecede,
    gated: id === 'projects',
  }
}

/* Deep link → initial open windows (deterministic, SSR-safe). */

/* What the desk is set with on a cold load: the Family Hub player running
   behind README (order is z-order — last id boots focused). Desktop.tsx
   compares against this to keep mobile landing on the launcher instead. */
export const BOOT_WINDOWS = ['hub-player', 'readme']

export function windowsForPath(path: string[]): string[] {
  if (path.length === 0) return BOOT_WINDOWS // first-run desk
  if (path[0] === 'readme') return ['readme']
  /* /inspect and /edit are the two paths with no window behind them:
     INSPECT.MODE is a tool mode, not a program, so the link puts something
     ON the canvas and arms the tool over it (see inspectForPath + Desktop).
     /edit used to open the EDIT.MODE program; the editor is INSPECT's
     third tool now, so the old link lands in the same mode holding it. */
  if (path[0] === 'inspect' || path[0] === 'edit') return ['readme']
  if (path[0] === 'projects') {
    // a case deep-link opens the SHELF behind the case window — that is the
    // room this work lives in now. The flat `projects` index stays
    // registered for the bare /projects path only.
    if (path[1] && getCase(path[1])) return ['progress', `case:${path[1]}`]
    return ['projects']
  }
  if (path[0] === 'visualizers') {
    const slug = path[1] === 'flowers' ? 'models' : path[1] // legacy alias
    if (slug && getViz(slug)?.component) return ['visualizers', `viz:${slug}`]
    return ['visualizers']
  }
  const p = PROGRAMS.find((x) => x.path === `/${path.join('/')}`)
  return p ? [p.id] : ['readme']
}

/** Does this path arm INSPECT.MODE, and with which tool in the hand?
    Separate from windowsForPath because the mode is not a window — the
    path opens one AND turns the tool on. `null` means no tool.

    /edit answers EDIT rather than SELECT. It is not in ALL_PATHS and
    stays out of it: the editor is Jake's, the link is not advertised, and
    prerendering a page whose only purpose is a password prompt would put
    it in the sitemap. */
export function inspectForPath(path: string[]): InspectTool | null {
  if (path[0] === 'inspect') return 'select'
  if (path[0] === 'edit') return 'edit'
  return null
}

export const ALL_PATHS: string[][] = [
  [],
  ['readme'],
  ['inspect'],
  ['projects'],
  ['cases'],
  ['music'],
  ['fun'],
  ['feedback'],
  ['guestbook'],
  ['visualizers'],
  ['resume'],
  ...CASES.filter((c) => c.status === 'live').map((c) => ['projects', c.slug]),
  ...VIZ.filter((v) => v.status === 'live').map((v) => ['visualizers', v.id]),
]
