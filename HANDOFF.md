# HANDOFF — LUNDE OS continuation brief

> Maintained by the Claude instances working on this repo with Jake.
> Last full update: 2026-07-08 (Fable 5, end of its run — hello, Opus 4.8).
> Read `CLAUDE.md` first; it is design law. This file is process + state + backlog.
> Jake's ideas doc (Google Drive, "Portfolio 2026 / Updates and Ideas") is the
> source for new asks — re-read it at session start; he edits it silently and
> his freshest edits are his real priorities.

---

## 1. State of the system (2026-07-08)

**Live at https://lunde.co** (canonical domain; host is Vercel project
`portfolio-2026`, team `lunde-os`; push to main = deploy).

**Programs, all live:** README · Projects → Greenlight Invest case study
(MDX + interactive Moat/Scrub/FrequencyBars) · Guestbook (durable, Blob) ·
6 Visualizers now **broken out as desktop icons** (Ride, Flowers, Scrobbles,
Flights, Slopes, Taurus — each opens its viz:<id> window standalone; the
Visualizers folder still exists as the /visualizers index but is off the
desktop) · Studio (Jake's 5 remixes, WMP-style WebAudio viz — BARS/SCOPE/
RINGS) · Now Playing (**Apple Music LIVE**) · Photo Booth (per-pixel VHS/
dither/duotone/CRT; **PIN TO WALL** stores last 3 snaps in localStorage) ·
Jigsaw · Tattoo Gun (trace game) · About This Machine · Trash (padlocked) ·
Settings · **COMMAND.CTR** (brutalist orchestration deck — five named agent
units with animated shape avatars replaying the build history from
`src/programs/command/cc-timeline.json`; crew + delegation policy in
CLAUDE.md §13.5; avatars in `public/cc/avatars/`, assigned in
CommandCenter.tsx AVATARS map).

**2026-07-09 (Fable 5 finale, agent-orchestrated):** Visualizers back in a
folder (icon-grid) with viz desktop icons retired; Flowers→**Models** shelf
(photoscan flowers + procedural 662-face Louie from `scripts/make-louie.mjs`;
'jake' slot pending his scan; 3D clipping fixed: scale 0.46 centered).
`@vercel/analytics` live (pageviews free; custom events wired via
`src/lib/metrics.ts` but need Vercel Pro to appear). Scrobbles "Apple era":
`/api/apple-history` aggregates Apple recent-played (API caps ~50 tracks, NO
timestamps — per HERTZ research; never fake weekly counts), bake via
`scripts/applemusic-bake.mjs` against the live route, gap weeks render as
dashed blue carrier band. Legacy /visualizers/flowers aliases to models.

**2026-07-10 (Fable, usage-limited sprint):** Scrobbles timeframe truncated
at the last.fm dropoff (+2 carrier stubs). Mobile: no auto-README (launcher
first), 28px touch targets on titlebars. Studio: volume knob (rotary, drag
vertical, keyboard arrows) + per-track album art (`art` field in manifest).
PhotoWall: Jake's default polaroid pin (public/booth/jake-default.jpg,
dismissible via localStorage). COMMAND.CTR: **live mode** — /api/cc-feed
(Blob `cc/feed.json`; POST guarded by CC_FEED_KEY env — in Jake's Vercel +
.env.local; report with `scripts/cc-report.mjs`), LIVE chip when feed fresh
<15min, replay fallback, **marker-blackout redactions** (`redact:true` events
→ deterministic black bars; reporter must pre-strip secret text), telemetry
blips (dispatch rises/return falls/merge lands; status silent). Jigsaw: 5
generated puzzles (rings/louie-3D/crew/moat/pixel-lou in puzzleImages.ts),
timer from first touch, local top-5 leaderboard (names from guest-name key),
confetti. ORCHESTRATION RULE: when dispatching agents in live sessions,
report via cc-report.mjs so the site's deck mirrors reality.

**2026-07-10 (later — live crew):** cc-feed is LIVE-verified end to end
(CC_FEED_KEY in Vercel; feed uses VERSIONED blob paths cc/feed-<ts>.json —
single-path overwrite serves stale CDN reads, same lesson as guestbook; keep
~3, prune rest; space cc-report calls ≥2s or batch, read-modify-write races
lose events). Ambient agents shipped (`shell/AmbientAgents.tsx` + shared
`shell/crew.ts`): bottom-edge wanderer w/ shift changes + dispatch flashes on
window-open (agentForWindow mapping). Moderated public wall shipped (NYQUIST
built /api/wall + /wall-review?key=CC_FEED_KEY): booth pins → wall/pending/,
Jake approves → wall/live/ (≤3 shown to everyone); PhotoWall = own local pins
+ approved; Jake's default polaroid only when wall empty. SEQ-16 shipped
(/seq): 16×3 WebAudio sequencer (kick/snare/blip), BPM 60-180, 5 blip notes,
4 localStorage slots. ORCHESTRATION RULE stands: report dispatches live.

**Shell:** wallpaper system (7 patterns) · classic-Mac scrollbars · Geist/
Geist Mono/Geist Pixel type system · LOU.SYS screensaver (5-min idle; pixel
Lou over the perspective checkerboard; triple-click the menu-bar clock to
summon) · Now-Playing desktop widget (polls /api/now-playing) · **resizable
windows** (bottom-right ribbed grip; size persisted per-window in the store
for the session; `store/windows.ts` `sizes` map) · conceit year 1992 · v0.2.

**Desktop widgets** (edges, z-index 2, hidden < 900px): NowPlayingWidget
(top-right, Apple recent-played) · DailyWidget (bottom-left, live coffee +
Lou's-meds gauges from `lib/dailySystems.ts`) · PhotoWall (right edge, last
3 pinned booth snaps from localStorage key `lunde-booth-wall`; Photo Booth
calls `pinPhoto()` exported from PhotoWall.tsx).

**Windows now fit their content on open** (Opus 4.8, 2026-07-08): default
sizes in registry.tsx/vizRegistry.tsx were re-fitted from measured overflow.
Method if you add/change a window: open it in preview at 1280×820, measure
`windowBody.scrollHeight - clientHeight`, add that + ~8px buffer to the
declared height, keep ≤ ~730 so it clears the `max-height: calc(100%-24px)`
clamp on an 800px laptop. Long-form windows (case study, About This Machine
essay) intentionally still scroll.

**Known debts:** first-load JS is ~242 kB (was 155) — perf pass overdue;
Photo Booth's live-camera path has never been human-verified end to end;
(coloring book retired 2026-07-10 in favor of the Tattoo Gun trace game).

## 2. Architecture map (30 seconds)

- `src/programs/registry.tsx` — desktop programs (icon + window + deep link).
- `src/programs/projects/cases.ts` — case studies (`case:<slug>`).
- `src/programs/visualizers/vizRegistry.tsx` — visualizers (`viz:<id>`,
  deep-linked /visualizers/<id>).
- `src/programs/resolve.ts` — window id → window def; `windowsForPath`;
  `ALL_PATHS` drives SSG.
- `src/store/windows.ts` · `src/store/settings.ts` (theme/sound/wallpaper).
- `src/lib/studioPlayer.ts` — singleton audio engine (playback survives
  window close). `src/lib/appleMusicToken.ts` — Apple JWT.
- `src/components/shell/` — MenuBar, Desktop, Window, Wallpaper(+s),
  Screensaver, LouSprite (pixel map — edit the string grid), NowPlayingWidget.
- `scripts/*.mjs` — data bakes: raw personal data in gitignored `ref/` →
  committed JSON. Never runtime-fetch personal data.
- `content/*.mdx` — case prose. `src/programs/paint/tattooPaths.ts` — tattoo stencils.

## 3. Process rules (learned the hard way — do not relearn)

1. **Dev server and `npm run build` share `.next` and corrupt each other.**
   The trap that keeps biting: `preview_start` silently REUSES a running
   server. Sequence strictly: `preview_stop` → build → `preview_start`.
   Symptoms of corruption: ENOENT manifests, `__webpack_modules__[moduleId]
   is not a function`, black pages. Fix: stop server, sometimes `rm -rf .next`.
2. **Deploy = push to main** (`PATH="/opt/homebrew/bin:$PATH" git push`;
   gh is authed via keyring). Poll the commit status API until success, then
   curl the live routes. Never force-push without Jake's explicit OK.
3. **Never commit:** `ref/` (raw GPS, the Apple `.p8`, tattoo/Lou photos),
   `portfolio-tracker.md`, `session-log.md`, `invest-pull-quotes.md`,
   `docs/`, `.env*`. Grep `git status` for these before every commit.
   History was rewritten once over a leak; don't earn a second.
4. **MDX components taking markdown children render `<div>`, never `<p>`.**
5. **Vercel Blob = OIDC + `storeId: process.env.guestbook_STORE_ID`.**
   No `*_READ_WRITE_TOKEN` exists. Don't "fix" it.
6. **Preview-browser quirks:** rAF pauses when backgrounded (exit animations
   freeze — not a bug); synthetic enter/leave events don't fire React
   handlers — call `__reactProps` handlers directly; navigation + eval race —
   navigate in one eval, act in the next with a setTimeout.
7. **Secrets stay ephemeral** (per-run env vars); the safety classifier will
   rightly block persisting them and publishing content under your own name
   to the live site — don't fight it, hand those decisions to Jake.
8. Prerender errors can be flaky — rebuild once before debugging.
9. Commits end with the Claude co-author line.

## 4. Design guardrails (beyond CLAUDE.md)

- Blue = system, pink = the one expressive mark. CRT surfaces pin
  `--blue:#5c7cff`. Pink is never text on cream (`.hl-pink` treatment).
- Display/bold/highlight = Geist Pixel 400, tracking 0, ≥ ~12px, no CJK.
- Every viz: HUD flips idle-totals ↔ scrub-state; mono `Layer NN` labels;
  `sfx.tap()` on scrub boundaries; `useReducedMotion`; labeled SVGs.
- Personal-data features bake privacy in silently (trim GPS ends, normalize
  coords). Jake never asks for this; do it anyway.
- New programs must feel like the others: paper or CRT chrome, stamps for
  empty states, one signature interaction each.

## 5. THE BACKLOG (updated 2026-07-08 from Jake's doc — his freshest edits first)

### Jake's current emphasis (newly added/edited by him in the doc)
1. ~~**Window resizing**~~ ✅ SHIPPED 2026-07-08 (Opus 4.8).
2. ~~**Windows fit their content**~~ ✅ SHIPPED 2026-07-08 — defaults re-fitted;
   resize handles anything left. See §1 method note.
3. ~~**Daily tracker → ambient desktop widget**~~ ✅ SHIPPED 2026-07-08 (Opus).
   Still open sub-idea: hover cursor shows Jake's face getting happier as
   coffee fills — needs his face art; deferred until it exists.
4. **Studio: album artwork per track** — he'll need to drop art files in
   `ref/` or `public/audio/art/`; extend the manifest schema (`art` field).
5. **Now Playing: spinning record** — vinyl disc rendered behind/beside the
   album art, rotating (pause under reduced-motion). Widget + window.
6. **Settings: background color** — his edit says "Set the background
   *color*": paper-tint variants (cream/cool/warm/void?) alongside pattern
   wallpapers. Stay inside the two-accent law — tint the paper, don't add hues.

### P0 — content debt (Jake said it himself: "i will need to get back to
### actually generating case studies at some point")
7. **Family Hub case study** — interview → tracker → MDX (Invest pipeline).
   His LinkedIn describes it: hardware+software, calendars, AI assistant,
   safety map, chores, photos, "massive undertaking in only months."
   Signature viz: per-member concentric rings.
8. **Tooling case study** — "I build my own leverage," 3 tools, interlocking
   circles viz. Needs interview.
9. **Meta case study** — the raw material is rich and current in local
   `session-log.md` (bottom sections). This is the differentiator; nudge him.
10. **Real Invest assets** into the dashed Plates; `invest-pull-quotes.md`
    still missing from the repo.
11. **Perf + a11y pass** — 242 kB first load needs splitting scrutiny
    (audio manifest? viz data imports? check what landed in shared chunks);
    Lighthouse; keyboard sweep; contrast on CRT surfaces.
12. **SEO** ("make my page the top search result") — metadataBase lunde.co,
    OG images in the archival style, sitemap, JSON-LD Person.

### P1 — queued from the doc (everything needed is on hand or nearly)
13. **Last.fm ↔ Apple Music gap-fill** — Apple env vars are live now; merge
    recent Apple history into Scrobbles ("LIVE" vs "BAKED" chips).
14. **Snake game** — opens the Arcade program finally. CRT, blue snake, pink
    apple, localStorage high score.
15. **Photo Booth scrapbook** — Blob-backed pinned wall. Get Jake's explicit
    moderation sign-off first (strangers' faces, his storage).
16. **Low-poly queue** — Louie scan, "me?" (a scan of Jake) — pipeline ready
    (`scripts/obj-to-model.mjs`); needs his captures in `ref/`.
17. **Coins easter egg** (his face, redeemable) + **trading cards** — needs
    his face/character art ("Stuff for Jake" list); combine into one
    collectible system when art lands.
18. **Boot character + favicon** — waiting on his character design; favicon
    could ship early with pixel Lou (ask — Lou may BE the character).
19. **Screensaver head option** — his doc still mentions bouncing head
    illustration; LOU.SYS shipped — offer head as alternate saver object
    when art exists.
20. **Buzzfeed quiz** ("Which LUNDE OS program are you?") — copy session
    with Jake, then trivial to build.
21. **Screen time / silly stats** — needs a joke angle from Jake.
22. **Invest updates** — multi-company Moat (hand-write 3–4 datasets),
    haptics extended to Moat taps + viz milestones (navigator.vibrate).

### 2026-07-10 (Fable, session 3 — orchestrated) — SHIPPED
Projects wing GATED by a Severance/MDR sphere (`components/gate/GateSphere.tsx`
+ `store/gate.ts`; passcode LOUIE; fibonacci-sphere of letters, cursor-gravity
zoom, letters fly to slots, classic-Mac verdict dialog; `gated` flag on
resolveWindow, rendered in Window.tsx before the body; sessionStorage unlock).
Coloring book REPLACED by **Tattoo Gun** (`programs/paint/`, was pages.ts →
now `tattooPaths.ts`): WarioWare-style trace game, 6 tattoos as hand-authored
pixel strokes, pixel-gun cursor, 25s timer, coverage+precision score, local
bests. Ambient wanderer enlarged to 34px, campy speech bubbles
(`crewDialog.ts` by FOURIER), FLEES the cursor (pink, springy). Skills ticker
under the menu bar (`SkillsTicker.tsx`, desktop inset bumped +21px). README
rewritten + business-card header w/ Jake's photo (NYQUIST). Puzzle leaderboard
now always visible. Plane icon redrawn. GATE SOUNDS in `lib/sound.ts`
(`gateSfx`: pick/remove/success/fail). Skills-flex brief (12 ideas, FOURIER)
lives in this session's chat — top 3: user-research artifacts, design-system
docs, product-strategy/metrics.
BACKLOG (Jake asked, not yet built):
- **Digital billboard** — Jake wants "a note maybe a digital billboard for
  later." Unbuilt on purpose (underspecced). Likely: a desktop billboard/
  marquee surface for announcements ("NOW: open to Staff/Principal roles",
  "new case study dropping"), editable via a keyed endpoint like cc-feed, or
  just a static rotating message. Confirm intent + copy w/ Jake first.
- **Skills-flex programs** (FOURIER's brief): ACCESS.PANEL (a11y), FIELD.NOTES
  (research), SPEC.SHEET (design system), METRICS.CTR (strategy), MAN pages,
  MOTION.SPEC, EDGE.CASES gallery. These prove the *product-design* side the
  engineering-heavy site under-shows.

### 2026-07-11 (Fable, session 4 — wave-2 polish, all 10 asks) — SHIPPED
GATE FIXED: pointer capture on the sphere wrapper was retargeting clicks away
from the letter buttons (never capture on a parent whose children need
clicks); also added drag-vs-click discrimination (6px), release INERTIA
(velocity + exp decay blending back to ambient drift), a safety timer so
letter flights always land even if Motion's onAnimationComplete never fires
(hidden tab), and the sphere re-skinned PINK. Business card → POSTAGE STAMP
(About.tsx `stampCard`, Kyoto Forest format: type left / pinstripe plate
right; mark = public/mark.png alpha-extract of ref/mark/stamp-jake.png via
PIL saturation threshold, inked var(--pink) through CSS mask; perforation =
4-layer radial-gradient background). STICKY NOTES (shell/StickyNotes.tsx):
4 real quotes (2 Lattice peers, parent, kid-13) — z-index 0, décor loses to
windows. TATTOO FIDELITY PASS: all 6 stencils redrawn against the actual
photos (tattooPaths.ts) — dice tumble w/ bounce marks (1+3 pips), heart
carries the TAYLOR banner w/ skeleton letters, bed is the canopy cube w/
back band, wolf is faceted w/ dotted seams + crescent, Bob = body-with-face
holding ball-head, mouse = jack-o-lantern head + curly tail. AGENTS: first
scare = startle JUMP (wanderJump keyframes), second = flee; edge exits walk
fully off-screen then 5s off-duty gap before the next unit enters (no more
corner-camping rip). CC WIDGET (shell/CommandWidget.tsx): top-center pill,
pink pulsing dot when feed <15min fresh, expandable 4-event mini feed +
"OPEN FULL DECK"; command program off the desktop (onDesktop:false, /command
+ window intact; widget hides while the window is open). NYQUIST: MiniPlayer
(shell/MiniPlayer.tsx, shows when track playing & studio closed, art+◁▷❚❚×),
PUBLIC jigsaw leaderboard (/api/puzzle-times, versioned blob paths
puzzle/times-<ts>.json keep-3, validated POST, "BEST — WORLDWIDE", local
fallback), piece affordances (blue drop-shadow outline unplaced, scale+shadow
while dragging, flat when locked), trash pinned bottom-left, DailyWidget →
bottom-right. FOURIER: FIELD.NOTES (/field-notes, RES-13, research dossier
w/ real Invest quotes, placeholder ledger stamped) + SPEC.SHEET (/spec,
SYS-14, LIVE token doc — getComputedStyle + real WCAG luminance math,
re-reads on theme flip; motion values quoted from Window.tsx are hardcoded
strings — flagged). CLAUDE.md gained §13.6: always update HANDOFF at end of
session. GOTCHA learned: preview-pane tab reports document.hidden → rAF and
Motion animations freeze; don't chase "stuck" opacity/transforms in
screenshots — verify computed z/state via JS instead.

### 2026-07-11 (Fable, session 5 — 10 micro-polish fixes) — SHIPPED
(1) FIELD.NOTES hidden as a mystery icon: registry `desktopLabel: '???'` +
new `mystery` Icon (dashed frame + '?'); window title/route unchanged, opens
normally. (2) SPEC.SHEET icon redrawn — fanned paint-chips + 'A' type
specimen (color/type/tokens) replacing the janky swatch. (3) Sticky notes
repositioned to center band (left %-anchored) so the Now-Playing widget no
longer covers them; stickies stay z-index 0 décor. (4) Now-Playing widget
label 'Last played' → 'Now playing' (+aria). (5) Now-Playing PROGRAM off the
desktop (onDesktop:false); state lives in the widget. (6) Carried Jake's CSS
tweak (stamp perforation holes → var(--paper-2), plate border removed).
(7) PhotoWall dead hover × removed. (8) PhotoWall click-to-zoom lightbox
(`.photoZoom` fixed overlay, click-anywhere / Esc to close; pins are now
<button>s, cursor zoom-in). (9) CommandWidget only renders when live (idle
state gone). (10) Desktop icons: new `ProgramDef.desktopLabel`; DesktopIcons
imposes explicit ORDER (README·GUESTBOOK·MACHINE top row, SETTINGS always
last) and `.icons` switched to row-flow 3-col so the top row is literal;
mobile `.icons` scrolls (overflow-y:auto, top/bottom inset) and trash joins
the grid (`.trashGrid` shown ≤720px, `.trashIcon` corner hidden). ADD-A-
PROGRAM NOTE: desktop order is now the ORDER array in DesktopIcons.tsx, not
registry order — add new ids there (before 'settings').

### 2026-07-11 (Fable, session 6 — reverts + shared-element zoom + doctrine)
CC WIDGET REVERTED (Jake's call): CommandWidget.tsx deleted + its CSS;
command back on the desktop (registry onDesktop:true, 'command' in the
DesktopIcons ORDER array). SPEC.SHEET icon take 3: Pantone-style paint chip
(solid block + spec lines, second chip behind). FIELD.NOTES fully sealed:
registry name '???' → programs/fieldnotes/Sealed.tsx (dossier-folder SVG +
SEALED stamp + RES-13 note, Trash-teaser pattern; window 430×380); the real
FieldNotes.tsx stays dormant — to launch, restore name/component/size.
PHOTO ZOOM is now a TRUE shared element (Motion layoutId=photo URL): the
pinned polaroid itself flies to center (72vmin) and back on click-anywhere/
Esc — no separate lightbox img; wall siblings animate the gap (layout prop).
NOW-PLAYING widget shrunk to polaroid size (132px, matches photoWall) and
zooms the same way (layoutId np-card). CLAUDE.md §13.5 HARDENED: deck + 
delegation are session PROTOCOL for any orchestrating model — solo sessions
must self-report to the deck and declare "going solo" reasoning in the final
reply. NEW: CREW.md — delegation doctrine v1 (task-shape routing:
closed→Sonnet, open→Opus, taste/vision→orchestrator; whole-problems-first
splitting; economics; deck-viz roadmap incl. ownership lanes + solo events).
Read it before dispatching. GOTCHA: hidden preview tab stalls AnimatePresence
exits (overlay lingers at opacity 0) — state is correct, don't chase it.

### 2026-07-15 (Fable, session 7 — Design-System pipeline, Milestone A start)
On branch **design-system-pipeline** (NOT merged/deployed — feature work).
Plan: /Users/jake/.claude/plans/lively-sauteeing-snowflake.md (approved).
Goal: re-skinnable OS (classic|medieval|underwater) via a real token
pipeline + Storybook + Figma (Tokens Studio). Pipeline-first; v1 = pipeline
proven + Medieval. Classic keeps light+dark; others single-palette.
SHIPPED A0-A2 (commit 7f3eafa): token source-of-truth established.
- `tokens/` = Tokens Studio/DTCG JSON (core primitives color/font/layout +
  semantic classic-light/classic-dark + $themes/$metadata). Primitives
  resolve away; semantics alias them so --blue:#2036c8 emerges as before.
- `scripts/build-tokens.mjs` = Style Dictionary v4 + @tokens-studio/
  sd-transforms, one SD run per theme. TWO gotchas solved: (1) tokens-studio
  transformGroup names camelCase → cloned the group swapping name→name/kebab
  (kebab is what the site uses); (2) outputReferencesFilter (from
  'style-dictionary/utils') keeps var(--blue)/var(--ink) for EMITTED tokens
  but flattens primitive refs to literals — required for parity + the
  component --blue cascade. Emits FINAL data-skin selector model; classic-dark
  ALSO matches bare [data-theme='dark'] so dark works pre-store-widening.
- `src/styles/tokens.generated.css` (committed) imported by globals.css;
  hand-authored :root/[data-theme=dark] var blocks DELETED (utilities stay).
  Intermediates `src/styles/generated/` are gitignored.
- npm: tokens:build + prebuild/predev hooks + tokens:watch (onchange dep).
- PARITY GATE PASSED: computed-value diff of all 18 tokens (light+dark),
  hand-authored vs generated = ZERO. Clean build passes; dark CRT verified;
  site visually identical. HMR flakes on globals @import edits — clean
  restart (stop→build→start) needed after cutover, expected.
NEXT: A3 Storybook (@storybook/nextjs 8.5, font decorator, data-skin/theme
toolbar, catalog primitives+CaseComponents+Tokens board, Chromatic) — big
greenfield, good Opus-dispatch candidate. Then A4 (spacing/radius/type/motion
tokens + lib/motion.ts), A5 (Figma loop + end-to-end proof), A6 (Medieval
token set). Milestone B (in-site skin swap: store widening + subsystem
refactors) comes after the pipeline is proven. NOT pushed — awaiting Jake's
go to merge/deploy (A0-A2 is visually a no-op so safe to land anytime).

### 2026-07-15 (Fable, session 7 cont. — A3 Storybook, on branch storybook-catalog)
NOT on main yet (branch storybook-catalog, commit 0a432d7; A0-A2 already
merged+deployed to main). Dispatched FOURIER (Opus) for A3, reviewed + fixed.
SHIPPED A3: @storybook/nextjs 8.6 (Webpack5) catalog.
- Catalog: primitives/ (Stamp+tone control, UnderConstruction), case/
  CaseComponents (all 9 presentational components, one story each + full
  anatomy), design-system/Tokens = LIVE board reading getComputedStyle off
  the generated tokens (proof-of-pipeline page).
- .storybook/preview.tsx: 4 next/font faces re-instantiated (+offline
  fallbacks), imports tokens.generated.css + globals.css, Theme toolbar
  (classic-light/dark, medieval, underwater) → decorator sets data-skin/
  data-theme matching the generated selectors EXACTLY.
- Scripts storybook / build-storybook; storybook-static/ gitignored.
- FABLE REVIEW FIX: Tokens board didn't react to the toolbar on the MDX
  docs page (story decorators don't wrap bare MDX). Fixed by rendering it
  through an embedded <Story> (Tokens.stories.tsx + attached-docs
  <Meta of>/<Story of>). Verified: docs+canvas both switch light<->dark;
  build-storybook + tsc green.
- KNOWN DEBT: .storybook/main.ts has a webpackFinal DefinePlugin-dedupe
  hack because @storybook/nextjs 8.6 breaks on Next 15.4+ (repo is on
  15.5.20, NOT the 15.3.3 the plan assumed). Correct fix = Storybook 9 bump
  (supports Next 15.4+/React 19). Filed as a spawned follow-up task.
NEXT (Milestone A cont.): A4 (spacing/radius/type-scale/shadow/motion
tokens + src/lib/motion.ts consolidating 7 spring sites), A5 (Figma loop via
Tokens Studio + GitHub sync — needs Jake's Tokens Studio Pro seat + point
sync at repo; the end-to-end demo), A6 (Medieval token set). Then Milestone
B = in-site skin swap (store widening + subsystem refactors). Storybook
deploy target = Chromatic (needs Jake's account/token) — deferred.
OPEN: merge storybook-catalog → main? (safe; SB is dev-only, doesn't touch
the deployed site). Awaiting Jake.

### 2026-07-15 (Fable, session 8 — plan review + Chromatic finished)
FABLE (Fable 5) reviewed Opus's executed plan: VERDICT SOUND, four findings,
all resolved. A3.5 DONE (commit e2a6d0a on main): Chromatic CI green —
CHROMATIC_PROJECT_TOKEN set as repo secret via gh from .env.local (value
never echoed); workflow fixed (node 20→22 to match local 22.16; added the
A2-planned FRESHNESS GUARD: `npm run tokens:build && git diff --exit-code --
src/styles/tokens.generated.css` fails CI on stale generated CSS — critical
for future Tokens Studio PRs; onlyChanged/TurboSnap to stretch free 5k
snapshots). First run: completed/success; catalog PUBLISHED at
https://6a57efd8ebeed5b15d1ed8a9-hsxdbidcdf.chromatic.com/ (stable per-build
URL pattern; canonical entry = chromatic.com project page). Vercel deploy
unaffected, lunde.co 200. A3.6 DONE: seven byte-identical `* 2.*` macOS
duplicate artifacts deleted (worktree spin-off residue — watch for these
after background worktree tasks). PLAN AMENDED (lively-sauteeing-snowflake):
A5 now includes single-file consolidation (tokens/ multi-file →
tokens/tokens.json set-keyed) for the FREE Tokens Studio plugin tier
(decision: start free, Pro ~€17/mo only if multi-file/theme UI earns it),
with parity re-check after. SB 8→9/10 bump in flight in a SEPARATE worktree
session (task_b46a7142) — do NOT touch .storybook/ on main until it lands;
webpackFinal hack retires with it. NEXT: A4 (spacing/radius/border/
type-scale/shadow/motion tokens + src/lib/motion.ts consolidating the 7
inline spring sites + first consuming CSS slice), then A5 (Figma loop:
consolidate → plugin sync on design-tokens branch → edit→PR→CSS proof),
A6 (Medieval tokens). Then Milestone B.

### 2026-07-16 (Fable, session 9 — A4 + TOKEN BRIDGE merged; Figma loop CLOSED)
Commit 29cf799 on main. THE ROUND-TRIP IS PRODUCTION-PROVEN: while this
session was offline Jake installed the plugin and pushed two PRs from Figma
(#1 changed --blue to #2adbff, #2 reverted); PR #1 merged with stale
generated CSS and the chromatic freshness guard FAILED main exactly as
designed — the guard's first real catch. tokens-sync.yml (now on main)
auto-regenerates artifacts on future token PRs so that failure mode is
closed end-to-end.
SHIPPED: A4 (5 new core token sets spacing/radius/border/type/motion, all
values extracted verbatim; build emits src/lib/motion.generated.ts;
src/lib/motion.ts SPRINGS/DURATIONS consolidates all 7 spring sites; shadow
tokens shadow-print/-lg/lift/sticky/-lift/pin/modal consumed by
shell.module.css, dark overrides absorbed by token flip) + TOKEN BRIDGE
(figma-plugin/: manifest w/ api.github.com-only networkAccess, tokens.ts
pure mapping — FLOAT=px-only after the 50% fix, aliases round-trip as
Figma variable aliases, transparent preserved; github.ts git-data client;
code.ts PULL/PUSH; lo-fi terminal UI; PAT in clientStorage only).
GOTCHAS/RESCUES: (1) GitHub Desktop AUTO-STASHES on branch switch —
FOURIER's final fixes (% corruption, empty-commit guard, tsconfig exclude)
were stranded in stash@{2}; recovered. Stashes @{0}/@{1} are Jake's, left
alone. (2) tokens-sync originally committed only the CSS — patched to also
commit motion.generated.ts. (3) ALL tokens/*.json normalized to the
plugin's 2-space serialization (generated artifacts verified byte-stable)
so Figma pushes never carry formatting noise. (4) figma-plugin/dist/ is
GITIGNORED — after clone/branch switch the Figma dev-plugin entry breaks;
fix = npm run plugin:build, then Figma > Plugins > Development > Import
plugin from manifest > figma-plugin/manifest.json. Jake hit this ("cant
find the plugin").
BRANCH NOTE: local branches blue-update-test + design-tokens are Jake's
test artifacts; design-tokens also exists on origin (the plugin's PR
branch — it accumulates plugin commits by design).
NOTION: Jake is migrating tracking to Notion and shared a TOKEN BRIDGE
notes page — NOT REACHABLE from this session (no Notion MCP tools visible;
page URL is auth-walled). His notes may contain untriaged bug reports.
Next session: check for Notion MCP again, or ask Jake to paste.
NEXT: A6 Medieval token set (the pipeline is fully ready for it — author
semantic/medieval.json + $themes entry, [data-skin='medieval'] emits,
verify in SB toolbar + Chromatic + a Figma pull showing the new mode).
Then Milestone B (store widening + subsystem refactors).

### 2026-07-16 (Fable, session 10 — A7 component loop; commit bcde312 on main)
ROOT CAUSE of Jake's two Notion gripes (page 39fd29ee985480f78889c8ac426cb74c
— Notion MCP works now; both boxes ticked + comment posted):
1. "chromatic fails" — PR #3's `Tokens sync` run FAILED: `fatal: pathspec
   'src/lib/motion.generated.ts' did not match any files`. The design-tokens
   branch was STALE (tree predated A4), so CI checked it out and ran the OLD
   build script which never emits motion.generated.ts → my `git add` of a
   missing path hard-failed → no regen → stale CSS merged → freshness guard
   correctly reddened main. PR #4 passed (branch had caught up).
   FIXED TWO LAYERS: (a) tokens-sync.yml stages only artifacts that EXIST,
   then checks `git diff --cached` (also catches new untracked artifacts);
   (b) plugin resets design-tokens (delete+recreate from base head) whenever
   no PR is open on it — never stacks on an ancient tree again.
2. "diffs unreadable" — formatting noise was the one-time normalization
   (done session 9). NOW the PUSH reports `token.path: old → new` in the
   commit body, PR body on create, and a PR COMMENT on re-push.
ALSO: Chromatic URL confusion — the link Jake had is a FROZEN per-build
permalink; the living catalog is the project's latest build (or
main--<appid>.chromatic.com).
SHIPPED A7: Button primitive (src/components/primitives/Button.tsx +
story; tones system/expressive, sizes sm/md; consumes --radius-btn/
--border-rule/--border-heavy/--text-chrome-*) adopted in gate verdict +
Tattoo Gun; per-program button CSS deleted. NYQUIST token sweep across
shell/case/programs/settings/guestbook CSS (exact-match borders, chrome
type, spacing → tokens). DS-OPS.md written (Jake's work translation:
Enterprise Figma + tokens-in-code + React/Storybook → recommends Variables
REST API sync over a plugin; ports parity gate, freshness guard, regen bot,
single-writer rule, failure table). .claude/launch.json now has both dev
servers (lunde-os :3000, storybook :6006).
GOTCHAS: (1) shell ate backticks in the A7 commit message (two phrases
missing — cosmetic, left alone; QUOTE COMMIT BODIES OR AVOID BACKTICKS).
(2) Classifier + GitHub Actions API both had outages this session; use
`until <cmd>; do sleep N; done` in run_in_background rather than chained
sleeps (harness blocks those).
NEXT — A7.4/A7.5 REMAIN (need Jake): Figma library mirror via the Figma MCP
(skills figma-generate-library + figma-use; needs Jake's file open/URL —
mirror Button bound to the synced `semantic` variables), then THE DEMO:
Jake changes radius/btn in Figma → PUSH → PR (now with readable summary) →
tokens-sync regen → merge → corners change in Storybook + lunde.co.
THEN A6 Medieval (Jake is collecting changes).

### 2026-07-17 (Fable, session 11 — TEXTBOOK token restructure A8; commit 6f338c4)
Jake's DS critique was right: core+semantic were mixed (radius/btn next to
radius/sm) and paper/ink are brand metaphors that break underwater. RESHIPPED
as 3-tier + theme-agnostic roles.
- TIERS: core (primitives + raw scales: color ramp, space, radius none/xs/sm/
  md/lg/full, border widths, size ramp, motion, fonts) -> semantic (color
  ROLES mode-aware + scale intents: radius/control, border/default, text/label)
  -> component (button/radius -> radius/control -> radius/md=8). Full chain
  emits as var() so one edit flows through all tiers.
- RENAMES (563 identifiers, 36 files, whole-identifier codemod): paper->
  surface, paper-2->surface-raised, ink->content, ink-soft->content-muted,
  plate->surface-inverse, plate-ink->content-inverse, line->border, blue->
  accent, pink->accent-expressive, green->accent-support, pink-text/mark->
  accent-expressive-text/mark; radius-btn->button-radius, border-rule/heavy->
  border-default/strong, text-chrome-*->text-micro/caption/label/ui. Spacing
  kept NUMERIC (Jake's call). Button radius snapped 7->8 (base-8).
- PARITY: computed values of all roles identical to old names, light+dark;
  only button radius changed (intended). Build+tsc+Chromatic green, site
  visually identical.
- BUILD GOTCHA (saved to memory): SD v4 outputReferencesFilter CRASHES on
  multi-hop ref chains (component->semantic->core) with
  "Cannot read properties of undefined (reading 'join')" in
  outputReferencesFilter.js. Replaced with a null-safe custom predicate in
  build-tokens.mjs (emit var() only when every ref target's filePath is an
  `enabled` set this theme). Also: spacing set file is core/spacing.json but
  group is "space" -> $themes/$metadata must say "core/spacing".
- Storybook scroll bug FIXED: globals.css body{overflow:hidden} (OS owns
  viewport) leaked into Storybook via the globals import; re-enabled
  html/body scroll in .storybook/preview.tsx (Storybook-only).
- FABLE Notion bot: NOTION_FABLE_TOKEN in .env.local, integration auth's as
  bot "FABLE" (users/me confirmed). Posts comments as itself via Notion REST
  (distinct from the OAuth connector which acts as Jake). BUT pages must be
  shared with the FABLE integration first (Notion: page/db ... > Connections
  > add FABLE). Jake to grant at the Portfolio DB level.
- FIGMA MIRROR (prior turn, still valid): Button component set on page 77:432
  bound to synced variables; all 77 vars got scopes + WEB codeSyntax
  (var(--x)). font/* left unbound (CSS stacks, not Figma families).
CRITICAL NEXT — DO NOT PULL WITH THE PLUGIN YET: the token rename means a
PULL would create new-named vars (surface/content/...) as NEW variables,
ORPHAN the old (paper/ink...), and mishandle the new component/button set
(plugin only knows core/semantic collection prefixes). NEXT CHUNK: (a) update
figma-plugin PULL/PUSH to handle the component tier (3rd collection) + the
renamed semantic; (b) re-tier Figma (rename semantic vars, add component
collection, rebind the Button); (c) THEN Jake can pull. After that: A6
Medieval (author semantic/medieval.json color roles only — scale/component
stay :root; the whole point of role names).
OPEN WORK QUESTIONS Jake raised (his job, few designers/many eng): (1) eng
makes a component in Storybook, disconnected from Figma -> answer: generate/
refresh the Figma mirror from the story on demand (deliberate publish, not
live sync) + Code Connect to link+detect drift; structure is code-
authoritative. (2) eng hardcodes/uses wrong token -> answer: CODE-side
governance, NOT Figma round-trip: stylelint rule banning raw hex/px in
component CSS + a token-allowlist lint (var must exist in generated set) +
Chromatic. A hardcoded-value->token linter is 'the nut' and it's crackable
in code. Offer to codify into DS-OPS.md.

### Newly added by Jake in the doc (2026-07-08 diff — not yet scoped)
- **Gallery Wall** — "record of what people are doing on the site." Pairs with
  "more logging when users use my site." A privacy-respecting activity feed
  (window opens, viz interactions, guestbook signs) rendered as a live wall.
  Needs a logging endpoint + store decision (Blob append? KV?). Ask Jake how
  public/identifying he wants it.
- **Synth Program: 16 bars** — a step sequencer ("save tunes for others to
  listen to"). WebAudio (reuse studioPlayer patterns); persistence = Blob.
  A real project; scope with Jake.
- ~~**Photo Booth: pin last photo(s) to the desktop**~~ ✅ SHIPPED 2026-07-08
  (Opus) — last 3 snaps, **localStorage per-visitor** (no server, no
  moderation exposure). A *shared/public* wall would still need Blob + a
  moderation decision from Jake; not built.
- **Jigsaw: leaderboard timer + completion celebration** — time-to-solve,
  localStorage best; confetti/stamp burst on solve. Celebration is quick and
  unblocked; leaderboard-across-users needs a store.

### Ambient roaming agents (Jake asked for ideas, 2026-07-10 — not built)
The crew shouldn't live only in COMMAND.CTR. Sketches, cheapest first:
1. **Wandering avatar**: one agent shape at a time strolls the desktop edge
   (like Lou in the saver but tiny, 20px, during active use) — pauses near
   the window you have focused, "inspects" it, moves on. Pure CSS/motion.
2. **Dispatch flashes**: when a visitor opens a program, the matching agent
   briefly appears next to the window titlebar ("NYQUIST · MOUNTING") then
   fades. Ties agents to real UI events without a backend.
3. **Menu-bar presence**: a rotating tiny avatar in the menu bar showing
   "on duty" agent; clicking it opens COMMAND.CTR.
4. **Boot cameo**: agents' shapes flick past during the boot sequence.
5. **Live-mode spillover**: when the cc-feed is LIVE, the dispatched agent's
   avatar physically walks from the Command Center window to the desktop
   edge and back on each dispatch/return. The showpiece; needs #1's walker.
Recommend building #1 + #2 first (no backend, high charm), #5 when live
sessions become routine.

### Photo-wall moderation (Jake wants a shared public wall — design agreed)
Current: per-visitor localStorage + Jake's default pin. To go shared-public:
1. Booth "PIN TO WALL" → POST to /api/wall (new) → Blob `wall/pending/<ts>.jpg`
   (compressed ≤120KB, honeypot + rate-limit like guestbook).
2. NOTHING shows publicly from pending. Jake reviews at `/wall-review` — a
   page gated by CC_FEED_KEY-style secret (`?key=`) listing pending images
   with APPROVE (move to `wall/live/`) / REJECT (delete) buttons.
3. PhotoWall renders `wall/live/` (last 3) + visitor's own local pins
   (instant gratification while awaiting review — pins feel immediate to the
   pinner, appear to everyone only post-approval).
4. Vercel Blob TTL cleanup: pending older than 14 days gets purged by the
   review page on load. Estimated build: one session. Storage cost: pennies.

### From-Claude ideas Jake adopted into his doc (still open)
23. **Trash contents** — the killed-ideas archive ("Grows with You" et al.
    as redacted memos). The lock is already on the desktop; this fills it.
    Source material: portfolio-tracker.md tradeoffs row.
24. **Print stylesheet** — Invest case prints as a 1992 government report.
25. **Degauss/Konami** — screen wobble + a trading card drops (pairs with #17).

### Deferred (don't start without Jake)
- Density slider (he must write the 3 Invest tiers first; view-state, not route).
- Accent emphasis setting.

## 6. How to work with Jake (two days of observation, still accurate)

- Deploy early, screenshot in chat; he reacts to seeing things.
- His doc edits are silent — diff it at session start; checkboxes are his,
  leave them to him.
- Batch your asks into single bolded steps; he clears them fast.
- When he says "keep going," pick the highest-leverage unblocked item.
- He'll ask for honesty (see About This Machine) — give it, kindly.
- The site's soul is personal artifacts made monumental. New features should
  pass the test: does this contain something only Jake's life could supply?

## 7. Session-start checklist

1. `git pull` · `git status` (check nothing sensitive is staged).
2. Read CLAUDE.md → this file → diff the ideas doc.
3. `curl -sL https://lunde.co/api/now-playing` (Apple alive?) · check `ref/`
   for new drops · check the Blob dashboard-ish via /api/guestbook.
4. preview_stop → build → preview_start. Verify before push.
5. Update §1/§5 here when you ship. Add case-study beats to local
   session-log.md when something story-worthy happens — Jake is collecting
   them for the meta case study.
