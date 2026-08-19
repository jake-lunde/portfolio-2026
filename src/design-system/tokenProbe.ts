/* TOKEN PROBES — how the catalog's boards find out what a token is actually
 * worth, at the moment they are drawn, in the skin and mode the toolbar is
 * set to.
 *
 * The boards do not import the token JSON and they do not read the generated
 * CSS as text. They ask the browser, because the browser is the only thing
 * that knows how a var() chain resolves under [data-skin='medieval']
 * [data-theme='dark'] — and because a board that reads the source can agree
 * with the source while disagreeing with the screen.
 *
 * TypeRamp and ScaleBoards had byte-identical copies of `raw` and
 * `scanTokens`, which is exactly the drift the boards exist to catch, one
 * level up. So they live here now.
 *
 * All four are safe to call during SSR: they return an empty answer rather
 * than reaching for a document that isn't there.
 */

/** What a custom property is declared as on :root, verbatim. May still be a
    var() chain if the engine chose not to substitute. */
export function raw(name: string): string {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** Fully-resolved length, via a hidden probe element. Used when `raw` hands
    back an unsubstituted var() chain: setting it as a width and reading the
    computed width makes the engine do the substitution for us. */
export function probeLength(name: string): string {
  if (typeof document === 'undefined') return ''
  const probe = document.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none'
  probe.style.setProperty('width', `var(${name})`)
  document.body.appendChild(probe)
  const v = getComputedStyle(probe).width
  probe.remove()
  return v
}

/** What the token is worth, as a literal. */
export function resolvedLength(name: string): string {
  const v = raw(name)
  if (v === '') return ''
  return v.includes('var(') ? probeLength(name) : v
}

/** Every custom property declared in the loaded stylesheets whose name
    matches. Scanned rather than hardcoded, so a board follows the token build
    instead of a list somebody has to remember to update. */
export function scanTokens(match: RegExp): string[] {
  const found = new Set<string>()
  if (typeof document === 'undefined') return []
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      const nested = (rule as CSSGroupingRule).cssRules
      if (nested) walk(nested)
      const style = (rule as CSSStyleRule).style
      if (!style) continue
      for (let i = 0; i < style.length; i++) {
        const prop = style.item(i)
        if (prop.startsWith('--') && match.test(prop)) found.add(prop)
      }
    }
  }
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules)
    } catch {
      /* cross-origin sheet — nothing of ours lives there */
    }
  }
  return Array.from(found)
}
