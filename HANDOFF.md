# HANDOFF — LUNDE OS continuation brief

> Written 2026-07-07 by the Claude instance (Fable 5) that built v0.1→v0.2.1 with Jake.
> Audience: the next model working on this repo (expected: Opus 4.8) — and Jake.
> Read `CLAUDE.md` first; it is the design law. This file is the operating manual
> and the backlog. When they conflict, CLAUDE.md wins on design, this file wins on process.

---

## 1. State of the system (2026-07-07)

**Live at https://lunde.co** (canonical; `portfolio-2026-blue-pi.vercel.app` is the
underlying host — other vercel.app aliases are behind SSO, ignore them).

Shipped and verified:
- Desktop shell: windows (drag/stack/zoom/Escape), menu bar (clock, theme, sound),
  boot screen, wallpaper system (7 patterns, Settings picker), classic-Mac scrollbars.
- Type: Geist (body) / Geist Mono (mono) / **Geist Pixel** (all display + bold/highlight;
  self-hosted at `src/app/fonts/`, single 400 weight, letter-spacing 0 — never negative).
- Programs: README, Projects → Greenlight Invest case study (MDX, interactive Moat/
  Scrub/FrequencyBars), Guestbook (live, durable), Visualizers folder → 6 windows
  (Ride, Flowers, Scrobbles, Flights, Slopes, Daily), Studio (WMP-style WebAudio
  visualizer — BARS/SCOPE/RINGS), Now Playing (Apple Music, dormant), Settings.
- The conceit year is **1992**. Version string `v0.2 · 1992年アメリカ製`.

Dormant, needs Jake (nag him gently):
- **Apple Music**: set `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY_BASE64`,
  then visit `/musickit-setup` once → set `MUSIC_USER_TOKEN`. Widget + window
  self-activate. Reference docs in `ref/apple-now-playing/README.md`.
- **Studio masters**: MP3s into `public/audio/` + entries in `public/audio/manifest.json`.
- **Louie scan**: GLB/OBJ into `ref/` → `scripts/obj-to-model.mjs` → new viz entry.
- **invest-pull-quotes.md**: 11 research quotes, still not in the repo.

## 2. Architecture map (30 seconds)

- `src/programs/registry.tsx` — desktop programs (icon + window + deep link). One entry each.
- `src/programs/projects/cases.ts` — case studies (`case:<slug>` windows).
- `src/programs/visualizers/vizRegistry.tsx` — visualizers (`viz:<id>` windows).
- `src/programs/resolve.ts` — window id → chrome/component/size/path; `windowsForPath`
  maps deep links → initial windows; `ALL_PATHS` drives SSG.
- `src/store/windows.ts` (window manager) · `src/store/settings.ts` (theme/sound/wallpaper).
- `src/lib/studioPlayer.ts` — singleton audio engine (playback survives window close).
- `scripts/*.mjs` — data bakes (gpx-to-ride, obj-to-model, lastfm-bake, flighty-bake,
  slopes-bake). Pattern: raw data in gitignored `ref/` → committed JSON in `src/…`.
- `content/*.mdx` — case-study prose. Custom components imported at top of the MDX.

**Adding a program**: component + registry entry. **Adding a viz**: component +
vizRegistry entry. **Adding a wallpaper**: SVG tile in `src/components/shell/wallpapers.ts`.
Keep it this cheap — it's a CLAUDE.md guardrail.

## 3. Process rules (learned the hard way — do not relearn)

1. **Never run `npm run build` while the dev server is running** — they share `.next`
   and you'll corrupt the dev runtime ("Cannot find module ./vendor-chunks").
   Build first, then `preview_start`; stop the preview before the next build.
2. **Deploy = push to main.** `gh` CLI is installed + authed (keyring). Use
   `PATH="/opt/homebrew/bin:$PATH" git push origin main`. Vercel auto-builds; poll
   `api.github.com/repos/jake-lunde/portfolio-2026/commits/<sha>/status` until
   `success`, then verify the live URL. Never force-push without Jake's explicit OK.
3. **Never commit**: `ref/` (raw GPS/exports — contains home coordinates),
   `portfolio-tracker.md`, `session-log.md`, `invest-pull-quotes.md`, `docs/`
   (internal metrics, coworker names, copyrighted scans). All already gitignored.
   These leaked once and required a history rewrite. Check `git status` before commits.
4. **MDX gotcha**: components that receive markdown children must render `<div>`
   wrappers, never `<p>` — nested `<p>` breaks hydration (see `Lead`, `Move`).
5. **Vercel Blob** uses OIDC + `storeId: process.env.guestbook_STORE_ID` — there is
   NO `*_READ_WRITE_TOKEN` env var in this setup. Don't "fix" it back.
6. **Verify in the preview browser before pushing** — and know its quirks: rAF
   (exit animations, canvas loops) pauses when the tab is backgrounded, so "element
   still in DOM" after close is usually the frozen exit animation, not a bug. React
   synthetic events from `dispatchEvent` are unreliable for enter/leave — call
   `__reactProps` handlers directly when probing.
7. **Secrets are ephemeral**: API keys passed per-run via env (`LASTFM_API_KEY=… node
   scripts/lastfm-bake.mjs`), never committed, never stored in credential helpers.
8. Bake scripts fetch remote data (OpenFlights, geojson) at run time — they need network.
9. Commit messages end with the Claude co-author line; Jake likes seeing the log.

## 4. Design guardrails for new work (beyond CLAUDE.md)

- Two accents forever: blue = system, pink = the one expressive mark on screen.
  On the always-dark CRT surfaces, pin `--blue: #5c7cff` (see `.viz` in viz.module.css).
- Pink is never text on cream — use the `.hl-pink` annotation treatment.
- Display type = Geist Pixel at 400, tracking 0, sizes ≥ ~12px. No CJK in pixel.
- Every viz: HUD readout that flips idle-totals ↔ scrub-state; mono `Layer NN` panel
  labels; `sfx.tap()` on meaningful scrub boundaries; `useReducedMotion` honored;
  `role="img"` + real `aria-label` on SVGs; keyboard operability where interactive.
- Windows: deterministic SSR positions (no randomness before hydration).
- Sounds are synthesized (`src/lib/sound.ts`) — no audio asset files for UI.

## 5. THE BACKLOG (prioritized; specs + what to ask Jake for)

### P0 — content debt (the portfolio's actual job; do before more toys)
1. **Windows fit their content** (Jake's explicit gripe: "i have to scroll on all
   of them"). Viz window sizes in `vizRegistry.tsx` are set but content varies;
   audit each viz at 1280×800 and 1440×900, size so the whole viz shows without
   internal scroll (grow `h`, shrink paddings/panel heights where needed). Mobile
   stays full-bleed. Acceptance: no scrollbar in any viz window on a 900px-tall desktop.
2. **Family Hub case study** — needs Jake interview (tracker Plate II is empty).
   Follow the Invest pipeline: one-question-at-a-time voice elicitation → tracker →
   MDX. Signature viz: concentric per-member rings (RingFilter, CLAUDE.md §6).
3. **Tooling case study** ("I build my own leverage") — 3 tools, one narrative.
   Needs Jake interview. Viz: interlocking circles.
4. **Meta case study — "Interview Pipeline"** — `session-log.md` (local) has the
   raw material including 2026-07-06/07 build-process notes at the bottom. This is
   the story hiring managers will remember; treat the process notes as source.
5. **Real assets pass for Invest** — screens/recordings into the `Plate`s (all
   dashed placeholders are ready; `Duotone` treatment TBD on real images).
6. **A11y/perf pass** (CLAUDE.md §12): Lighthouse on / and case route, keyboard-only
   walkthrough, contrast audit of new CRT surfaces, `prefers-reduced-motion` sweep.
7. **SEO** (doc: "make my page the top search result"): per-window OG images in the
   archival style (satori/og route), sitemap, metadata pass, JSON-LD Person schema.
   lunde.co should be in `metadataBase`.

### P1 — doc items with everything needed already
8. **Boot loader character + favicon** — Jake is designing a character ("Stuff for
   Jake"). When his art lands in `ref/`: animate on the boot screen (sprite-sheet or
   Lottie-free CSS steps() animation, pixel aesthetic), favicon + apple-touch icons.
   If he wants a placeholder sooner: a pixel poodle (Louie) in the Clarus-the-dogcow
   tradition. Ask him first.
9. **Screensaver** — after ~90s idle on the desktop: DVD-logo-style bouncing object
   (his head illustration when provided; wallpaper-pattern tile until then), any
   input dismisses. Respect reduced-motion (static dimming instead). Menu-bar
   Settings toggle. Idle detection: pointer/key events on the shell.
10. **Snake (Arcade)** — register `arcade` program (icon exists: consider new
    'joystick'). Canvas snake on the CRT plate: blue snake, pink apple, mono score,
    arrow keys + swipe, `sfx.tap` per apple. High score in localStorage. Small
    window (~420×480). This finally opens the Arcade program from CLAUDE.md §1.
11. **Taurus constellation viz** — `viz:taurus`. Real star data (Aldebaran, the
    Hyades — hardcode ~12 stars, RA/Dec → x/y at bake or inline), cream stars sized
    by magnitude, blue connect-the-dots on hover, pink Aldebaran. Why Taurus: Jake's
    sign presumably — confirm the personal hook with him for the caption.
12. **Daily tracker enhancements** (doc): animate gauges in on open; cursor-face
    idea — needs Jake's face illustration; park until his character art exists.
13. **Invest: multi-company Moat** — extend `MoatDiagram` to a company picker
    (NFLX/AAPL/NKE + an ETF example). Data: hand-write 3–4 more ring datasets from
    public knowledge, cite "illustrative". Keep tap-for-why. The window title meta
    could become `FIG. B — <ticker>`.
14. **Invest: real haptics** — `ScrubGraph` already vibrates on mobile
    (`navigator.vibrate`); add the same to Moat taps + Ride/Slopes mile/run ticks.
    iOS Safari has no vibrate API — degrade silently, never fake it.
15. **Last.fm ↔ Apple Music gap-fill** (doc) — once Apple env vars exist, extend
    `/api/now-playing` pattern with a recent-tracks merge in the Scrobbles viz
    ("LIVE" chip vs "BAKED" chip). Low effort after activation.

### P2 — bigger toys (each is a real project; scope with Jake first)
> UPDATE 2026-07-07 (later): Photo Booth, Jigsaw, and Coloring Book SHIPPED
> (live at /booth, /puzzle, /paint). Booth's live camera path still needs a
> human verification (test browser has no camera). Remaining below: scrapbook
> persistence (booth phase 2), tattoo pages (needs Jake's SVGs), puzzle photos.

16. **Photo Booth** — webcam via getUserMedia, 90s filters (CSS/canvas: VHS chroma
    shift, dither, duotone, CRT scanline), countdown + snap + polaroid frame, and
    "pin to scrapbook" = post to a Blob-backed board (reuse guestbook API pattern,
    same moderation caveats — image content needs Jake's sign-off on storage).
17. **MS Paint / coloring book — tattoos** — needs Jake's tattoo line art as SVGs
    with closed regions (`ref/tattoos/`). Flood-fill on canvas or per-path SVG fill,
    limited palette (blue/pink/green/ink), "print" button = download PNG.
18. **Jigsaw puzzle** — canvas drag puzzle, ~24 pieces, snap tolerance, source
    images from his duotone plates. Piece edges can be simple squares with notches.
19. **Trading cards** — hidden collectibles: N cards (his character art) stashed in
    programs (a card in the Moat's outer ring, one at ride mile 10, one in the
    guestbook's 50th entry…). localStorage collection + a "binder" window. Combine
    with the coins/redeem idea — ask Jake what redemption means (a real sticker?).
20. **Buzzfeed quiz** — "Which LUNDE OS program are you?" — silly, shareable,
    5 questions, result card in the archival style with OG image. Copy needs Jake.
21. **Screen time / silly stats** — self-deprecating fake dashboard; needs Jake's
    numbers or a joke angle. Low priority, high charm.

### Explicitly deferred (do not build without Jake)
- Density slider (CLAUDE.md §7 backlog — Jake must write the 3 Invest tiers first;
  keep density a view-state, never a route).
- Accent emphasis setting (Settings row exists as "Soon").
- Anything requiring his likeness/art that doesn't exist yet.

## 6. How to work with Jake (observed, two days of it)

- He ships fast and reacts to *seeing* things — deploy early, screenshot in chat,
  iterate. He'll say "keep going" — when he does, pick the highest-leverage
  unblocked item, not the shiniest.
- He drops files in `ref/` and links Google Docs — check both at session start,
  and re-read the ideas doc (it grows silently).
- He'll authorize things quickly (device codes, dashboard clicks) if you make the
  ask a single bolded step with a code/link. Batch your asks; don't drip them.
- Match his energy in chat but keep the summaries scannable — he reads the bold
  lines first. Always end with "what I need from you," or nothing at all.
- He cares about: craft he can feel (scrub something, drag something), his family
  (wife's flowers, Louie), music, and the site being *evidence* he builds. Every
  feature should produce a describable interaction for the meta case study.

## 7. Session-start checklist for the next model

1. `git pull` (Jake may have pushed), `git status` (never commit the gitignored docs).
2. Read `CLAUDE.md`, this file, then diff the ideas doc against §5.
3. Check activation states: `curl -sL https://lunde.co/api/now-playing` (configured?),
   `public/audio/manifest.json` (tracks?), `ref/` (new drops?).
4. Build before dev server. Verify in preview. Push to deploy. Verify live.
5. Update this file's §1/§5 when you ship — this is the living state doc.
