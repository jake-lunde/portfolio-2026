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
Jigsaw · Coloring (4 tattoo pages) · About This Machine · Trash (padlocked) ·
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
the snake coloring page is the weakest drawing (Jake may ask for a redraw).

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
- `content/*.mdx` — case prose. `src/programs/paint/pages.ts` — coloring pages.

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
