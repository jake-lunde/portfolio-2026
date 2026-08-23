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
  /** a live control ahead of the meta slot — the case's own chrome
      (family-hub's fidelity switch; see cases.ts) */
  titleWidget?: ComponentType
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
      titleWidget: c.titleWidget,
      /* the reading-room width the case was designed at (the rail that
         once needed the right margin is retired — s94b); x hugs left so
         width + x fits a 1280 laptop exactly */
      size: { w: 1280, h: 720 },
      pos: { x: 24, y: 40 },
      path: `/projects/${c.slug}`,
      gated: true,
    }
  }
  const p = getProgram(id)
  /* A registry entry with no component is not a window and never resolves
     to one: WORK (`progress`) keeps an entry for its icon, its name and
     its deep link, and opens a mode of the desk instead (registry.tsx).
     Geometry and the doc-id are optional for exactly that reason, and
     this guard is what makes it safe — anything that gets past here has
     all four. */
  if (!p?.component || !p.size || !p.pos || !p.meta) return null
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
     /edit used to open the EDIT.MODE program, then INSPECT's third tool;
     it lands in plain INSPECT now (see inspectForPath). */
  if (path[0] === 'inspect' || path[0] === 'edit') return ['readme']
  /* /cases opens NO WINDOW: WORK is a mode of the desk now (SHELF.MODE,
     store/shelfMode.ts + shelfModeForPath below). The `progress` id keeps
     its registry entry, its copy keys and this path — the thing the path
     turns on simply isn't a frame any more. */
  if (path[0] === 'cases') return []
  if (path[0] === 'projects') {
    /* A case deep-link opens the case and nothing else. It used to open
       `progress` behind it, so the reader landed in the room the work
       lives in — but that room is the desk itself now, and the mode
       COVERS the desk: a case window under the plank is a window nobody
       can see. The two are mutually exclusive by construction (PLAY
       leaves the mode as the case arrives), and this keeps the deep link
       honest about it. WORK is one press away. */
    if (path[1] && getCase(path[1])) return [`case:${path[1]}`]
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

/** Does this path bring the shelf up on the desk? Separate from
    windowsForPath for the same reason inspectForPath is: SHELF.MODE is not
    a window, so a path that opens it has nothing to put in the window list
    (see store/shelfMode.ts). */
export function shelfModeForPath(path: string[]): boolean {
  return path[0] === 'cases'
}

/** Does this path arm INSPECT.MODE, and with which tool in the hand?
    Separate from windowsForPath because the mode is not a window — the
    path opens one AND turns the tool on. `null` means no tool.

    /edit lands where /inspect lands. It used to name a third tool; copy
    editing is an affordance on a pick now (components/inspect), so the old
    bookmark opens the tool and Jake picks the line he came for. It stays
    out of ALL_PATHS: the link is not advertised, and prerendering a page
    whose only purpose is Jake's desk would put it in the sitemap. */
export function inspectForPath(path: string[]): InspectTool | null {
  if (path[0] === 'inspect' || path[0] === 'edit') return 'select'
  return null
}

/** Does this path name something the machine can actually open?

    ALL_PATHS below is the PRERENDER + sitemap list and it is deliberately
    smaller than the set of live routes: /edit is left out on purpose, and
    most programs carry a deep link without earning a static page. So a
    path that opens a real window is not a 404 merely because nobody
    prerendered it, and the catch-all asks THIS rather than ALL_PATHS
    before it calls notFound(). Everything that answers `false` used to
    get the desk under a 200; it gets a real 404 now (src/app/not-found).

    Mirrors windowsForPath above: same fallbacks, same legacy alias. When
    a path stops opening a window, it stops being known here too. */
export function isKnownPath(path: string[]): boolean {
  if (path.length === 0) return true
  if (path[0] === 'inspect' || path[0] === 'edit') return path.length === 1
  if (path[0] === 'projects') {
    if (path.length === 1) return true
    return path.length === 2 && !!getCase(path[1])
  }
  if (path[0] === 'visualizers') {
    if (path.length === 1) return true
    const slug = path[1] === 'flowers' ? 'models' : path[1] // legacy alias
    return path.length === 2 && !!getViz(slug)?.component
  }
  return PROGRAMS.some((p) => p.path === `/${path.join('/')}`)
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
