# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-07-28 (session 31).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs). **Production = `c776745`; local main
  IS origin/main — no divergence for the first time in three sessions.**
- **SHIPPED s31:** SpecSheet skin-reactive (`92b615b`) · canonical title
  Staff Product Designer (`2040fea`) · **Trash v1 OPEN with TWO records**
  (`c776745`): Grows With You (pink) + The Assistants. Jake approved the
  Assistants copy by shipping it. Deploy verified: markers live, Installer
  absent, spec foot says "theme or skin flip".
- **⚠️ Branch `cv-exe` = CV.EXE, pulled OFF main (Jake: "still needs some
  work").** Holds `7d65965` (the whole program: resume.ts, build-cv.mjs,
  PDF, registry, icon, sfx) + the old s30 HANDOFF rotate. Jake's open calls
  from s30 still stand: BFA vs BA, and the "came off a dot-matrix printer"
  summary line. Revise HERE, then merge to main to ship. Branch discipline
  is now the rule — see below.
- **⚠️ Branch `leaf-patch` still PARKED** (caterpillar CASES metaphor,
  `e85a51c` + `8934b21`). The Trash's third record TAG-03 "The Installer"
  is deliberately NOT live — it spoils/references the unshipped caterpillar.
  Restore it from `8934b21` when leaf-patch ships (breadcrumb comment in
  Trash.tsx says exactly this).
- **NEW RULE from Jake (s31): feature work starts on its OWN branch** — "i
  need to start doing this sooner." Never build a feature directly on main;
  main stays shippable so partial work never blocks a cherry-picked ship.
- **Skins:** classic (light/dark) + medieval; underwater = stub. Knight-speak
  voice LIVE (derived translation via SKIN_VOICE; explicit slots win;
  KnightSpeakLayer walks the DOM — `data-no-translate` is the escape hatch).
- **Copy layer + EDIT.MODE LIVE in production** — expect copy.json commits on
  main between sessions; rebase and merge at the KEY level, never force-push.
- **Jake is preparing to APPLY.** Remaining audit gaps: CV.EXE (built, on
  branch, needs revision) · Red Pen (Notion; blocked on critique artifacts —
  capture checklist lives in portfolio-tracker.md) · gate friction (visible
  second door + localStorage + `?ref=` — still unactioned, audit's #1 risk).
- **Tracking:** Notion (connector live; IDs in agent memory). **⚠️ COMMAND.CTR
  deck 500s — Blob cap until ~Aug 1; don't hammer.** Zero-`list()` fix = top
  infra backlog (spec in archived s26 incident).
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf;
  underwater; `--accent-on-inverse` role. Ports 3000/3210 are often owned by
  concurrent sessions — add a temp launch.json entry, verify, revert it.

## Latest session — branch surgery + the bin ships (s31, 2026-07-28)

**Fable solo (pure orchestration: rebase surgery, a two-line content cut,
deploy verification — nothing delegable). Deck unreported (Blob cap).**

- **Surgery, no force-push needed** (nothing was pushed): `git branch cv-exe
  main` snapshot, then `rebase --onto 2040fea 7d65965 main` dropped CV.EXE
  from main while keeping spec fix + title + HANDOFF rotate. Autostash
  carried the concurrent session's dirty `figma-plugin/code.ts` through.
- **Trash restored from `8934b21` via `checkout <sha> -- <files>`** (cherry-
  pick would have collided with the already-picked SpecSheet + diverged
  copy.json), TAG-03 cut per Jake, copy keys + registry applied by hand.
  Also re-applied the `spec-sheet.foot` copy line the s30 cherry-pick
  dropped.
- Verified on a temp `:3333` launch entry (3000 AND 3210 both owned by other
  sessions' servers; entry reverted). No local `npm run build` — a foreign
  dev server shares `.next`; Vercel's build was the gate and went READY.
- Live checks: `Disposal records`=1, `The Assistants`=1, `The Installer`=0,
  `Grows With You`=1, spec foot updated. Console clean, knight-speak
  derives on the new copy ("The reasons be the point — peruse the tags").

## Next steps

1. **CV.EXE revisions on branch `cv-exe`** — Jake's notes TBD + the two s30
   open calls (BFA vs BA; the dot-matrix summary line). Merge to main when
   he signs off. `docs/PLAN-CV-EXE.md` still the reference.
2. **Leaf-patch decision** (parked): merge/revise/abandon. On ship, restore
   Trash TAG-03 from `8934b21`.
3. Gate friction (Jake): the audit's #1 risk, still unactioned.
4. Red Pen: Jake pulls critique artifacts (Figma comments, Slack, one
   "I was wrong" receipt) — checklist in portfolio-tracker.md.
5. COMMAND.CTR zero-`list()` fix after Blob cap resets (~Aug 1).
6. Figma stale STRING vars; typography finale; underwater (carried).
