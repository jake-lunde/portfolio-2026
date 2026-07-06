# Portfolio Site — Build Brief

> Single source of truth for what we're building and how it should look, feel, and perform. Claude Code reads this every session. When in doubt, match the references and honor the guardrails (§14).

---

## 0. What this is

A custom-coded portfolio for **Jake Lunde**, a principal-level product designer repositioning as a **design engineer**. The site is not a container for the work — **the site is the work.** Its craft, motion, and performance are the primary evidence that Jake builds, not just designs. Audience: hiring managers and design leaders at Google-tier tech and fintech.

**The concept has evolved.** This is no longer a linear "scroll through case studies" site. It is a **retro desktop operating system you explore** — a small, beautiful, fictional OS where each part of the portfolio is a *program* you open in a *window*. Think **[poolsuite.net](https://poolsuite.net)** for the interaction model (desktop, icons, windowed apps, a persistent vibe), fused with the **print-archive aesthetic** of the references in §2 (duotone government reports, CRT terminals, redacted dossiers, bold foreign-language type).

**Tone:** simple, concise, beautiful, experimental, a little playful. Restrained but cutting-edge. It should feel like operating a well-made machine from a parallel 1984 that somehow runs on modern web tech. Never a template. Never a deck. **Scale and simplicity above all** — one clear thing at a time, generous space, nothing crowded.

**Non-negotiables**
- Every interaction is intentional, fast, and tactile. No jank, no gratuitous animation.
- Content-first: the writing carries the work; the OS shell frames it.
- The visual system (§3) is fixed. Don't improvise new colors or type scales.
- Ship accessible (WCAG AA), keyboard-navigable, reduced-motion-aware — even inside the "toy OS" conceit.
- **Built iteratively.** Jake will grow this over time. Architect for adding new "programs" easily.

---

## 1. The metaphor & structure (the model)

A **desktop environment**. On load: a textured desktop, a top **menu bar** (system name, live clock, light/dark toggle, sound toggle), and a set of **program icons** (desktop icons and/or a dock). Opening a program launches a **window** — a titled, chrome-framed container that partitions its content. Windows are the core organizing device (the references are full of boxed panels; lean into that).

**Programs (v1 → later).** Build the shell to register programs declaratively so new ones drop in cleanly:

- **`README` / About** — bio + the design-engineer positioning. First-run window.
- **`Projects`** — a Finder-like index of case studies; opening one launches a case-study window. **Greenlight Invest is the first and is already written** (§2). Family Hub, Tooling, and the meta "Interview Pipeline" come later.
- **`Now Playing`** — what Jake's listening to. *Later:* Apple Music (MusicKit JS) or a YouTube player. Stub the UI now, wire the API later.
- **`Studio`** — an audio player for Jake's **own** music. Persistent playback across windows (see §2 stack rationale).
- **`Visualizers`** — fun generative / audio-reactive visualizers. Pure play; a place to show craft.
- **`Guestbook`** — visitors sign it. *Later:* needs a tiny backend (serverless + a store). Stub now, persist later.
- **`Arcade`** — small games. Later.
- **`Settings`** — light/dark, accent, sound on/off.

Treat this list as a starting set, not a spec to complete in one pass. **`Projects` (with Invest) + `README` + the desktop shell + light/dark are the v1 core.** Everything else is scaffolded and filled in over time.

**Ambient foreign type.** Subtle, overlapping foreign-language characters (CJK especially — see the Doppler and Bell Atlantic refs) as a decorative texture layer: low-opacity, oversized, partially behind windows, occasionally as window labels/version strings (`1984年アメリカ製`). It's a *vibe*, never content. Always `aria-hidden`, never conveying meaning.

---

## 2. Tech stack (decision — changed from the earlier draft, on purpose)

**Recommended now: Next.js (App Router) + Motion + MDX.**

The earlier brief said Astro. That was right for a linear content site. **It's the wrong default now** that the product is an interactive desktop environment with persistent, cross-window state (an audio player that keeps playing as you open/close windows, draggable/stacking windows, a live guestbook, a stateful density slider, games). That is a stateful SPA shell, which is React's home turf.

- **Next.js App Router** for the shell, routing (deep-link each open program, e.g. `/projects/greenlight-invest`), SSG/SSR for SEO on case studies.
- **MDX** for case studies (`@next/mdx` or `next-mdx-remote`) so prose stays portable and editable, and so custom components (Plate, MoatDiagram, density blocks) embed inline.
- **Motion** (`motion/react`, formerly Framer Motion) for window physics, open/close, drag, and micro-interactions. **GSAP + ScrollTrigger** only if a specific scrubbed sequence needs it.
- **State:** a light global store (Zustand) for window manager, audio player, and theme. Persist theme/guestbook-name to `localStorage`.
- **Styling:** CSS Modules or vanilla-extract with the design tokens (§3) as CSS custom properties. Tailwind optional; if used, map tokens into the theme and never use stock Tailwind colors.
- **Persistence (later):** guestbook → a serverless route + a small store (Vercel Postgres/KV or Supabase). Note as a follow-up; stub with local state first.
- **Media (later):** Apple MusicKit JS needs a developer token + user auth (heavier); YouTube IFrame API is lighter. Decide when we get there; build `Now Playing` against a simple interface so the provider is swappable.
- **Deploy:** Vercel. Static where possible.

_If Jake later decides the content/SEO story outweighs the app interactivity, Astro + React islands remains defensible — but the desktop metaphor tilts clearly to Next/React and I'd only switch back with a reason._

---

## 3. Visual system & design tokens (fixed)

The identity is **"a retro OS built out of old printed technical documents."** Two accents now — **NASA blue** and **Doppler pink** — replacing the earlier single orange (retired). Full **light + dark**, user-toggleable.

```css
:root{
  /* LIGHT (default) — warm print stock */
  --paper:      #E7E1D2;   /* cream base / desktop */
  --paper-2:    #DED7C4;   /* window surface */
  --ink:        #17150D;   /* near-black text */
  --ink-soft:   #5A564A;   /* secondary text, mono labels */
  --plate:      #131811;   /* dark figure panels inside light UI */
  --line:       rgba(23,21,13,.18);

  /* ACCENTS (both modes) */
  --blue:       #2440C7;   /* NASA cobalt — PRIMARY: interactive, active window, links, system */
  --pink:       #F2A6C2;   /* Doppler pink — SECONDARY: highlights, data-viz, playful accents */
  /* sample exact hexes from the NASA + Doppler reference images when they're in the repo */

  /* duotone tints */
  --green:      #2E4A38;   /* retained for one duotone family (old-report green) */
}

[data-theme="dark"]{
  /* DARK — CRT / terminal night */
  --paper:      #0D100C;   /* void desktop */
  --paper-2:    #14181A;   /* window surface, faint blue-black */
  --ink:        #E9E4D5;   /* warm off-white text */
  --ink-soft:   #8A9A93;   /* muted CRT gray-green */
  --plate:      #090C0A;
  --line:       rgba(233,228,213,.16);
  /* accents stay blue + pink but read as glows against the dark; allow a subtle bloom */
}
```

**Accent discipline.** Blue is the *system* accent — active window chrome, focus, links, primary controls. Pink is the *expressive* accent — data-viz marks, hover delight, the one thing on screen you want the eye to catch. Never introduce a third hue. Use each sparingly; the base is cream/void, not color.

**Texture (identity-critical), layered:**
- **Paper grain** on light surfaces (fixed SVG `feTurbulence`, ~0.5 opacity, `mix-blend-mode:multiply`).
- **CRT treatment** available for dark/terminal windows (subtle scanlines + faint bloom on accents + optional slight chromatic edge). Tasteful, and disabled under reduced-motion.
- **Halftone dots** on dark "plate" figures (`radial-gradient`, `mix-blend-mode:overlay`).
- **Archival marks** as an accent vocabulary: rubber-stamp blocks, redaction bars, circled-in-pink annotations, paperclip/photo-corner framing, mono "DOCUMENT ID / FIG. 01" labels (see the 3AM Archive + fisheries + NASA refs). Use for section headers, empty states, easter eggs — not everywhere.

**Duotone imagery.** Screenshots/photos render **duotone** as if plated in an old book: ink + blue (NASA family) or ink + green (report family), with grain. Provide a reusable `Duotone` treatment (CSS filter or SVG `feColorMatrix`) so any image dropped in inherits the look. **Jake is adding real images later (§11) — build the treatment now against placeholders so real assets slot in without rework.**

**Layout.** Windows partition everything. Inside a window: content column ~720–820px; full-bleed figures wider. Generous vertical rhythm; hairline rules; mono section numbers (`01 —`). **Restraint and scale over density** — this is the most important layout rule.

---

## 4. Typography

- **Sans (display + UI):** clean neo-grotesk in the family of the refs (ABC Diatype / Neue Haas Grotesk / Söhne; Inter as free fallback). 800 display, 600 subheads, 400 body. Display tight (−.02 to −.03em), near-flush-left. Body ~17–18px, line-height ~1.6, measure ~64ch.
- **Mono (technical):** labels, captions, window chrome, figure numbers, metadata, the "terminal" surfaces (JetBrains Mono / Söhne Mono / SF Mono).
- **CJK / foreign display:** a bold sans CJK face for the big decorative frequency-poster moments and ambient glyph texture. Decorative only, `aria-hidden`.
- Self-host; preload; `font-display:swap`; no CLS.

---

## 5. Desktop & window chrome

- **Menu bar (top):** system wordmark (invent a name — e.g. `LUNDE OS` / `JL-1984`), live clock, light/dark toggle, sound toggle. Classic-Mac restraint.
- **Desktop:** textured field; program icons (and/or a dock). Ambient foreign glyphs behind.
- **Window:** titled bar (name + mono meta like `SPEC-01`), close/zoom controls, framed body with the archival/CRT texture appropriate to the program. Windows open with tactile spring motion (§9), can stack/focus (blue active chrome), and are responsive — on mobile they go full-bleed and become a stack/tab model rather than free-floating.
- **Boot/empty states:** lean into the conceit — a brief boot line, a "CALLING…" progress bar (Bell Atlantic ref), a stamped "UNDER CONSTRUCTION" plate for stubs.

---

## 6. Data-visualization system

Line-art, single-mark, cream-on-dark or dark-on-cream, blue/pink accents. Each project keeps a signature motif:

- **Invest — frequency bars** ("920.12 FT" ref): vertical hairlines, one pink peak dot. Metrics/adoption.
- **Invest — Economic Moat:** concentric rings, company at center, rivals → competitors → distant threats outward; nodes tappable for "why ranked here." Interactive React component. (Echoes the Doppler concentric-ring ref beautifully.)
- **Family Hub — concentric rings** (YOU → … outward): per-member filter model.
- **Tooling — interlocking circles** (Unit8-style): one per tool.
- **Meta — orbital ellipses:** the interview→case-study loop.
- **HUD panels** (REDS Explorer ref) are a good template for dashboard-style stats: boxed mono panels, small pink bar charts, system-info readouts.

Viz animates in on view (draw-on lines, count-up); respects `prefers-reduced-motion`; SVG labeled for a11y.

---

## 7. Case studies

Case studies open as windows, authored in **MDX** so prose stays portable and custom components (`Plate`, `MoatDiagram`, `FrequencyBars`) embed inline. Greenlight Invest is written (`case-invest.md`); render it to match the POC.

> **Backlog — not v1 (see the plan's Site-level follow-ups):** a reader-facing "detail" slider that scales a case study from **TL;DR (comically short) → Standard → Deep.** Deliberately deferred so the first pass can focus on the shell + Invest. Don't build it now — just don't architect anything that would block it later (treat reader density as a potential view-state, never a route).

**Case-study window anatomy (from the approved POC, `case-invest-page.html` — re-skin orange → blue/pink):**
1. Title bar (mono `NN / Project`).
2. Hero — eyebrow (mono, blue), oversized display title, one-line **thesis** with the key word in **pink**, 4-cell mono meta grid (Role · Partners · Timeline · Shipped).
3. Numbered sections — `sec-no` (mono, blue) + tight `h2` + prose. Invest order: The gap → The system (three "moves") → Built, not just designed → The call (tradeoff) → What it did (outcome + quote).
4. Plates/figures — dark panel, mono caption (`Plate NN · label` + `FIG. X`), halftone, dashed placeholders for real assets.
5. Pull quote — pink left-border, large, mono cite.
6. Metrics — oversized numerals, pink highlight, mono label, paired with a frequency-bar plate.
7. Footer — Next project / Index.

---

## 8. Component / app inventory (v1)

**Shell:** `Desktop`, `MenuBar` (clock, theme toggle, sound), `Dock`/`DesktopIcons`, `WindowManager`, `Window` (titlebar + controls + chrome), `Boot`.
**Primitives:** `Plate` + `Placeholder`, `Duotone`, `Stamp`, `Redaction`, `PullQuote`, `MetricStat`, `MovesGrid`, `SectionHeader`, `GlyphField` (ambient foreign type).
**Case study:** `CaseWindow`. (Reader-density controls are backlog — see the plan.)
**Islands/interactive:** `MoatDiagram`, `ScrubGraph` (haptic-scrub graph — visual analog on web), `FrequencyBars`, `RingFilter`, `InterlockingCircles`, `OrbitLoop`.
**Programs:** `About`, `Projects`, `NowPlaying` (stub), `Studio` (audio), `Visualizers`, `Guestbook` (stub), `Arcade` (later), `Settings`.

---

## 9. Motion & interactivity

Minor inspiration: **[tol.is](https://tol.is)** — smooth, tactile, spring-based motion; restrained but alive.

- Windows open/close/drag with spring physics; focus transitions are quick and eased (150–350ms, custom cubic-beziers, not linear).
- One or two "signature" moments max per program (the Moat assembling; a visualizer; a window boot). Everything else is quiet.
- Micro-interactions on controls (toggles, slider, icons) — tactile feedback, subtle.
- `prefers-reduced-motion`: replace transforms with instant/opacity; disable CRT flicker and drag inertia.
- **60fps or it doesn't ship.** Transform/opacity only; avoid layout thrash.

---

## 10. Light / dark & settings

- **Manual toggle** in the menu bar; persists to localStorage; respects `prefers-color-scheme` on first visit only.
- Light = warm print stock; Dark = CRT/terminal night. Both carry blue + pink accents (blue glows in dark).
- Settings program also exposes: sound on/off, accent emphasis. Keep it minimal.

---

## 11. Content & assets

- **Reference content (already produced — read these):** `case-invest.md` (canonical Invest prose → MDX, and the source for the Deep density tier), `case-invest-page.html` (approved art-direction POC — re-skin orange→blue/pink), `portfolio-tracker.md` (facts/metrics/NDA — **honor the ⚠️ accuracy flags**: dates are 2024–2025; Peacock = Comcast/CMCSA), `session-log.md` (raw material for the meta case study).
- **Inspiration images:** Jake will drop the six references into `/docs/inspo`. They are: (1) Bell Atlantic CRT terminal — teal/blue scanline UI, coin selector, JP text; (2) REDS Explorer HUD — dark dashboard, pink bar charts, boxed panels, foreign glyphs; (3) Fisheries report — green duotone on cream, guilloché border, stamp; (4) NASA Space Bibliography — **royal-blue duotone** satellite on cream, stamps; (5) The 3AM Archive — aged redacted dossier, typewriter mono, red circles, stamps; (6) Doppler poster — bold CJK, pink/black **concentric rings**. Sample the blue and pink from (4) and (6).
- **⚠️ Images are coming later.** Most figures are placeholders now. Build every image surface (Plate, Duotone, case-study figures, project cards) so real assets slot in **without rework** — fixed aspect ratios, the duotone treatment applied by the component, graceful dashed placeholders until then. Expect a dedicated pass to swap placeholders for real screens, recordings, and photography.

---

## 12. Quality bar

- Lighthouse: as high as the interactive shell allows — 95+ on content/case-study routes; keep the desktop shell lean (code-split programs, lazy-load games/visualizers/audio).
- WCAG AA contrast (verify blue and pink on both cream and void; verify ink-soft). Full keyboard nav for the OS (open/close/focus windows); visible focus; semantic headings; alt text; labeled SVG; `aria-hidden` on all decorative glyph/texture.
- Responsive from 360px up: windows go full-bleed/stacked on mobile; the desktop degrades to a clean launcher.
- No CLS from fonts; reduced-motion honored throughout.

---

## 13. Build order (iterative — expect Jake to extend)

1. Scaffold Next.js (App Router) + MDX + Motion + Zustand; wire tokens, fonts, grain/halftone/CRT primitives, light/dark toggle.
2. Build the **Desktop shell**: MenuBar (clock, theme, sound), desktop/icons, `WindowManager` + `Window` with spring motion.
3. **`Projects` + `CaseWindow`**: render **Greenlight Invest** from MDX to match the POC (re-skinned blue/pink). Static plates/placeholders first.
4. Islands: `FrequencyBars`, then `MoatDiagram` (interactive), then `ScrubGraph`.
5. `About` program; project index polish; ambient `GlyphField`.
6. Motion + a11y + perf pass to hit §12.
7. Stub `NowPlaying`, `Studio`, `Visualizers`, `Guestbook`, `Arcade`, `Settings` as registered programs with "under construction" plates — fill iteratively.

**v1 ship = desktop shell + Projects/Invest + About + light/dark.** The rest (density slider included) grows over time.

---

## 14. Guardrails

- Don't add libraries not listed without a reason. Don't invent colors or type scales. Two accents only: blue (system) + pink (expressive).
- Match the POC and the references before improving on them. Scale and simplicity win over density and cleverness.
- Keep JS lean; code-split every program; the shell must stay fast.
- Decorative texture and foreign glyphs are always `aria-hidden` and never carry meaning.
- Images are placeholders until Jake delivers real assets — never block on them, always make them swappable.
- When facts are involved, cross-check `portfolio-tracker.md` and honor its ⚠️ flags.
- Build for extension: adding a new program should be declarative and cheap.
