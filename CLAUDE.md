# LUNDE OS — Law (slim edition, 2026-07-19)

> The binding rules only. Full original brief archived at
> `docs/BRIEF-ARCHIVE.md` (reference, not law). Code-adjacent invariants:
> `HANDOFF.md` (near-static, ≤40 lines by protocol §4.4). Current state,
> session narrative, projects/tasks/rulings: the **jaique vault**
> (`/Users/jake/jaique`, §3.6) — start `Atlas/Maps/LUNDE OS Map.md`,
> Current state box. Crew doctrine: `CREW.md`. Token architecture:
> `tokens/ARCHITECTURE.md`. At session start read HANDOFF.md and run
> `node scripts/vault-state.mjs` (the Map's Current state box, which is
> Dataview over vault frontmatter, rendered for the terminal).

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
- **Voice**: every written word on the site, and agent chat with Jake,
  follows `VOICE.md` (patterns, banned moves, exemplars). Machine caps
  strings included. Truth over punch; ask Jake rather than sharpen.

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
6. Task tracking lives in the **jaique vault** (`/Users/jake/jaique` —
   Obsidian, ACE format; navigation law in its `AIOS/Vault Map.md`;
   portfolio hub = `Atlas/Maps/LUNDE OS Map.md`; the vault is its own
   local git repo — commit there, separately). Notion is RETIRED
   (2026-08-12) — never write to it. COMMAND.CTR deck reporting per §4.
7. **One home per fact.** How Jake wants the work done (rulings, taste,
   tasks, narrative, who he is) → the vault. How the machine behaves
   (gotchas, mechanics, tool quirks) → Claude's memory files. Checkout/
   build invariants → `HANDOFF.md`. Binding law → this file. A fact
   lives in exactly one of them; when you find it in two, delete the
   copy outside its home and leave a pointer only if the reader would
   otherwise never look there.

## 4. Session protocol (applies to WHOEVER orchestrates)

1. **Run the deck live**: `dispatch` via `scripts/cc-report.mjs` as the
   first action of a build session; `return`s as they land; `merge` on
   ship. Solo sessions still report start/merge. Space calls ≥2s.
2. **Delegate separable work** (doctrine: `CREW.md`): Sonnet (HERTZ
   research · NYQUIST implementation) for closed tasks; Opus (FOURIER
   synthesis · DOPPLER review) for open ones; taste/vision never
   delegated. Going solo requires declaring why in the final reply.
3. **Cost discipline — the dominant lever is context SIZE, not model**:
   window-tokens scale with how big the context is on *every* turn (the
   whole history re-reads each turn). Measured: ~86% of a marathon
   session's spend happened on turns already >300k tokens; <100k costs
   almost nothing. So: **one task = one fresh session** — never resume or
   reuse a large session for a new task (resuming re-pays the full history
   from turn 1). Compact or `/clear` when context crosses ~150k; never let
   a session run to the 1M cap. Keep the orchestrator lean by delegating
   file-heavy work to subagents (isolation keeps big reads out of the main
   context). Fable turns = orchestration/taste/review only; execution runs
   Opus-led. Batch asks. (Economics: CREW.md §4.)
4. **End of session — always**: (a) session note → vault
   `Calendar/Notes/YYYY-MM-DD sNN.md` — claim sNN at session START with
   `node scripts/session-claim.mjs [--effort "<page>"] [--title "…"]`
   (atomic; stubs the note; never list-and-add-one — concurrent sessions
   raced on the number). At end, fill the frontmatter the stub left
   blank — `summary:` (one line, what landed) and `open:` (list of what
   waits on Jake) — then replace the "in progress" line with the
   narrative. Those fields ARE the handoff: the Map's Current state box
   and every effort's `## Sessions` are Dataview views over them (plus
   task `up`/`status`); nobody hand-writes either. **Delegate the
   write-up**: the orchestrator writes a ≤8-line brief (what landed ·
   ruled · open · PRs · task status changes), runs
   `node scripts/session-writeup.mjs --session NN --brief "…"`, hands
   the printed prompt to a Sonnet subagent, reviews `git -C ~/jaique
   diff`, commits. Judgment stays with the orchestrator; the agent does
   the reading and the prose; (b) **every session
   belongs to an effort** — the feature page in
   `Efforts/On|Ongoing|Simmering|Sleeping/<emoji> Name (E).md`. Find the
   one the work served; if the session started a new feature, mint the
   page in `Efforts/On` (Jake's ruling 2026-08-14, s64) from
   `x/Templates/Template, Properties, Effort (Kit).md` with
   `up: [[LUNDE OS Map]]`, the `## Sessions` Dataview block (copy from
   any effort page), `## Shipped`, `## Tasks`, and add it to the Map's
   Efforts box. The link is the session note's `effort:` frontmatter
   (every effort the session touched) + a line under the title. Debts
   Jake dictates become task notes in `Efforts/Notes/<Name>/` (`up:` the
   effort, `status: scoped`) — never mint tasks he didn't ask for. Then
   update touched efforts/tasks (Shipped, Rulings, task `status`) and the
   Map box's hand-kept **Standing** bullets only if a debt changed;
   commit the vault. Prod SHAs are never
   written down anywhere — prod = `origin/main` HEAD by definition; (c) repo
   `HANDOFF.md` holds near-static code-adjacent invariants ONLY
   (checkout/build law, guardrails, hooks) and is the sole handoff
   cloud sessions can read — touch it only when an invariant changes,
   keep it ≤40 lines, session narrative never returns to it (rotated
   blocks → `HANDOFF-ARCHIVE.md`). Jake-facing tasks/rulings go to the
   vault, never HANDOFF. A session that doesn't write itself down
   didn't happen.

## 5. Guardrails

- No new libraries without a reason. No invented colors or type scales —
  tokens or nothing.
- Match the references before improving on them.
- Build for extension: new program/skin = registry entry + token set, not
  a rewrite.
- When a subsystem must hardcode (canvas/audio/SVG), take values from the
  active skin's token hexes and note the derivation in a comment.
