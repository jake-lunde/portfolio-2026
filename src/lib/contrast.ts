/* Real WCAG relative-luminance math, lifted out of SpecSheet.tsx so the
   sheet's printed chip ratios and BUILD A SKIN's gates are computed by
   the same code — a number the sheet shows and a number the gate judges
   by must never be able to drift. No React, no framework: a probe span
   and arithmetic. */

export type RGB = [number, number, number]

/** Parse a computed color string — "rgb(r, g, b)" / "rgba(r, g, b, a)"
    and the space-separated modern form — into channels. */
export function parseColor(input: string): RGB | null {
  const m = input.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const parts = m[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map((s) => parseFloat(s))
  if (parts.length < 3 || parts.slice(0, 3).some((n) => Number.isNaN(n))) return null
  return [parts[0], parts[1], parts[2]]
}

/** Parse an authored hex ("#2036C8" / "#28C") into channels. */
export function hexToRgb(hex: string): RGB | null {
  const h = hex.trim().replace(/^#/, '')
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h
  if (!/^[0-9a-f]{6}$/i.test(full)) return null
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

export function toHex([r, g, b]: RGB): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0').toUpperCase()
  return `#${h(r)}${h(g)}${h(b)}`
}

function channelLum(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

export function luminance([r, g, b]: RGB): number {
  return 0.2126 * channelLum(r) + 0.7152 * channelLum(g) + 0.0722 * channelLum(b)
}

export function contrast(a: RGB, b: RGB): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export function grade(ratio: number): string {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA·LG'
  return 'FAIL'
}

/** Resolve a CSS custom property to concrete channels by letting the
    browser compute it — the only truthful way to read a token that may
    be a var() chain, a skin override or an inline override. */
export function resolveVar(el: HTMLElement, name: string): RGB | null {
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  probe.style.display = 'none'
  el.appendChild(probe)
  const computed = getComputedStyle(probe).color
  el.removeChild(probe)
  return parseColor(computed)
}
