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

## Weavy / Figma Weave — viability scout (HERTZ, 2026-07-19)

**What it is.** Weavy (Tel Aviv, founded 2024) was acquired by Figma in
October 2025 for ~$200M and rebranded **Figma Weave**. It's a node-based
generative-media canvas: nodes are typed functions (prompt, generate,
style-transfer, upscale, background-removal, color-grade, image→video) wired
together into a branching pipeline, chaining 50+ third-party models (Flux,
Ideogram, Nano-Banana/Seedream, Veo, Sora, Kling, Seedance). It is explicitly
**not** a design-token or variables tool — no mention of tokens/CSS
variables anywhere in Figma's own docs or blog. Ships two surfaces: a
standalone Weave canvas (weave.figma.com) and a growing set of "Weave tools"
embedded directly in Figma Design's Tools menu (generate mockup, transfer
style, replace background, change lighting, text-to-vector, apply color
palette).

**Access/integration reality.** Separate billing from core Figma seats.
Free: 150 credits/mo, 5 workflows. Starter/Professional/Team tiers
$10/1,000–1,200 credits with rollover; Team ~$48/seat/mo incl. 4,500
credits. In-Figma Weave tools require Professional/Org/Enterprise plan +
`can edit` access; currently **open beta, free, no credits consumed** — GA
will meter them. Figma↔Weave integration today: paste a Figma frame onto
the Weave canvas as a live node (edits in Figma reflect into the workflow);
outputs paste back into a Figma file as flat image layers. No public
API/webhook surface found for scripted/headless automation — everything is
canvas-driven, human-in-the-loop. Workflows (saved node graphs) are
shareable/publishable to Figma Community as templates.

**Concrete LUNDE OS fits, ranked:**
1. **Per-skin ASSET generation (best fit).** A workflow — moodboard/base
   illustration in, style-transfer + palette-apply nodes keyed to a skin's
   sampled hexes, batch-variation node out — maps well to producing wallpaper
   tile sets, booth-filter LUT-style looks, and plate/stamp imagery per skin
   (classic/medieval/underwater). This is squarely what "apply color palette"
   + "transfer style" + batch variation nodes are built for. Output is flat
   PNGs/SVGs a human drags into `public/` — no automation hook into our
   `ref/→public` pipeline exists, so it stays a manual art-production step,
   not a build-time generator.
2. **Moodboard → palette exploration feeding token authoring (decent fit,
   pre-token).** Import-node moodboards + "apply color palette" could
   usefully rough out a candidate hue direction before Jake hand-samples
   exact hexes into `core` — but the output is inspiration/reference, not
   anything that enters the pipeline directly; a human still eyeballs and
   commits real values.
3. **Anything token/variable-adjacent — confirmed none.** Verified plainly:
   Weave has no concept of Figma Variables, modes, or design tokens. It
   consumes and emits pixels/vectors, not values. It cannot touch our
   `tokens/` JSON, Style Dictionary, or TOKEN BRIDGE plugin in any way.

**Hard limits (what it is NOT for us).** Not a variables/tokens tool. Not
scriptable/headless (no API found) — can't be wired into `scripts/
build-tokens.mjs` or CI. Not free at scale (credits meter fast on
video/premium models; our use is images/vectors, cheaper tier, but still
metered post-GA). Output is raster/vector *assets*, always a manual
production step layered on top of, never inside, the token pipeline.

**Verdict: viable-later, as an art-production accelerant — not a
design-system tool.** It has zero surface area for the token/variables work
that's actually in flight (A8, bridge, doctor); its value is purely
speeding up bespoke per-skin imagery, which is real but orthogonal to
DS-OPS.

**Cheap next probe (~1hr).** Sign up free tier at weave.figma.com, build one
workflow: import a medieval-skin plate/photo reference → style-transfer node
using the medieval parchment/vermilion palette → batch-variation node → export
3–5 wallpaper-tile candidates. Time-box to 60 min and judge purely on "would
this beat Jake hand-illustrating/photobashing a tile" — if yes, worth a
follow-up spend; if the outputs need heavy cleanup, park it.

**Sources — fetched:**
- [Introducing Figma Weave (Figma Blog)](https://www.figma.com/blog/welcome-weavy-to-figma/)
- [Connecting Figma and Weave (Figma Blog)](https://www.figma.com/blog/connecting-figma-and-weave/)
- [Use Weave tools in Figma (Figma Help Center)](https://help.figma.com/hc/en-us/articles/40779260614935-Use-Weave-tools-in-Figma)
- [Figma Weave (formerly Weavy) review — designtools.fyi](https://designtools.fyi/tools/figma-weave)
- Web search results on pricing (help.weavy.ai subscription/credit articles) and node model (help.weavy.ai "Understanding Nodes")

**Substituted (transcripts blocked):** The YouTube tutorial playlist
(`PLu0WpBQHUSql4tPg9BHzvp-7ajhDMRFBE`) and inspiration video
(`h7i31pJenMg`) returned only page chrome via WebFetch — YouTube transcripts
aren't reachable over plain HTTP fetch, as expected. The single video
resolved to a **Config 2026 talk, "From handoffs to upstream ft. Frederick
Andersen (EDL)"** — a handoff/workflow talk, not confirmed Weave-specific
content; treat that title with caution, it may be a playlist/ID mismatch
rather than a true substitute. In place of the playlist I substituted
written coverage of Weavy tutorials/node fundamentals (Weavy's own "
Understanding Nodes" doc, Wireflow's "Weavy Workflows" writeup, and a
Chase Jarvis walkthrough of style-transfer/moodboard use) found via
WebSearch — directionally consistent with the docs findings above but not a
1:1 substitute for watching the actual playlist.

— HERTZ 📡

**FABLE verdict (2026-07-19):** Agreed with HERTZ: Weave is an art-production
accelerant, not a DS tool — park it until the underwater skin's asset pass,
where the 1-hour style-transfer probe (base illustration + skin palette →
wallpaper/plate candidates) is exactly the cheap test, and the win condition
is "beats hand-illustrating," nothing grander. Note: the "inspiration" video
is Frederick Andersen's Config talk on moving designers upstream of handoff —
that's not Weave adjacent, it's the thesis of the DS-mirror/autonomy work we
shipped this session: the designer edits the system of record directly and
the pipeline (bridge → doctor → CI) replaces the handoff. Our innovation
budget stays there; Weave joins when assets are the bottleneck.
