import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Desktop } from '@/components/shell/Desktop'
import {
  ALL_PATHS,
  inspectForPath,
  isKnownPath,
  shelfModeForPath,
  windowsForPath,
} from '@/programs/resolve'
import { PROGRAMS } from '@/programs/registry'
import { BASE } from '@/lib/base'
import { getCase } from '@/programs/projects/cases'
import { getViz } from '@/programs/visualizers/vizRegistry'
import { t } from '@/content/copy'

type Props = { params: Promise<{ path: string[] }> }

export function generateStaticParams() {
  return ALL_PATHS.filter((p) => p.length > 0).map((path) => ({ path }))
}

/* `dynamicParams` stays at its default (true) ON PURPOSE. ALL_PATHS above
   prerenders the routes worth prerendering; every other path still has to
   reach this file so isKnownPath can tell a live deep link (/spec, /trash,
   /edit — none of them prerendered) from a typo, and so a typo gets a real
   404 rather than a static page. Setting it false would hand Next the
   verdict and 404 the live links too. */

/* One line per program, for the preview card under the title. Keyed by
   program id, so it survives a rename; a program with nothing here gets
   the honest generic below rather than an invented sentence. */
const BLURBS: Record<string, string> = {
  readme: 'Who Jake Lunde is and how he works, read off the README window in LUNDE OS.',
  cv: 'Jake Lunde’s resume, typeset live by the machine from the same data as the PDF.',
  projects: 'The index of Jake Lunde’s case studies, inside LUNDE OS.',
  progress: 'The shelf of boxed case studies in LUNDE OS. Pick one up and read it.',
  'spec-sheet':
    'The design system LUNDE OS runs on: tokens, type, colour and the two-accent rule.',
  music: 'The music drawer in LUNDE OS: the iPod, the listening charts and the beat machine.',
  fun: 'The toy drawer in LUNDE OS: photo booth, puzzles, tattoos and the visualizers.',
  feedback: 'What the people Jake Lunde worked with said, in their words.',
  guestbook: 'Sign the guestbook in LUNDE OS, and read who came through before you.',
  visualizers: 'Jake Lunde’s own data, drawn by the machine: rides, flights, slopes, listening.',
  studio: 'Jake Lunde’s remixes, on the iPod in LUNDE OS.',
  suggest: 'Suggest a program for LUNDE OS and watch the machine weigh it.',
  trash: 'What LUNDE OS threw out, and the note explaining why.',
  command: 'The deck where Jake Lunde briefs the crew of AI agents that helped build this site.',
}

/** A program's user-facing name comes from the copy layer, not the
    registry constant, so a title follows an EDIT.MODE rename. */
function programName(id: string, fallback: string) {
  return t(`program.${id}.name`, 'classic') || fallback
}

/* WHAT A ROUTE HAS TO SAY, AND WHAT IT INHERITS. Next fills og:title and
   og:description from a route's own `title`/`description` as long as the
   route does not declare `openGraph` itself — and the moment it does, the
   declaration REPLACES the root's rather than merging into it, image and
   site name included. So a plain program page states title, description
   and canonical and nothing else, and only the case studies, which carry
   their own cover, spell the whole card out (see layout.tsx). */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path } = await params

  if (path[0] === 'projects' && path[1]) {
    const c = getCase(path[1])
    if (c) {
      const title = c.name
      const description = `${c.name}: a case study by Jake Lunde, staff product designer and design engineer.`
      /* the case's own cover (cases.ts `box.og`). Absent → say nothing
         about images and the root desktop capture carries the card. */
      const images = c.box?.og && [
        { url: c.box.og.src, width: c.box.og.w, height: c.box.og.h, alt: `${c.name} box art` },
      ]
      if (!images) return { title, description, alternates: { canonical: `/projects/${c.slug}` } }
      return {
        title,
        description,
        alternates: { canonical: `/projects/${c.slug}` },
        /* re-stating siteName, locale and the card type is not belt and
           braces: the root's copies are gone the moment this object
           exists */
        openGraph: {
          type: 'article',
          siteName: 'LUNDE OS',
          locale: 'en_US',
          url: `/projects/${c.slug}`,
          title,
          description,
          images,
        },
        twitter: { card: 'summary_large_image', title, description, images },
      }
    }
  }

  if (path[0] === 'visualizers' && path[1]) {
    const slug = path[1] === 'flowers' ? 'models' : path[1]
    const v = getViz(slug)
    if (v) {
      return {
        title: `${v.name} · Visualizers`,
        description: `${v.name}: one of Jake Lunde’s own datasets, drawn by LUNDE OS.`,
        alternates: { canonical: `/visualizers/${v.id}` },
      }
    }
  }

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

  const p = PROGRAMS.find((x) => x.path === `/${path.join('/')}`)
  if (p) {
    const title = programName(p.id, p.name)
    return {
      title,
      description:
        BLURBS[p.id] ?? `${title}, a program inside LUNDE OS, the portfolio of Jake Lunde.`,
      alternates: { canonical: p.path },
    }
  }

  return {}
}

export default async function DeepLink({ params }: Props) {
  const { path } = await params
  /* An unregistered path used to land on the desk with README open under
     a 200 — every typo was a page. It is a 404 now (src/app/not-found),
     which still shows the desk, just with the status the URL deserves. */
  if (!isKnownPath(path)) notFound()
  return (
    <Desktop
      initialWindows={windowsForPath(path)}
      initialInspect={inspectForPath(path)}
      initialShelfMode={shelfModeForPath(path)}
    />
  )
}
