/* THE PALETTE — the twelve core color primitives a semantic role can be
 * re-cast to, and the one place they are written down.
 *
 * Every entry is already a CORE token primitive (tokens/core/color.json):
 * the visitor re-casts a role, never invents a color. The hexes are literal
 * here because these are the values being CHOSEN FROM — they have to exist
 * before they can become a var — and because the core tier is flattened at
 * build time, so a core color has no custom property of its own to alias to.
 * `token` carries the source path in slash form, which is what SKIN BUILDER,
 * SPEC.SHEET and the panel name the swatch by.
 *
 * This module has NO 'use client' and no imports on purpose. SKIN BUILDER
 * (buildASkin.ts) and LIVE NUDGE (tune.ts) are client modules, but the
 * token-commit route runs on the server and has to read the same twelve —
 * a commit that re-aliased a role to something outside this list would be
 * inventing a color, which house law does not allow.
 */

export type Candidate = { name: string; hex: string; token: string }

export const PALETTE: readonly Candidate[] = [
  { name: 'NASA Cobalt', hex: '#2036C8', token: 'color/nasa/cobalt' },
  { name: 'NASA Glow', hex: '#5C7CFF', token: 'color/nasa/glow' },
  { name: 'Lapis', hex: '#2F4C7E', token: 'color/lapis/blue' },
  { name: 'Vermilion', hex: '#9E2B1E', token: 'color/rubric/vermilion' },
  { name: 'Blood', hex: '#A32B1F', token: 'color/blood/base' },
  { name: 'Blood Light', hex: '#F08A7E', token: 'color/blood/light' },
  { name: 'Doppler Pink', hex: '#F2A6C2', token: 'color/doppler/pink' },
  { name: 'Gilt Gold', hex: '#B8860B', token: 'color/gilt/gold' },
  { name: 'Amber Light', hex: '#E0B755', token: 'color/amber/light' },
  { name: 'Amber', hex: '#5F4A0E', token: 'color/amber/base' },
  { name: 'Report Green', hex: '#2E4A38', token: 'color/report/green' },
  { name: 'Verdigris Light', hex: '#5FA87A', token: 'color/verdigris/light' },
]

/** Is this a token path the palette actually offers? The commit route's
    only defence against a hand-crafted POST aliasing a role to anything. */
export function isCandidateToken(token: string): boolean {
  return PALETTE.some((c) => c.token === token)
}
