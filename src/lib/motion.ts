import { SPRING_TOKENS, DURATION_TOKENS } from './motion.generated'

/* The shell's motion vocabulary — one source of truth for spring feel.
 * Values live in tokens/core/motion.json (the design-token source) and
 * arrive here via the generated module, so a theme (or a Figma edit) can
 * retune how LUNDE OS *moves* the same way it retunes color.
 *
 * Naming: window (open/zoom chrome) · deck (Command Center panels) ·
 * mini (MiniPlayer entrance) · zoom (shared-element photo/NP zooms) ·
 * widget (desktop widget entrances) · rise (gate slots ascending) ·
 * flight (gate letters flying to slots). */

type SpringName = keyof typeof SPRING_TOKENS

export const spring = (name: SpringName) =>
  ({ type: 'spring', ...SPRING_TOKENS[name] }) as const

export const SPRINGS = {
  window: spring('window'),
  deck: spring('deck'),
  mini: spring('mini'),
  zoom: spring('zoom'),
  widget: spring('widget'),
  rise: spring('rise'),
  flight: spring('flight'),
} as const

export const DURATIONS = DURATION_TOKENS
