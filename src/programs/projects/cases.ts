import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

/* The four box-art LAYOUTS on the shelf, named for the composition rather
   than for the case that happens to wear it — so a fifth case can pick one
   up without renaming anything. Rendered by src/programs/shelf.

   Passes 4–5 varied only the LETTERING over one composition (a feathered
   picture in the upper two thirds, type on the bottom-left), and Jake's
   verdict on that set was that it hadn't worked: "they still feel kind of
   the same because they're using the same soft blur… I want a more rigid,
   structured format for where the art content will go." So each of the three
   that are not his own comp now borrows a real box off his reference board,
   and what they borrow is the STRUCTURE. */
export type CoverVariant =
  /** THE SOFT COMP — Jake's Figma, and reference 1 on his own board: an
      organic feathered picture, an airbrushed wash over it, small
      sentence-case eyebrow, big title, italic tagline signed off to the
      right. The reference; family-hub keeps it, and nothing may drift. */
  | 'figma'
  /** THE CARTRIDGE (Atari 2600 / E.T., 1982): brand zone across the top, a
      band of printed rainbow rules, then the art hard-edged and full width,
      hanging off the bottom edge. No feather, no wash — the plate's own
      frame is the design. */
  | 'stripe'
  /** THE APPLICATION (Adobe Photoshop 5.5, 1999): light ground, brand block
      hard into the top-left, a centred SQUARE art plate with a printed edge,
      and a solid category bar at the foot. */
  | 'catalog'
  /** THE GAME (Starflight, Electronic Arts): black ground, display title in
      spaced caps across the top, the art in a framed vertical window, and
      the publisher signed at the foot. */
  | 'nocturne'

export type CaseDef = {
  slug: string
  no: string
  name: string
  org: string
  year: string
  status: 'live' | 'soon'
  component?: ComponentType
  /** The MDX file in `content/` this case's prose is written in, if it has
      been written. Case prose is NOT copy.json: clicking a paragraph with
      INSPECT's EDIT tool will never reach it, so the tool reads this and
      points at the file on GitHub instead (components/inspect/EditPanel).
      Filename only — the folder is fixed. */
  source?: string
  /** build state, read by the shelf's in-development boxes (WIP-15) */
  progress?: { pct: number; phase: string }
  /** SHIPPED.SW — the case as boxed retail software on the shelf
      (src/programs/shelf). Every field is optional so registering a new
      case stays one CASES entry: no `box` at all still yields a box, just
      a bare one. */
  box?: {
    /** KEY ART — the picture printed in this cover's plate. Convention:
        /case/<slug>/box-art.webp.

        The intrinsic size travels WITH the source and is not optional,
        which is the whole reason this is an object rather than a string:
        the plate is fixed geometry, so `width`/`height` cost nothing to
        layout, but they are what stop the decoder guessing and what keeps
        the front honest if the plate ever stops being absolute. Take them
        from the file, never from the design.

        Absent — or a src that fails to load (ShelfBox's `onError`) — → the
        front composes itself from tokens with the shelf's index number in
        the plate. Pass 8 makes that a FALLBACK and nothing else: every
        shipped cover has art, and a number waiting for a film to fade in
        was the state Jake struck ("the placeholder is just a number").

        On a box that also has a `video` the art is its POSTER (pass 10 —
        the self-hosted films retired pass 9's loader): on screen for the
        beat before the first frame, permanently under reduced motion
        (no film mounts there) and on any playback failure. */
    art?: { src: string; w: number; h: number }
    /** the box-art template's publisher mark, printed small at the top-left
        the way a 1992 sleeve carried its house logo. Convention:
        /case/<slug>/mark.svg for a case that has its own; the house mark
        (/mark.png) for one printed under Jake's own imprint, which is what
        the Figma comp shows. Absent → nothing is drawn; a placeholder box
        where a logo goes is worse than no logo. */
    mark?: string
    /** the line under the title on the front of the box — what the software
        promises, in six words. Jake's own from the Figma template. */
    tagline?: string
    /** WHICH BOX-ART LAYOUT THIS COVER GETS.

        A shelf of real 1992 software is not a product family — it is four
        publishers who never spoke to each other, and the covers have to
        disagree the way those did: where the picture sits, what contains it,
        what the ground is, and only then the lettering. What does NOT move
        is the face (Instrument Sans on every classic cover) or the colour
        (tokens, always — a cover may choose the INVERSE ground, never a
        colour of its own), which is what keeps a set of arguments looking
        like one shelf.

        Absent → `figma`, the composition Jake drew. */
    coverVariant?: CoverVariant
    /** cover motion: a self-hosted file under public/ (pass 10 — Jake
        supplied the films, retiring the YouTube embed and its whole
        chrome-hiding apparatus), played silent, looping and pointer-inert
        behind the front face's treatment — the 1992 box with a moving
        cover it was never able to have. The art below is its poster; the
        whole thing is skipped under reduced motion. */
    video?: string
    /** THE BACK PANEL'S SYSTEM REQUIREMENTS — exactly three rows.

        Not a list that happens to be short: a ledger, and the ledger is
        three lines because a box back has room for three lines of data at
        a size worth reading. The one-line rule is enforced BY CONSTRUCTION
        (`white-space: nowrap` in shelf.module.css) rather than by
        truncation, which means the discipline lives HERE: a label is one
        or two words, a value is a figure and the shortest phrase that
        makes it mean something. If a value overflows, the copy is wrong —
        do not shrink the type to rescue it, and never add a fourth row. */
    requirements?: { label: string; value: string }[]
    /** a quote from the work, printed as the review blurb */
    blurb?: { quote: string; source: string }
    /** the case's own thesis line, in Jake's words */
    thesis?: string
  }
}

/* Case studies — window id is `case:<slug>`, deep link is /projects/<slug>. */

export const CASES: CaseDef[] = [
  {
    slug: 'greenlight-invest',
    no: '01',
    name: 'Greenlight Invest',
    org: 'Greenlight',
    year: '2024–25',
    status: 'live',
    component: dynamic(() => import('@/programs/projects/CaseInvest')),
    source: 'greenlight-invest.mdx',
    progress: { pct: 100, phase: 'Shipped. Read it' },
    box: {
      /* the three phones on mint — Jake's own product shot. 2.10:1 into a
         16:9 plate, so it gives up a sliver either side and keeps the
         phones dead centre. PASS 10: the film's poster — the beat before
         its first frame, the reduced-motion cover, and the face any
         playback failure rests on. */
      art: { src: '/case/greenlight-invest/box-art.webp', w: 1200, h: 571 },
      video: '/case/greenlight-invest/box-film.mp4',
      coverVariant: 'stripe',
      tagline: 'know why, not just what.',
      thesis:
        'Regardless of the layout or data, kids told us they didn’t understand, so we got on their level.',
      requirements: [
        { label: 'Role', value: 'Lead product designer' },
        { label: 'Trades', value: '3–4× vs. unexposed' },
        { label: 'Detail views', value: '+355%' },
      ],
      blurb: { quote: 'It encouraged conversation.', source: 'Parent, user research' },
    },
  },
  {
    slug: 'family-hub',
    no: '02',
    name: 'Family Hub',
    org: 'Greenlight',
    year: '2025–26',
    status: 'live',
    component: dynamic(() => import('@/programs/projects/CaseFamilyHub')),
    source: 'family-hub.mdx',
    progress: { pct: 100, phase: 'Shipped. Read it' },
    box: {
      /* the hub dashboard, seated under the blob mask and the airbrush —
         the same treatment the film gets, which is what makes the two
         crossfade as one picture rather than as two layers. PASS 10: the
         film's poster, as on Invest — the beat before the first frame, the
         reduced-motion cover, and the face any failure rests on. */
      art: { src: '/case/family-hub/box-art.webp', w: 1200, h: 727 },
      /* the launch film, the same cut plate 11 runs in the case study */
      video: '/case/family-hub/box-film.mp4',
      /* the reference cover — this is the one Jake drew, so it wears the
         treatment he drew it in */
      coverVariant: 'figma',
      /* THE HOUSE MARK, top-left, exactly as the comp has it. The slot has
         existed since pass 4 and has never had an asset in it; pass 11
         points the one cover Jake actually drew at the one mark he actually
         has (public/mark.png — the same face the shell uses). It is the
         publisher's colophon on a box he published, and it is deliberately
         NOT on the other three: those are three other houses. */
      mark: '/mark.png',
      /* Jake's own line, straight off the Figma box-art template */
      tagline: 'life organized effortlessly.',
      thesis:
        'The all-in-one family organizer, on Greenlight’s first device. I was its first skeptic. I ended up being its design team.',
      requirements: [
        { label: 'Design : eng', value: '1 : 10' },
        { label: 'Nationwide', value: '7 months from zero' },
        { label: 'Concept appeal', value: '80%, before price' },
      ],
      /* The verbatim, elided rather than rewritten: the words are the
         parent's and in her order, the ellipsis marks where "and a shared
         Google calendar" came out. Full length it ran four lines on the
         medieval panel — where --sans is a display face — and pushed the
         back into scrolling. A box-back blurb is a trimmed quote by genre;
         it is not allowed to be a paraphrase. */
      blurb: {
        quote: 'A whiteboard chore chart for the kids, group texts… would love one tool instead.',
        source: 'Parent, exploration survey (n = 1,200)',
      },
    },
  },
  {
    slug: 'tooling',
    no: '03',
    name: 'Tooling',
    org: 'Personal leverage',
    year: '2024–26',
    status: 'soon',
    progress: { pct: 30, phase: 'Artifacts gathered · hunting the through-line' },
    /* no film and no promises yet — but the picture is real, and a square
       original in a square plate is the one cover that crops by nothing */
    box: {
      art: { src: '/case/tooling/box-art.webp', w: 960, h: 960 },
      coverVariant: 'catalog',
    },
  },
  {
    slug: 'interview-pipeline',
    no: '04',
    name: 'Interview Pipeline',
    org: 'This site',
    year: '2026',
    status: 'soon',
    progress: { pct: 15, phase: 'Outline only. The one about this site' },
    /* the caterpillar, printed in the framed window the way a game box
       carried its one illustration */
    box: {
      art: { src: '/case/interview-pipeline/box-art.webp', w: 1024, h: 1024 },
      coverVariant: 'nocturne',
    },
  },
]

export function getCase(slug: string): CaseDef | undefined {
  return CASES.find((c) => c.slug === slug)
}
