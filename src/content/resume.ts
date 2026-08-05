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

/* The one line that has to do the most work: positioning, tenure, and
   scope. Written for the 2026 double gate: an ATS parses it, then an LLM
   summarizes it for the recruiter, so it must survive being paraphrased.
   Copy is Jake's own pruning pass (2026-08-04 MD) — he cut the printer
   hook line; his voice, his call. */
export const SUMMARY =
  'Product designer who ships production code. Ten years in consumer products, currently leading design across Greenlight’s family finance ecosystem: investing for kids, AI-guided decision tools, and Family Hub, the company’s first hardware product, now live nationwide.'

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
      'Led end-to-end design of Family Hub, Greenlight’s first hardware product: a shared home display for family calendars, chores, lists, and location. Took it from vision to concept through interaction, visual, and motion design to nationwide launch in 2026 as the product’s primary designer.',
      'Redesigned Invest, Greenlight’s investing product for kids and families. Customers exposed to the new experience made a first trade at 3–4× the rate of those who weren’t, and detail views rose 355%, driven by AI-guided decision tools that explain what a company is before a kid buys it.',
      'Shipped production code, including the app’s first haptics. Built the design team’s design-to-code pipeline: components mirrored from Storybook into Figma, plus a self-built Figma plugin that captures design edits as diffs and hands them to Claude to open production pull requests, keeping the design system and shipped code in parity.',
    ],
  },
  {
    org: 'Disney Parks, Experiences and Products',
    title: 'Senior Product Designer',
    dates: 'Aug 2021 – Oct 2023',
    location: 'Los Angeles, CA (Remote)',
    bullets: [
      'Owned product design and creative strategy for the Disney Cruise Line Navigator app, the onboard companion guests use to plan every day of a sailing.',
      'Built and maintained the design system for Disney Cruise Line’s digital products, and drove the organization’s Sketch to Figma migration, including leading training sessions and design workshops for executives and partner teams.',
      'Ran the full research loop (session guides, testing, synthesis) and presented strategy and design up to VP level.',
    ],
  },
  {
    org: 'Blink UX',
    title: 'Senior User Experience Designer',
    dates: 'Oct 2018 – Aug 2021',
    location: 'Seattle, WA',
    bullets: [
      'Strategy and interaction design on 2–6 month engagements for Google, Amazon, Microsoft, Dell, eBay, Oculus, REI and more.',
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
      'Accessibility',
    ],
  },
  {
    label: 'Code Generation',
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

/* One line of personality, last thing on the page. Jake's own wording. */
export const COLOPHON =
  'Also: amateur musician, baker, and dance mom to a dog with more followers than most.'
