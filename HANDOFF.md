# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-07-26 (session 25).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs).
- **Skins:** classic (light/dark, follows OS) + **medieval** (parchment/
  vermilion/gilt, MedievalSharp display+mono, Eagle Lake body, hand-inked
  dataviz). underwater = stub. SkinSwitch in toolbar + Settings;
  `data-skin`/`data-theme` on `<html>`; per-skin icon art (Icon.tsx CSS swap)
  + vocabulary via the copy layer.
- **Shell architecture:** the desktop is CONSOLIDATED to 10 icons (README ·
  CASE STUDIES · ABOUT THIS MACHINE · GUESTBOOK · MUSIC · FUN · FEEDBACK ·
  SPEC SHEET · SETTINGS · TRASH). `onDesktop: false` means "in a drawer or
  behind a widget", never unreachable — deep links still work. Three window
  kinds via `chrome`: `paper`, `crt`, **`bare`** (no titlebar/grip; the program
  draws its own housing and closes itself — see the iPod — and reaches the
  frame through `components/shell/windowChrome.tsx`). Drawers are declarative:
  `folder: [ids]` on a registry entry + `programs/folder/Folder.tsx`. Inactive
  windows recede via `filter: opacity(.3)` — **`filter`, not `opacity`, because
  Motion owns the inline `opacity`** for open/close and inline beats CSS.
- **Copy layer: LIVE.** `copy.json` (98 flat dot-keys; plain string or
  `{ base, medieval?, underwater? }`) + `copy.ts` (`t()`, `resolveCopy`) +
  `CopyText.tsx` (stamps `data-copy-id`); `program.<id>.name` carries skin
  vocabulary. NOTE: `Copy.tsx` is a forbidden filename — collides with
  `copy.ts` on a case-insensitive FS.
- **EDIT.MODE (SYS-99): LIVE AND PROVEN IN PRODUCTION.** Jake shipped
  `14f1285 COPY: EDIT.MODE — 3 keys` through it on 2026-07-26, so
  `EDIT_MODE_KEY` + `GITHUB_COPY_TOKEN` are set on Vercel. Expect copy.json
  commits to land on main between sessions — **rebase, never force-push, and
  merge copy.json at the KEY level** (his edits and yours are usually disjoint
  keys in one alphabetically-sorted file, so git reports textual conflicts that
  aren't real ones). `/edit`: key gate
  (`EDIT_MODE_KEY`, timing-safe) → `[data-copy-id]` contentEditable, Esc
  reverts, SAVE → `/api/copy-commit` → GitHub Contents API commits copy.json to
  main (`GITHUB_COPY_TOKEN`); 409 → rebase. Skin-aware slot targeting.
- **Type system ADOPTED** (s22): semantic ramp at 166 sites. ⚠️ before the next
  Figma PULL: delete stale STRING `core/leading|tracking|weight` vars.
- **DS pipeline:** `tokens/` (3-tier) → `scripts/build-tokens.mjs` → generated
  CSS/TS; TOKEN BRIDGE PULL/PUSH; Chromatic; Storybook (SB10+Webpack).
- **Tracking:** Notion (connector live); COMMAND.CTR deck via
  `scripts/cc-report.mjs` (`set -a; source .env.local; set +a` first — plain
  `source` doesn't export).
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf pass
  overdue; underwater everything. `viz.module.css` + `studio.module.css` pin
  `--accent: #5c7cff` for the always-dark CRT plate — wants a real
  `--accent-on-inverse` role; medieval Remixes maps `--accent` to the gilt
  expressive accent (vermilion is 2.5:1 on the ember plate), collapsing the two
  accents there. In Progress + machine chrome strings are still literals.

## Latest session — COMMAND.CTR: the human on top (session 26, 2026-07-26)

**Opus (SHANNON) orchestrating. Round 1 solo — one entangled feature across the
deck, the chip, the sprites, the reporter AND the API, every seam a shared type.
Round 2 dispatched two: NYQUIST on the avatar strokes, DOPPLER on the WHAT IS
THIS chrome pattern (disjoint files: shell chrome + registry + copy.json vs. the
deck). Zero conflicts. SHIPPED as `8ce7cdc`, verified live on lunde.co: the new
`/cc/avatars/jake.svg` serves 200, and `/api/cc-feed` now returns ZERO
`--agent`/`--task` rows — the read-filter healed the stored junk with no
`--reset`, exactly as designed.**

- **⚠️ `cc-report.mjs` keeps its OWN roster** (a node script can't import the TS
  crew module) and it was stale the moment SHANNON existed — the merge report
  bounced off my own guard. Add a call sign in BOTH `crew.ts` and that array.

- **The deck is a PYRAMID now, and the shape is the argument.** JAKE (portrait
  plate, `HUMAN · DESIGN ENGINEER`) centred on top with his prompts on a rail
  directly beneath him → FABLE (FABLE-5, orchestration) + **SHANNON (OPUS-5,
  execution — new call sign, same signal-theory family)** → the four
  delegates. Edges are
  labelled (`↓ BRIEF`, `RETURNS ↑ JAKE CURATES`, `↓ DISPATCH · ONE WHOLE TASK
  EACH`) so the loop reads without a caption. Delegate models corrected to
  OPUS-5.
- **Jake's own portrait is the avatar** (`ref/stamp/jake-vector.svg` → copied to
  `public/cc/avatars/jake.svg`, since `ref/` is never committed). Drawn as a
  full-colour `<img>`, never a CSS mask: the crew are one-ink silhouettes, the
  human is the only picture of a person. A medieval engraving of the same
  portrait sits in `ref/stamp/medieval/` for a per-skin variant later.
- **Prompt fragments are precise DIRECTION, per Jake** ("TWO ACCENTS PER SKIN.
  NEVER A THIRD.", "DECIMATE THE PHOTOSCAN UNDER 2K FACES") — never "make it
  cool". The deck must show him steering, not delegating the taste.
- **Two new event actions: `prompt` and `curate`** (agent `jake`) — his asks
  and his picks are first-class telemetry, quoted in the feed with ✎/✓. Prompt
  fragments live on their OWN rail, not read off the feed: the ticker holds 7
  rows and the human speaks rarely, so he'd scroll away in seconds.
- **`crew.ts` is now the single source of crew identity** (id/name/model/role/
  blurb + `isCrewId`); `cc-timeline.json` is just `recorded` + `sequence`. At
  rest a unit's status line says what it IS, not "STANDING BY" — the explainer
  lives where a visitor actually looks.
- **The `--AGENT · --task` bug was the REPORTER, not the deck.** A session
  called `cc-report.mjs` with flags against a positional parser, so `--agent`
  became the call sign. It now takes both forms and **refuses unknown call
  signs**; the API validates ids on write AND filters them on read, so the
  junk already in the blob heals on the next GET — no `--reset` needed.
- **The chip is one row, one target:** state · cast (JL + 5 faces, the one
  named by the leading edge lit) · leading edge inline · ENTER COMMAND CENTER.
  The expanding feed is gone. Its max-width is derived, not guessed:
  `calc(100% - 620px)` keeps 310px of clearance from the icon grid.
- **First contact on the desktop:** the first time your cursor finds a
  wandering unit it does NOT bolt — it turns and says who it is, its model and
  its last real task (live feed, else a recorded fallback). Once per unit,
  remembered in `lunde-crew-met`. The hold uses a REF (`holdUntil`), because
  the walk loop restarts on every state-dep change and a local would reset.
- **Round 2 (Jake, live over Notion comments):** the pyramid's middle tier is
  TWO units (FABLE + SHANNON) because Opus-5 runs most sessions; his prompt
  fragments must read as **precise direction**, never "make it cool"; his own
  portrait replaces the monogram, in colour, with no stroke around it.
- **`WHAT IS THIS` is a new SHELL pattern, not a deck feature** (DOPPLER's
  dispatch): `ProgramDef.explainer` holds a copy key, and the titlebar's meta
  slot (`CTR-11`) becomes a tooltip-pattern button — hover AND focus, Esc/blur
  dismissal sequenced BEFORE the window's own Esc-to-close. Any program opts in
  with one registry line. The deck's inline thesis band is gone; its text lives
  at `command.explainer`.
- **The transmission log is collapsed by default** and the window is sized to
  that state (800×592). Opening it scrolls the body ~78px — a disclosure the
  visitor asked for, not a layout failure.
- **The prompt rail: `AnimatePresence mode="popLayout"` + a reserved 66px +
  `overflow: hidden`.** Without popLayout the arriving chip stacked on the
  leaving one and the box grew for a beat; with it, the leaving chip leaves the
  flow (and needs clipping so it doesn't spill onto the tier below).
- **New motion token `human`** (150/22/mass 1.1, `tokens/core/motion.json`):
  Jake's inputs move analog — slower, heavier, allowed to overshoot — while the
  machines keep `deck`'s digital snap. Springs still come only from tokens.
- **Edge labels ride the tier grid** so BRIEF sits over FABLE and RETURNS over
  SHANNON, with the rule running through each label and stopping at it. The
  labels paint `var(--surface-inverse)` — the same token the CRT body uses — so
  the routing lines die at the type; `.edge` needs `z-index: 1` because the
  lines are absolutely positioned in the tier BELOW it.
- **`height: 100%`, not just `min-height`, on `.ctr`** — a flex column can only
  shrink a child when its own height is definite; the feed is the one elastic
  band and absorbs what the pyramid doesn't need. Window is 800×720.

## Next steps

1. **Jake — one env var left:** the optional `NUDGE_WEBHOOK_URL` (no ping on
   ENCOURAGE until it's set). `EDIT_MODE_KEY` + `GITHUB_COPY_TOKEN` are done.
2. **Eyeball what probes can't judge:** wheel feel at 24°/360° under a thumb,
   haptics on an Android device, three overlapping windows all at 30% (reads a
   little muddy by design), medieval spoke weights, LCD type at 8–13px.
3. **Figma:** stale STRING vars deletion + PULL verification (carried s22).
4. Typography fluid finale: MODE axis for clamp(); per-skin font-family on text
   styles. Then: language modifier on `t(key, skin)`; underwater; Weavy.
