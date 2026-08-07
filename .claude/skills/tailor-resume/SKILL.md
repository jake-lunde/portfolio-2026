---
name: tailor-resume
description: Tailor Jake's resume to a specific job description and write a fit brief mapping the JD's requirements to his real evidence. Use when asked to "tailor my resume", "target this role/JD/posting", when a job-posting URL is shared in the context of applying, or to re-render an existing application variant after edits. Outputs land in ref/applications/<slug>/ and are never committed.
---

# TAILOR RESUME

Take a job description, map it against Jake's real evidence, and produce two
private artifacts: a **fit brief** (requirement → receipt, blunt about gaps)
and a **tailored one-page resume PDF** rendered through the same ATS pipeline
as the canonical resume.

## The law (do not violate)

- **Nothing is invented.** Every claim on the variant and in the brief traces
  to a line in the evidence corpus below. If evidence doesn't exist, the brief
  says so — that IS the product.
- **Metrics discipline** (same as `src/content/resume.ts` header): relative
  deltas on Jake's own work only (3–4×, 355%). Absolute internal volumes
  (upgrade counts, funnel share, unit sales vs targets) never appear —
  grep your output for `15.3k`, `59.07`, `16.8k`, `132`, `50,000`/`50k units`
  before handing off.
- **Honor every ⚠️ in `portfolio-tracker.md`**: interview-only phrasing stays
  out; colleagues unnamed unless the tracker marks them shareable; research
  quotes anonymized.
- **Jake's voice**: spoken cadence, no em dashes, no resume-speak inflation
  ("spearheaded synergies"). He is a precise director; claims are concrete
  and slightly understated.
- **Titles come from canonical `resume.ts` only.** Jake's ruling
  (2026-08-07): Staff Product Designer is his public title; Senior Design
  Lead (and any other internal level names in raw source docs) never
  appears on an external document.
- **Never touch** `src/content/resume.ts` or `public/jake-lunde-resume.pdf`.
  Never commit anything under `ref/` (CLAUDE.md §3).

## Evidence corpus (read in this order; tracker wins conflicts)

1. `portfolio-tracker.md` — fact source of truth. Field|Answer tables per
   project, ⚠️/⭑ flags, recorded corrections.
2. `src/content/resume.ts` — canonical resume; the baseline every variant
   deviates from. Its types are the variant's contract.
3. `content/greenlight-invest.mdx` + `content/family-hub.mdx` — polished
   narrative phrasings and public-safe metrics.
4. `src/programs/projects/cases.ts` — per-case taglines, theses,
   `box.requirements` metric pairs (incl. the two `soon` cases: tooling,
   interview-pipeline).
5. `ref/accomplishments-2026-h1-raw.md` — the H1-2026 accomplishments pull
   (metrics with attribution strength, verbatim recognition quotes, and a
   §9 "corrections to guard against" list that binds you the same way the
   tracker's ⚠️ flags do; its §6 "do not use" metrics are radioactive).
6. `ref/famhub-pull-quotes.md` and anything else under `ref/` matching
   `*accomplish*`, `*pull-quotes*`, `*review*` — raw receipts. New raw
   material Jake drops lands in `ref/` and is CONSUMED from there; if it
   contradicts the tracker, ask Jake which is current, then update the
   tracker so it stays the arbiter.

## Workflow

1. **Ingest the JD.** URL → WebFetch; if the page is JS-rendered (Apple,
   Greenhouse embeds), open it in the browser pane and `get_page_text`.
   Save the posting verbatim to `ref/applications/<slug>/jd.md` with a
   dated header — postings vanish. Slug = `<company>-<role-shorthand>`,
   e.g. `apple-cloud-infra`.
2. **Extract requirements.** Minimum quals, preferred quals, and the
   between-the-lines signals (team, audience, tooling expectations, seniority
   verbs). Number them; the brief and the bullet mapping cite these numbers.
3. **Map evidence.** For each requirement, find the strongest receipt in the
   corpus. Classify: `CLEARED` (receipt in hand) · `STRETCH` (adjacent
   evidence, needs framing) · `MISS` (no honest claim). Note the source line
   for every receipt.
4. **Write `ref/applications/<slug>/fit-brief.md`:**
   - Open with the verdict: overall fit read in 2–3 sentences, including
     "worth your time?" — blunt, not cheerleading.
   - Requirement → evidence table with CLEARED/STRETCH/MISS and sources.
   - Gaps: what's genuinely thin, and the honest framing if it comes up.
   - Talking points: 4–6 interview-ready stories drawn from the mapping.
5. **Write `ref/applications/<slug>/resume.ts`.** Copy the canonical file,
   then reword + swap: retune SUMMARY to the role, rewrite/substitute bullets
   from the corpus in the JD's own vocabulary, reweight SKILLS groups. Facts,
   orgs, titles, dates, metrics immutable. Same exports/types so the build
   script loads it unmodified. Comment each changed bullet with the
   requirement number(s) it targets.
6. **Render:**
   `node scripts/build-cv.mjs --input ref/applications/<slug>/resume.ts --output ref/applications/<slug>/jake-lunde-resume.pdf`
   If it overflows page one, cut the weakest-mapped bullet — never the type
   scale.
7. **Hand off.** Run the metrics grep from the law section, then present the
   brief + PDF for Jake's taste pass. He edits the variant file; rerun step 6.
