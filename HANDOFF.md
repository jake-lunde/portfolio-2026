# HANDOFF — current state (rotates per CLAUDE.md §4.4)

> Older session notes: `HANDOFF-ARCHIVE.md` (never auto-read).
> Last rotation: 2026-08-05 (s36 Family Hub + rail SHIPPED; s37 + s36-pt2
> notes → archive).

## Current state

- **Live:** https://lunde.co (Vercel `portfolio-2026`, team `lunde-os`; push to
  main = deploy; verify via Vercel MCP + content-marker curl — GitHub status
  stays "pending" while Chromatic runs; NOTE the apex 308s to www — curl
  with -L or grep finds nothing). **Production = Family Hub ship (s36).**
- **⚠️ Jake's rulings on the shared checkout: no more concurrent sessions
  on one working tree, and check `git branch --show-current` before EVERY
  commit** (s36/s37 race, archive).
- **FAMILY HUB CASE SHIPPED 2026-08-05** (`case-family-hub` merged to
  main): 7 sections, 11 plates, 4 interactives, Jake's spoken cadence,
  progress 100 "Shipped — read it". PROGRESS.VWR rides the right margin —
  the product evolving v0.1→v1.0 as you scroll: living sketch (cursor-
  repel cutouts on the surface token), Jake's real prototype recordings
  as demos (PoC spans v0.2–0.3, lo-fi v0.4–0.5, hi-fi v0.6; black mat,
  posters from first frames, preload=none), break-out finale (device on
  SVG wall/kitchen; auto-zoom OFF for now — tune later), − window-shade,
  + manual zoom, hand-tuned BEAT_TO_STAGE map (§04 = hi-fi). Plate 11 =
  LaunchFilm (official GL YouTube nocookie embed: muted pointer-inert
  loop, mounts at 0.35 visibility; lightbox w/ sound PORTALS TO BODY —
  fixed inside the window anchors to its transform). Case windows open
  1280×720 @ x24. Assets `public/case/family-hub/evo/` (~7MB, mostly
  demo video); masters in `ref/assets-casestudies/` (never commit ref/).
- **RESUME.EXE v4 + BOX-86 live since 2026-08-04** (s37): open RESUME.EXE
  and it prints itself; DOWNLOAD PDF (deterministic `build-cv.mjs`, one
  page, never hand-edit the PDF). BOX-86 = petitions box w/ DOPPLER
  roasts. Branches `cv-exe` + `suggestion-box` merged — safe to delete;
  `medieval-sfx`* branches deletable once Jake confirms sfx live.
- **NEW FLAGSHIP SPEC'D — "The Desk"** (Notion, 2026-08-04): zoom out to
  the room the OS runs in. Art direction OPEN (Jake leans cute 3D; refs
  incoming). Next big build now that CV + Family Hub are done.
- **Branch `leaf-patch` (parked) got CRITTERS v2 in s34** (`89970d8`).
  ⚠️ At revive: progress.module.css slot sizes; branch says Family Hub 55
  vs main's 100 — reconcile; Trash TAG-03 restores from `8934b21`.
- **Jake's s31 rule: feature work starts on its OWN branch;** main stays
  shippable.
- **Skins:** classic (light/dark) + medieval (knight-speak + Jake's sfx
  LIVE); underwater = stub. Copy layer + EDIT.MODE LIVE — rebase, merge
  copy.json at the KEY level, never force-push.
- **Jake is preparing to APPLY.** Remaining audit gaps: Red Pen exhibit
  (Jake to save the Ryan avatar-token Slack screenshots → TokenThread) ·
  gate friction (audit's #1 risk, unactioned). **Standing ask: push HIM
  to prune and polish copy.**
- **Voice law (s35, memory `case-study-voice-calibration`):** write ALL
  user-facing drafts in Jake's spoken cadence; em dashes are an AI tell.
- **Tracking:** Notion (connector live). Blob cap lifted (Vercel Pro).
  Deck reporting works; Jake wants a COST read on steady-state usage;
  zero-`list()` fix still worth it. Source `.env.local`; positional args.
- **Known debts:** SpecSheet motion quote-strings; first-load JS perf;
  underwater; `--accent-on-inverse`; reduced-motion unverified by
  emulation. Never `npm run build` while any dev server owns `.next`
  (`lsof :3000 :3210` first — bit s36 twice).

## Latest session — the rail ships: idea to kitchen wall (s36, 2026-08-02→05)

**Fable solo by declaration through EIGHT passes of Jake's live review:
one tightly-coupled taste feature; splitting it would have cost more
context than it saved. Deck reported throughout. Full pass-by-pass
detail in the s36 commits (`f21fb5a`→`322ce21`).**

- **The arc:** floating evolution rail (5 spec'd stages) → Jake's Figma
  had NINE → living sketch + his real screen recordings replaced stills
  → PROGRESS.VWR with window-shade, zoom, story-synced beats → launch
  film plate → merged to main with RESUME.EXE/sfx work absorbed.
- **Gotchas earned this session (memories updated):** container queries
  measure the CONTENT box · the pane freezes IntersectionObserver
  delivery entirely (verify via playwright-core + ms-playwright
  headless_shell; `viewport:` not `viewportSize:`) · headless_shell has
  no h264 (ship webm <source> fallback) · Figma get_screenshot WHITE-
  MATTES image-fill/text nodes (circle/rounded masks + min-channel
  unmixing in sharp; invisible until the bg isn't white) · stacked
  crossfade layers eat pointer events (pointer-events: none on all
  non-interactive layers) · a body-portal is required for fixed
  overlays inside transformed windows · preview_stop can leave the
  process alive (lsof before build; .next corruption twice).
- **Live-verified at close:** all three demo mp4s + sketch cutouts 200
  on lunde.co, /projects/family-hub renders; prod deploy `2a009f0`.

## Next steps

1. **Jake: sanity-walk Family Hub LIVE on lunde.co** — rail through all
   nine beats, demos, launch film sound, phone (rail hidden <640cqw),
   medieval skin. Report anything off; auto-zoom tuning parked.
2. **Jake asset pass:** Ryan avatar-token Slack screenshots → Plate 09 ·
   color before/after → Plate 10 · remaining Drop plates (01, 04–06, 08).
3. **The Desk** — next flagship; Jake's 3D-room references incoming.
4. Cleanup when idle: delete merged branches (`cv-exe`, `suggestion-box`,
   `case-family-hub`, `medieval-sfx*` once confirmed).
5. **Jake:** eyeball tracker v2 + revive `leaf-patch` (reconcile Family
   Hub 55→100, slot sizes, TAG-03) or park on.
6. Gate friction (Jake) — audit's #1 risk, still unactioned.
7. COMMAND.CTR zero-`list()` fix · deck cost read · Figma stale STRING
   vars · typography finale · underwater · First Pass `459-473268`
   unindexed — carried.
