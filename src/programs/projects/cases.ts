import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

/* The four box-art treatments on the shelf, named for what the type does
   rather than for the case that happens to wear it — so a fifth case can
   pick one up without renaming anything. Rendered by src/programs/shelf. */
export type CoverVariant =
  /** Jake's Figma: small sentence-case eyebrow, big title, italic tagline
      signed off to the right. The reference — family-hub keeps it. */
  | 'figma'
  /** the finance-software look: tracked-out uppercase eyebrow, heavy title
      set tight and hard left, tagline squared up under it. */
  | 'ledger'
  /** the utility look: everything centred, title in spaced caps, no
      promises — the box that expects you to already know what it is. */
  | 'plate'
  /** the imported look: the whole block ranged right, title in italic, a
      hairline eyebrow above it. */
  | 'ranged'

export type CaseDef = {
  slug: string
  no: string
  name: string
  org: string
  year: string
  status: 'live' | 'soon'
  component?: ComponentType
  /** build state, read by the shelf's in-development boxes (WIP-15) */
  progress?: { pct: number; phase: string }
  /** SHIPPED.SW — the case as boxed retail software on the shelf
      (src/programs/shelf). Every field is optional so registering a new
      case stays one CASES entry: no `box` at all still yields a box, just
      a bare one. */
  box?: {
    /** key art. Convention: /case/<slug>/box.webp. Absent → the front face
        composes itself from tokens (the big number as the art plate). */
    art?: string
    /** the box-art template's publisher mark, printed small at the top-left
        the way a 1992 sleeve carried its house logo. Convention:
        /case/<slug>/mark.svg. Absent → nothing is drawn; a placeholder box
        where a logo goes is worse than no logo. */
    mark?: string
    /** the line under the title on the front of the box — what the software
        promises, in six words. Jake's own from the Figma template. */
    tagline?: string
    /** WHICH TYPE TREATMENT THIS COVER GETS.

        A shelf of real 1992 software is not a product family — it is four
        publishers who never spoke to each other, and the covers have to
        disagree the way those did: weight, size, alignment, case and italic
        all move. What does NOT move is the face (Instrument Sans on every
        classic cover) or the colour (tokens, always), which is what keeps a
        set of arguments looking like one shelf.

        Absent → `figma`, the treatment Jake drew. */
    coverVariant?: CoverVariant
    /** cover motion: a YouTube id, played silent and chromeless behind the
        front face's treatment — the 1992 box with a moving cover it was
        never able to have. Decorative and pointer-inert; the composed front
        stays underneath as the poster frame (and the whole thing is skipped
        under reduced motion). */
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
    progress: { pct: 100, phase: 'Shipped — read it' },
    /* no art file yet — the composed front carries this one, with the
       product film rolling silently over it */
    box: {
      video: 'Nxl0uCGZNCw',
      coverVariant: 'ledger',
      tagline: 'know why, not just what.',
      thesis:
        'A kid told me the numbers meant nothing. So I built the understanding — in code.',
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
    progress: { pct: 100, phase: 'Shipped — read it' },
    box: {
      /* the launch film, the same cut plate 11 runs in the case study */
      video: 'G-tWcCCMdGE',
      /* the reference cover — this is the one Jake drew, so it wears the
         treatment he drew it in */
      coverVariant: 'figma',
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
    /* no art, no film, no promises yet — but it still gets a printer */
    box: { coverVariant: 'plate' },
  },
  {
    slug: 'interview-pipeline',
    no: '04',
    name: 'Interview Pipeline',
    org: 'This site',
    year: '2026',
    status: 'soon',
    progress: { pct: 15, phase: 'Outline only — the self-referential one' },
    box: { coverVariant: 'ranged' },
  },
]

export function getCase(slug: string): CaseDef | undefined {
  return CASES.find((c) => c.slug === slug)
}
