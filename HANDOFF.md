# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-07 (two s39s same day: COMMAND.CTR v2 note →
> archive; SHIPPED.SW note below).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs; apex 308s to www — curl -L).
  **Production = COMMAND.CTR v2 (24b2f30) + SHIPPED.SW shipping now.**
- **⚠️ Shared-checkout law: no concurrent sessions on one working tree;
  `git branch --show-current` before EVERY commit.** s39b ate it twice:
  GitHub-Desktop branch switch killed an agent mid-pass (auto-stash saved
  it), and a THIRD session's dirty files blocked the ship merge. Isolated
  worktrees (CC v2 pattern) are the way; worktrees have their OWN .next —
  safe to build there.
- **SHIPPED.SW (this session, s39b): Case Studies = shelf of boxed
  software, 7 passes on `feat/shipped-sw-shelf`, SHIPPING** — see session
  note. origin/main merged in (HANDOFF conflict resolved; Window.tsx
  clamp + registry auto-merged, tsc gates).
- **COMMAND.CTR V2 SHIPPED 2026-08-06** (merge `24b2f30`): living
  pipeline deck — bezier pipes, packet hover, receipts rail, measured AA
  floors (alphas 0.39→3:1, 0.52→4.5:1, documented in command.module.css).
  `cc-timeline.json` Jake-lines = approved lowercase voice (uppercase
  guards in CSS — don't undo). Details in archive.
- **Window.tsx shell change (CC v2):** resting `left` clamps to
  `min(pos.x, 100vw − w − 12px)` — windows never open off-glass.
- **TAILOR-RESUME skill live** (`.claude/skills/tailor-resume/`): JD →
  fit brief + PDF in `ref/applications/<slug>/` (never committed). OPEN:
  Jake rules Staff-vs-Senior title + 75.8% activation metric.
- **FAMILY HUB CASE SHIPPED 2026-08-05**; assets `public/case/family-hub/
  evo/`; masters in `ref/` (never commit). Jake's live sanity-walk pending.
- **RESUME.EXE v4 + BOX-86 live (s37).** Merged branches deletable.
- **THE DESK spec'd** (Notion): r3f + curated drei + Blender→GLTF ruling
  in s39b session note; handoff-pattern screen illusion; refs incoming.
- **`leaf-patch` parked** (CRITTERS v2 `89970d8`); Jake's s31 rule:
  features on own branches, main stays shippable.
- **Skins:** classic (light/dark) + medieval live; underwater stub. Copy
  layer + EDIT.MODE live — merge copy.json at KEY level, never force-push.
- **Jake is preparing to APPLY.** Gaps: Red Pen exhibit assets · gate
  friction (s39b absorbed the license check into the shelf's PLAY flow —
  browse free, gate the open). **Standing ask: push Jake to prune copy.**
- **Voice law:** drafts in Jake's spoken cadence; em dashes are an AI
  tell; his verbatims lowercase among uppercase machines. ALL shelf copy
  = DRAFT for Jake's rewrite.
- **Known debts:** SpecSheet motion quote-strings · first-load JS perf ·
  underwater · `--accent-on-inverse` · reduced-motion by emulation ·
  medieval airbrush eats contrast under type (eyebrow fixed, wash itself
  needs a pass) · never build while a dev server owns the checkout .next.

## Latest session — SHIPPED.SW: the shelf ships (s39b, 2026-08-06→07)

**Fable orchestrated live with Jake in the loop all day; NYQUIST (Opus)
built 7 passes on `feat/shipped-sw-shelf`; HERTZ ran the 3D-framework
eval. Deck reported throughout. Jake: "very impressed."**

- **The arc:** installer parody → boxed-software shelf. One horizontal
  carousel (4th box hangs off), hand-rolled Box3D CSS cuboid (42px board,
  980px camera), Apple-TV cursor tilt (±10deg, push-away, pop 38px),
  flip via hover-revealed tag below box + exit-unflip, PLAY → loading →
  license (GateSphere reframed, WHOLE frame inverse) → case opens.
  Four cover variants off Jake's Figma refs ("set, not family"):
  figma/stripe/catalog/nocturne. Instrument Sans (next/font, → tokens at
  merge). YouTube covers: nocookie + IFrame-API gate — film visible only
  after 6.2s continuous PLAYING (loop boundary repaints chrome — the
  loop was the bug; crop provably can't fix it, numbers in CoverFilm.tsx).
  Board material: color-mix ground + feTurbulence grain + 12% sheen;
  AA re-audited (fixed 2 pre-existing medieval fails). Back panel: 3-row
  ledger (wrap was a shared-label-column grid bug), blurb elision Jake-
  approved. Footer/masthead deleted; window 720×443.
- **THE CAMERA WAS DEAD SINCE PASS 2** — perspective needs preserve-3d
  at EVERY level; .slot/.boxSlot/.plinth lacked it (translateZ moved a
  face 0.00px). Fixed + warned in CSS. Never remove those three.
- **3D ruling (HERTZ, verified):** shelf stays CSS 3D; The Desk = r3f +
  curated drei + Blender GLTF (~260-320KB code-split); screen-zoom via
  handoff pattern. Spline out (1MB+, paywalled video textures).
- **Pass 8 (shipping):** Jake's four Figma covers land as real box.art
  (nodes in session log); composed fronts become true fallbacks.
- **Flags:** BURN_OFF_MS 6200 = the YT-autohide guess knob · film absent
  ~13% of each loop (Jake to feel live) · medieval tagline 4.33 on
  parchment pre-existing · `family-hub 2/` dup dir — Jake deletes ·
  GH-Desktop stash@{0} droppable · Instrument Sans + art hexes ("ART,
  NOT CHROME" comments) → token architecture later.

## Next steps

1. **Ship verification** (this session): live smoke on lunde.co — shelf,
   films, license flow, phone.
2. **Jake live pokes owed:** CC v2 deck (pipes, rail, phone) · Family Hub
   case walk · now the shelf.
3. **Jake copy rewrite pass over all shelf drafts** (taglines, ledger,
   loading steps, license line, tag labels).
4. **The Desk** — next flagship (r3f ruling stands; Blender refs incoming).
5. Cleanup: delete merged branches (`cv-exe`, `suggestion-box`,
   `case-family-hub`, `worktree-cc-v2-pipeline`, `medieval-sfx*` on
   confirm) · `family-hub 2/` dup.
6. Carried: gate friction elsewhere on site · COMMAND.CTR zero-`list()` +
   cost read · replay-your-session task · Figma stale STRING vars ·
   typography finale · underwater · eyeball tracker v2 / leaf-patch call.
