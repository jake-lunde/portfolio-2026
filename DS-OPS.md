# DS-OPS — running a design system like LUNDE OS does, at work

> Written by FABLE for Jake, 2026-07-16, after shipping the LUNDE OS token
> pipeline (Style Dictionary → generated CSS → Storybook/Chromatic → TOKEN
> BRIDGE Figma round-trip). This translates what we proved on the portfolio
> to Jake's work context: **Figma Org/Enterprise · tokens already exist in
> code · consumers are web (React + Storybook)**. Opinionated on purpose;
> adjust names to taste.

## 0. The one-sentence architecture

**A single machine-readable token source in the repo, everything else
generated from it, and every mutation — human or Figma — arriving as a PR.**
Figma is an *editing surface* for token values and a *mirror* for components;
it is never a second source of truth.

## 1. What transfers verbatim from LUNDE OS

These earned their keep and port to any setup:

1. **Parity-gate migration** (our A0–A2). When moving existing code tokens
   into a canonical source, gate the cutover on **computed-value equality**,
   not file diffs: snapshot `getComputedStyle` for every token (in every
   theme/mode) before and after; require zero diff. Byte-diffing generated
   CSS is a trap (generators reorder/strip); computed values are the truth.
2. **Commit the generated artifacts.** Don't make prod builds depend on the
   token build step; commit the generated CSS/TS and add hooks
   (`predev`/`prebuild`) so it stays fresh locally.
3. **The freshness guard** (CI): `tokens:build && git diff --exit-code` on
   the generated files. This is the tripwire that catches "someone changed
   token JSON without rebuilding" — ours caught its first real offender the
   same week it landed (a Figma-originated PR).
4. **The auto-regen bot** (CI): on PRs touching `tokens/**`, rebuild and
   commit the regenerated artifacts back to the PR branch. Designers should
   never need to run Style Dictionary; the guard stays as backstop.
5. **Normalize serialization once.** Whatever tool writes token JSON (plugin,
   sync service, humans), make its formatting the repo's canonical format
   immediately — otherwise the first automated write is a whole-file diff
   and reviewers can't see the real change. (We learned this on PR #1.)
6. **Change-legible commits.** Automated token commits must say *what
   changed* (`color.accent.primary: #2036c8 → #6b29e5`), in the commit body
   and PR description. A bot PR nobody can review is a bot PR nobody trusts.
7. **Chromatic on every push** with TurboSnap. Visual regression is the only
   honest reviewer of a token change's blast radius; the free/low tiers are
   fine for catalog-sized Storybooks. Know that build URLs are **frozen
   permalinks** — share the project's latest-build link, not a build URL.
8. **Single-writer rule.** Exactly one automated system writes token files
   (the sync), exactly one writes generated files (the build). Humans PR
   like anyone else.

## 2. What CHANGES at work: the Figma bridge

On the portfolio we built TOKEN BRIDGE (a private plugin) because the
Variables REST API is Enterprise-only. **Work IS Enterprise — use the REST
API and skip the plugin entirely:**

- A small **sync service** (a scheduled GitHub Action or a tiny server
  endpoint) uses the [Variables REST API](https://developers.figma.com/docs/rest-api/variables/)
  to diff Figma variable collections against `tokens/` and open a PR when a
  designer publishes changes — same PR shape as ours, no plugin to install,
  no PAT-in-plugin UX, works for every designer on the team with zero setup.
- Direction of trust stays identical: Figma edit → PR → CI regen → review →
  merge → ship. The REST API just replaces the plugin's PUSH, and the same
  API (or a nightly job) replaces PULL by writing repo tokens into Figma
  variables/modes.
- Map **brands/themes → Figma variable modes** on a semantic collection, and
  keep a `core` (primitive) collection that semantic tokens alias. Aliases
  must survive the round-trip as aliases — that's the subtlest serialization
  point; test it explicitly (our hardest bug class).
- Since tokens already exist in code at work: run the §1.1 parity-gate play
  to consolidate them into one DTCG-ish source FIRST, then wire the bridge.
  Never wire a bridge to a token source you haven't made canonical.

## 3. Components: the honest contract

Sell this sentence to the team early, it prevents every bad roadmap:
**token values round-trip; component structure flows one way.**

- **Code is the component source of truth.** Storybook is its catalog;
  Chromatic is its regression witness.
- **Figma holds a generated/maintained mirror** of components, built ON the
  synced variables — so a token edit in Figma restyles the Figma library
  *and* (via the PR loop) the product. This is what makes the mirror feel
  alive without pretending Figma edits can rewrite React.
- **Structural changes** (new variant, new anatomy) happen in code and get
  mirrored to Figma — by hand, or increasingly by agent (the Figma MCP can
  generate/refresh library components bound to variables). Use **Code
  Connect** to link Figma components to their code so Dev Mode shows real
  snippets instead of guesses.
- The demo that convinces stakeholders: change one token (e.g. button
  radius) in Figma → PR with a legible diff → merge → the same change
  appears in the Figma library, Storybook, Chromatic's diff, and production.
  One value, four surfaces, one review.

## 3.5 The few-designers / many-engineers reality (Jake's two scenarios)

Two failure modes dominate when eng outnumbers design. They feel like the
same problem ("code and Figma drift") but they are solved by **different
tools**, and conflating them is the trap.

### Scenario A — eng ships a component to Storybook; Figma never gets it
The instinct is a live structural sync. Resist it: reverse-syncing structure
is lossy and destructive (it clobbers designers' in-progress work, detaches
instances, drops overrides). The durable answer is two moves:

1. **Generate/refresh the Figma mirror from the story on demand** — a
   *deliberate publish*, not a background sync. The Figma MCP (or a small
   codegen) reads the Storybook story and builds a variable-bound component
   in Figma. For **big/nested components**, build bottom-up: mirror the atoms
   first (they're already variable-bound), then compose molecules from
   instances — same order you'd build them by hand. Args/props → Figma
   component properties (TEXT/BOOLEAN/INSTANCE_SWAP); variant axes → variant
   sets. This is a periodic, reviewed batch job, not a per-commit hook.
2. **Code Connect** links each Figma component to its code so Dev Mode shows
   the real snippet, and its CI check **flags components that exist in code
   but have no Figma mapping** — that's your drift detector. The "connection"
   is Code Connect metadata, not a structural pipe.

Cadence that works: a weekly/point-release "mirror sync" (agent-assisted),
plus a Code Connect coverage check that fails CI when a new exported
component has no `.figma.tsx`. Drift becomes a visible, ticketed gap instead
of silent rot.

### Scenario B — eng hardcodes a value, or uses a wrong/invented token
**This is NOT a Figma round-trip problem — it's code governance.** You can't
reliably reverse-map `#2036c8` to "the token it should have been" (ambiguous:
is it `--accent`, or a one-off?), and args/props↔variants is exactly why
"pull the component into Figma to fix it" doesn't work. Solve it where the
code lives, in CI:

1. **Ban raw values in component styles** (stylelint):
   ```jsonc
   // .stylelintrc — fail CI on hardcoded color/size in component CSS
   "rules": {
     "declaration-property-value-disallowed-list": {
       "/color|background|border-color|fill|stroke/": ["/#/", "/rgb/"],
       "/^(padding|margin|gap|border-radius|border-width|font-size)/": ["/\\d+px/"]
     }
   }
   ```
   (Scope it to `src/components/**` so bespoke art/illustration is exempt.)
2. **Token allowlist — catches typo'd/invented tokens.** A tiny custom
   stylelint rule (or a CI grep) that extracts every `var(--x)` used in
   component CSS and fails if `--x` is not in the generated token set
   (`tokens.generated.css`). This is what stops `var(--acccent)` or a
   renamed-away token from shipping. Pair it with TS: generate a
   `type TokenName = '--accent' | …` union from the token build so inline
   `var()` in TSX is type-checked too.
3. **Chromatic** catches the *visual* consequence of a wrong value even when
   it's technically a valid token.
4. **The actual nut — "this hardcoded value IS `var(--accent)`":** a
   **hardcoded-value → token linter**. Build a reverse map from the generated
   tokens (value → token name) and a stylelint rule / codemod that flags (or
   auto-fixes) `#2036c8` → `var(--accent)`. This is genuinely tractable *in
   code* (stylelint plugins like `stylelint-declaration-strict-value` +
   a value→token resolver do exactly this). It is not solvable via Figma.

**One-line summary for the team:** structure drift → Code Connect + on-demand
mirror; value/token drift → stylelint + allowlist + Chromatic. Figma is never
the enforcement layer; CI is.

## 3.6 Automating the mirror — the three tiers

"Who pulls the trigger on mirroring a component into Figma?" has three
answers. Know which tier you're on; most teams over-build straight to 3.

First, the constraint that shapes all of them: **the only write path to the
Figma canvas is the Plugin API.** The REST API reads document structure and
(Enterprise) reads/writes *variables*, but it cannot create component nodes.
And the hard part was never the writing — it's the *translation* (anatomy →
auto-layout, which props become variant axes, which dimensions bind to which
variable). That translation is semantic judgment, which is why every tier
below still has an agent or a human in it. No off-the-shelf tool does this:
Code Connect only *links* existing components, Figma's Storybook plugin
embeds a live preview (not native layers), and DOM importers like
html.to.design produce flat, unbound layers needing full cleanup.

- **Tier 1 — On demand.** A designer/engineer asks an agent (Figma MCP) to
  mirror a component. Right answer when structure changes monthly. Don't
  automate a monthly event.
- **Tier 2 — A codified command.** The friction usually isn't *who* triggers
  it, it's re-specifying the procedure each time. Encode it as a repo
  skill/slash command (ours: `.claude/skills/mirror-to-figma`) so any agent
  runs the identical procedure — pre-flight tokenization audit → prop→variant
  mapping → atoms-first build → bind → verify parity — from one invocation.
  The *procedure* is automated; the *judgment* stays with the agent. **This
  is the sweet spot for most teams and the cheapest big win.**
- **Tier 3 — CI-triggered agent.** The Code Connect coverage check fails on a
  newly exported component with no `.figma.tsx`; that failure triggers a
  headless agent run (Claude Agent SDK + Figma MCP) that **drafts** the
  mirror on a scratch page and opens it for a designer to accept. Worth it
  only at real scale — many engineers, weekly component churn, mirroring
  backlog that a human trigger can't keep up with.

**The Tier 3 guardrail, which is the whole ballgame:** the agent *drafts*;
a human *accepts*. Never let automation write directly into the published
library. Auto-merged generated structure is exactly how designers' files get
clobbered and how the team learns to distrust the pipeline. Draft to a
staging page, diff it, promote deliberately.

## 4. Governance that scales past one person

- **Token PRs get a design reviewer + an eng reviewer** — the eng reviews
  blast radius (Chromatic), the designer reviews intent. Both take minutes
  because the diff is one line per token.
- **Semantic tokens are the API; primitives are private.** Components may
  only consume semantic tokens (`--color-surface`, `--radius-control`);
  lint for raw primitive/hex usage in component CSS (our "theme-pinned
  surface" cleanup was exactly this debt).
- **New token categories are additive PRs** (spacing/motion/shadow etc.) —
  add tokens first with values extracted verbatim from current usage (zero
  visual change), migrate consumers in follow-ups. Never both at once.
- **Motion is a token too.** We emit spring/duration values as a generated
  TS module consumed by the animation layer — themes can retune *feel*, and
  a Figma edit can slow every transition in the app. Nobody expects this;
  it's a cheap wow.
- **Write the ops doc in the repo** (this file's sibling). The pipeline is
  only as durable as the next person's ability to understand why the guard
  failed their PR.

## 5. Sequencing (the order that never breaks prod)

1. Audit + consolidate existing code tokens → one source (parity gate).
2. Generated artifacts + freshness guard + auto-regen bot in CI.
3. Storybook token board (live from the real CSS vars, not a hand-copy).
4. Chromatic wired to every push.
5. Figma bridge (REST API service at work) — values only.
6. Component mirror in Figma bound to variables + Code Connect.
7. Themes/brands as modes; new brand = new token set flowing through the
   SAME pipeline (this was our Medieval move — zero product-code changes).

## 6. Failure modes we actually hit (so you don't)

| Failure | Symptom | Fix |
|---|---|---|
| Guard missing on day 1 | Token PR merged, prod CSS stale | Freshness guard + regen bot (§1.3–4) |
| Serialization mismatch | First bot PR rewrites whole files | Normalize formats to the bot's output (§1.5) |
| Silent unit coercion | `50%` became `50px` in round-trip | Type-strict value mapping; only px↔number round-trips as numbers |
| Aliases flattened | `focus: {blue}` became a hex; theming broke downstream | Preserve references end-to-end; test the alias cascade explicitly |
| Frozen-build confusion | "My change isn't on Chromatic" | Share latest-build/project links, not build permalinks (§1.7) |
| Mixed writers | Two tools formatting the same JSON | Single-writer rule (§1.8) |
| Verifying styles through transitions | Computed styles read mid-transition look stale | Disable transitions when probing computed values in CI/headless |

— FABLE 🎛️
