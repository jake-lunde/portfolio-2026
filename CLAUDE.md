# LUNDE OS — Law (slim edition, 2026-07-19)

> The binding rules only. Full original brief archived at
> `docs/BRIEF-ARCHIVE.md` (reference, not law). Process + current state:
> `HANDOFF.md`. Crew doctrine: `CREW.md`. Token architecture:
> `tokens/ARCHITECTURE.md`. Read HANDOFF.md at session start — it is ≤80
> lines by protocol (§4).

## 1. What this is

Jake Lunde's portfolio as a retro desktop OS ("LUNDE OS") — **the site IS
the work**: its craft, motion, and system-architecture are the evidence
that Jake builds, not just designs. Audience: design leaders at
Google-tier tech/fintech. Tone: simple, concise, experimental, a little
playful; a well-made machine from a parallel 1992. Scale and simplicity
over density and cleverness. Never a template.

Skins: `classic` (light/dark modes) · `medieval` · `underwater` (future).
Programs register declaratively (`src/programs/registry.tsx`); adding one
must stay cheap. Desktop icon order = ORDER array in DesktopIcons.tsx.

## 2. Design law

- **Tokens are the single source of truth**: `tokens/` (Tokens Studio
  JSON) → `npm run tokens:build` → generated CSS/TS. NEVER hand-edit
  `tokens.generated.css` / `motion.generated.ts`; never hardcode a color
  that has a token. Semantic roles (`--surface`, `--content`, `--accent`,
  `--accent-expressive`, `--border`, …) in all product CSS; core
  primitives never consumed directly.
- **Two accents per skin**: system (`accent`) + expressive
  (`accent-expressive`, marks-only where AA fails — enforced by the
  `accent-expressive-text` indirection). Never a third.
- Type: display/body/mono via `--display/--sans/--mono` (per-skin values;
  never negative-track pixel or blackletter faces). Decorative
  texture/foreign glyphs always `aria-hidden`, never meaning-bearing.
- Motion: springs from `src/lib/motion.ts` (SPRINGS) — no inline spring
  literals. 60fps or it doesn't ship; transform/opacity only;
  `prefers-reduced-motion` honored everywhere.
- Quality bar: WCAG AA (contrast audited per skin), full keyboard nav,
  responsive from 360px (windows → full-bleed stack on mobile), no CLS,
  case-study routes 95+ Lighthouse, shell lean (code-split programs).
- Images are swappable placeholders until Jake ships assets — fixed
  ratios, treatments applied by components, never block on them.
- Facts: cross-check `portfolio-tracker.md`; honor its ⚠️ flags.

## 3. Process rules (hard-won — do not relearn)

1. Dev server and `npm run build` share `.next` and corrupt each other:
   `preview_stop → build → preview_start`, always. Corruption symptoms →
   stop server, `rm -rf .next`.
2. Deploy = push to main (gh authed). GitHub combined status stays
   "pending" while Chromatic runs — verify deploys via Vercel MCP + a
   content-marker curl (~1min CDN lag). Never force-push without Jake's
   explicit OK.
3. **Never commit:** `ref/`, `portfolio-tracker.md`, `session-log.md`,
   `invest-pull-quotes.md`, `docs/`, `.env*`. Grep `git status` before
   every commit. Secrets stay ephemeral; never echo values.
4. Verify with JS probes over screenshots (hidden preview tab freezes
   rAF/Motion/CSS transitions — see memory). Filter tool output
   (grep/head/limits) — never dump unfiltered lists into context.
5. Blob storage: OIDC `storeId` fallback (no *_READ_WRITE_TOKEN env);
   versioned blob paths for mutable data (single-path overwrite serves
   stale CDN).
6. Task tracking lives in **Notion** (connector available). COMMAND.CTR
   deck reporting per §4.

## 4. Session protocol (applies to WHOEVER orchestrates)

1. **Run the deck live**: `dispatch` via `scripts/cc-report.mjs` as the
   first action of a build session; `return`s as they land; `merge` on
   ship. Solo sessions still report start/merge. Space calls ≥2s.
2. **Delegate separable work** (doctrine: `CREW.md`): Sonnet (HERTZ
   research · NYQUIST implementation) for closed tasks; Opus (FOURIER
   synthesis · DOPPLER review) for open ones; taste/vision never
   delegated. Going solo requires declaring why in the final reply.
3. **Budget discipline**: Fable turns = orchestration/taste/review only;
   execution sessions run Opus-led. New initiative → new session; don't
   resume epics. Batch asks. (Economics: CREW.md §4.)
4. **End of session — always**: update `HANDOFF.md` and ROTATE it —
   HANDOFF.md holds CURRENT STATE (≤60 lines) + the latest session note
   ONLY; move older notes to `HANDOFF-ARCHIVE.md`. A session that doesn't
   write itself down didn't happen; a HANDOFF that scrolls burns every
   future session.

## 5. Guardrails

- No new libraries without a reason. No invented colors or type scales —
  tokens or nothing.
- Match the references before improving on them.
- Build for extension: new program/skin = registry entry + token set, not
  a rewrite.
- When a subsystem must hardcode (canvas/audio/SVG), take values from the
  active skin's token hexes and note the derivation in a comment.
