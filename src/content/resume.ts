/* RESUME — the single source of truth for CV.EXE.

   The window's on-screen printout AND the build-time PDF
   (scripts/build-cv.mjs → public/jake-lunde-resume.pdf) both render from
   this file, so the two can never drift.

   Facts sourced from Jake's LinkedIn export + the 2023 resume, cross-checked
   against portfolio-tracker.md per CLAUDE.md §2.

   ⚠️ Deliberately NOT routed through the copy layer. Employer names, titles
   and dates must never pass through SKIN_VOICE — knight-speak translating
   "Disney" would be funny exactly once and wrong forever. Keep these keys
   out of copy.json on principle.

   ⚠️ Metrics discipline: relative deltas on Jake's own work only (3–4×,
   355%). Absolute business volumes from the R25 review — upgrade counts,
   funnel share, view totals — stay off a document that gets forwarded
   outside the company. See the session-30 note in HANDOFF.md. */

export type Role = {
  org: string
  title: string
  /** Shows trajectory without costing a second ATS block. */
  priorTitle?: string
  dates: string
  location: string
  bullets: string[]
}

export type SkillGroup = {
  label: string
  items: string[]
}

export type Education = {
  school: string
  degree: string
  year: string
}

export const CONTACT = {
  name: 'Jake Lunde',
  /* No phone, no LinkedIn — Jake's call. Email + site is the whole surface. */
  email: 'jakelunde@me.com',
  site: 'lunde.co',
  location: 'Seattle, WA',
} as const

/* The one line that has to do the most work: positioning, tenure, and proof
   the design-engineer claim isn't aspirational — the reader is holding the
   artifact it describes. Written for the 2026 double gate: an ATS parses it,
   then an LLM summarizes it for the recruiter, so it must survive being
   paraphrased. */
export const SUMMARY =
  'Product designer who ships production code. Ten years in consumer products, currently leading design across Greenlight’s family finance ecosystem: investing for kids, AI-guided decision tools, and Family Hub, the company’s first hardware product, now live nationwide. This PDF came off a dot-matrix printer I built at lunde.co.'

export const ROLES: Role[] = [
  {
    org: 'Greenlight',
    title: 'Staff Product Designer',
    priorTitle: 'Design Lead',
    dates: 'Oct 2023 – Present',
    location: 'Seattle, WA',
    /* The 2026 screening gate is an LLM summarizing this block for a
       recruiter, so each bullet is one narratable claim: scope first, then
       outcome. Arc: hardware 0→1, product redesign with numbers, production
       code, AI infrastructure. Confidential internals (survey n, user
       counts, funnel volumes) stay off a forwardable document. */
    bullets: [
      'Led end-to-end design of Family Hub, Greenlight’s first hardware product: a shared home display for family calendars, chores, lists, and location. Took it from vision-team concept through interaction, visual, motion, and sound design to nationwide launch in 2026 as the product’s sole designer.',
      'Redesigned Invest, Greenlight’s investing product for kids and families. Customers exposed to the new experience made a first trade at 3–4× the rate of those who weren’t, and detail views rose 355%, driven by AI-guided decision tools that explain what a company is before a kid buys it.',
      'Shipped production SwiftUI, including the app’s first haptics: a press-and-hold performance graph engineering had scoped as too expensive, which I prototyped in the production repo. Most of that code shipped.',
      'Built the design team’s design-to-code pipeline: components mirrored from Storybook into Figma, plus a self-built Figma plugin that captures design edits as diffs and hands them to Claude to open production pull requests, keeping the design system and shipped code in parity.',
    ],
  },
  {
    org: 'Disney Parks, Experiences and Products',
    title: 'Senior Product Designer',
    dates: 'Aug 2021 – Oct 2023',
    location: 'Los Angeles, CA (Remote)',
    bullets: [
      'Owned product design and creative strategy for the Disney Cruise Line Navigator app, the onboard companion guests use to plan every day of a sailing.',
      'Built and maintained the design system for Disney Cruise Line’s digital products, and drove the organization’s Sketch to Figma migration, including running training sessions for executives and partner teams.',
      'Ran the full research loop (session guides, testing, synthesis) and presented strategy and new solutions up to VP level.',
    ],
  },
  {
    org: 'Blink UX',
    title: 'Senior User Experience Designer',
    dates: 'Oct 2018 – Aug 2021',
    location: 'Seattle, WA',
    bullets: [
      'Strategy and interaction design on 2–6 month engagements for Google, Amazon, Microsoft, Dell, eBay, Oculus, and REI.',
      'Specialized in complex enterprise problems across platforms and devices: stakeholder alignment, research synthesis into process and experience maps, prototypes for usability testing, and full design-system documentation.',
    ],
  },
]

export const SKILLS: SkillGroup[] = [
  {
    label: 'Design',
    items: [
      'Product design',
      'Design systems',
      'Interaction design',
      'Prototyping',
      'Design research',
      'Accessibility (WCAG 2.2 AA)',
    ],
  },
  {
    label: 'Code',
    items: ['TypeScript', 'React', 'Next.js', 'CSS', 'SwiftUI'],
  },
  {
    label: 'Tools',
    items: ['Figma', 'Claude Code', 'Cursor', 'Storybook', 'Motion'],
  },
]

export const EDUCATION: Education[] = [
  {
    school: 'Central Washington University',
    degree: 'Bachelor of Fine Arts, Graphic Design',
    year: '2014',
  },
]

/* The old resume carried a joke list (punctuality, bike riding, dog social
   media management, moral support, coffee brewing). At staff level a list
   like that reads as filler — but deleting the personality entirely would
   cost more than it saves. Distilled to one line, last thing on the page. */
export const COLOPHON =
  'Also: competent bike mechanic, better baker, and staff to a dog with a larger following than mine.'
