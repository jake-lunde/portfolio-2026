# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-07-23 (session 20).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`;
  push to main = deploy; verify via Vercel MCP + content-marker curl —
  GitHub status stays "pending" while Chromatic runs).
- **Skins:** classic (light/dark) + **medieval** (shipped 6eede3e —
  parchment/vermilion/gilt, MedievalSharp display; Jake later swapped
  Jacquard 12 → MedievalSharp mono for legibility). underwater = stub.
  Skin picker in Settings **and** a toolbar SkinSwitch flyout trailing the
  wordmark (c61bb79); `data-skin` + `data-theme` on <html>. Skins now also
  re-costume desktop **icon art** (per-skin `<g>` swapped by CSS in Icon.tsx)
  and **words** (`src/lib/skinVocab.ts` — per-skin program names).
- **DS pipeline:** `tokens/` (3-tier: core/semantic/component, Tokens
  Studio JSON) → `scripts/build-tokens.mjs` (SD v4) →
  `tokens.generated.css` + `motion.generated.ts`. TOKEN BRIDGE Figma
  plugin (`figma-plugin/`) PULL/PUSH ↔ `design-tokens` branch PRs;
  `tokens-sync.yml` regen bot; Chromatic visual regression; Storybook
  catalog (SB10+Webpack, `.storybook/`).
- **Tracking:** Notion (connector live) — "Medieval Theme" project Done;
  COMMAND.CTR deck via `scripts/cc-report.mjs` (CC_FEED_KEY in
  .env.local).
- **Known debts:** SpecSheet motion values are hardcoded quote-strings;
  first-load JS perf pass overdue; dataviz hand-drawn medieval pass +
  per-skin language table scoped on Notion; underwater everything.

## Latest session — Skin switcher + per-skin desktop identity (session 20, 2026-07-23)

**Shipped to main (c61bb79, deployed).** Three Notion tasks landed: "put button to
toggle in toolbar" + "update icons for desktop apps" (Done); "update language" seeded.
- **Toolbar SkinSwitch** (`src/components/shell/SkinSwitch.tsx`): compact control
  trailing the wordmark showing the active skin, flying out to CLASSIC/MEDIEVAL/
  UNDERWATER. Each row wraps in `data-skin={id}` — because the generated token CSS
  scopes skins by *bare* attribute selector, a nested `data-skin` re-scopes
  `--surface`/`--accent`/`--mono` for that subtree, so each row is a REAL preview in
  its own palette + face (medieval row literally renders MedievalSharp on parchment).
  Underwater has no token scope yet → disabled + dimmed. Spring motion (SPRINGS.deck),
  reduced-motion + Escape/outside-click close. `menuLeft` wrapper groups wordmark +
  switch; light/dark toggle stays in `menuRight` (classic only).
- **Per-skin icon art** (`Icon.tsx` + `Icon.module.css`): Icon renders both a
  `.glyphClassic <g>` and (where present) a `.glyphMedieval <g>`; swapped purely by
  CSS off `[data-skin]` — no JS, SSR-safe, instant. 15 woodcut/heraldic medieval
  glyphs for the desktop programs (scroll, cog, cartwheel, easel, labyrinth, quill,
  organ pipes, keep, wax seal, shield, balance scale, brazier, …). Classic-hide is
  gated on `.hasMedieval` so variant-less icons keep classic under every skin.
- **Per-skin vocabulary** (`src/lib/skinVocab.ts`): `programName(id, canonical, skin)`
  overrides a program's display name (desktop label + window title + a11y). Medieval
  lexicon: README→Incipit, Projects→Works, Studio→Workshop, Visualizers→Scrying,
  Guestbook→The Ledger, Booth→Portraiture, Jigsaw→Labyrinth, Paint→Illuminator,
  Seq→Psaltery, Command→The Keep, Spec→Colophon, Machine→The Engine, Trash→Oubliette,
  Settings→The Workings. Consumed by `DesktopIcons.tsx` + `Window.tsx`.
- Verified: tsc clean, prod build green (19/19), both skins confirmed in-browser
  (medieval swaps icons+words; classic reverts fully). See memory
  `per-skin-reskin-mechanics`.
- **Taste follow-ups Jake may want**: Scrying orb reads slightly lightbulb-ish; Works
  clasp subtle; the medieval names are a first draft (all editable in one file).

**Still pending from session 19 (unshipped, in HANDOFF-ARCHIVE):** the Typography
round-trip (Figma text styles bound to variables) is built but awaits Jake's in-Figma
PULL check + his OK to push. Nothing about session 20 touched it.

## Next steps

1. **Language modifier — extend beyond app names** (Notion: update language). The
   per-skin vocabulary mechanism now exists (`skinVocab.ts`, desktop labels + window
   titles). Next: translate the rest of the copy per skin (window body text, hints,
   dialog voices) — likely a broader `t(key, skin)` layer. Jake framed it as "a
   modifier that translates the copy, even the app names."
2. **Type adoption sweep** (mechanical, delegate): map the 168 raw-px font-sizes +
   line-heights across src/**.css onto `--type-*` roles (nearest step). Clears D6 type
   warns; makes the ramp the real source. Parity is NOT zero-change (values snap) —
   Chromatic is the gate.
3. **Typography fluid round-trip finale** (after Jake verifies session-19 build):
   Desktop/Mobile MODE axis for the two clamp() sizes so both endpoints are
   Figma-tunable + PUSH-back; then per-skin (medieval) font-family override on text
   styles.
4. Prior: interactive/status adoption sweep; underwater skin (unblocks the switcher's
   3rd row + icon/vocab variants); Weavy probe at underwater asset pass.

