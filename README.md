# LUNDE OS

The portfolio of Jake Lunde, staff product designer and design engineer, built as a small desktop operating system from a parallel 1992. Live at [lunde.co](https://lunde.co).

The site is the work. The way it's built is the evidence: I design it, and I ship it.

## How it's built

- **Next.js 15**, App Router, TypeScript. Programs (README, the case studies, the sequencer, the paint program, and so on) register in `src/programs/registry.tsx` as code-split entries, so adding one is a registry entry and a component.
- **Tokens are the single source of truth.** Tokens Studio JSON in `tokens/` builds through Style Dictionary (`npm run tokens:build`) into CSS variables and TypeScript. Product CSS only uses semantic roles (`--surface`, `--content`, `--accent`), never raw values. Two accents per skin, never a third.
- **Skins**: classic (light and dark) and medieval, with underwater still a stub. A skin is a token set plus registry entries, not a rewrite.
- **Figma stays in sync** through TOKEN BRIDGE (`figma-plugin/`), a plugin that reads and writes the same token JSON via the GitHub API.
- **Storybook** catalogs the parts. **Chromatic** runs on every push and diffs the stories the change touched.
- **Motion** runs on named springs from `src/lib/motion.ts`, transform and opacity only, and honors `prefers-reduced-motion`.
- **INSPECT**, top right on the live site, lets you pick anything on screen and read its tokens and springs live.
- Copy lives in `src/content/copy.json`, so the machine's own strings can be edited from inside the machine.

## Running it

    npm install
    npm run tokens:build
    npm run dev

## Who made it

Jake Lunde. I set the course and judge what comes back from a crew of AI agents. jakelunde@me.com
