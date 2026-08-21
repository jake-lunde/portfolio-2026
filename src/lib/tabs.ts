/* THE INSPECTOR'S TAB STEP — pure, so it is testable without a DOM.
 *
 * The dock used to stack every reading — PATH, SOURCE, COPY, TOKENS,
 * CONTRAST, TYPE, MOTION — in one long scroll. Jake's call (2026-08-21,
 * post-s105): collapse like kinds into tabs, no more than three at the top,
 * nested tabs only where a kind still needs splitting further. See
 * InspectorPanel.tsx for the grouping and why.
 *
 * Both tab rows — the top three and STYLE's nested four — walk the same
 * arrow-key rule, so it lives once here rather than twice in the component.
 * Clamped, never wraps: the same rule LayersPanel's roving tabindex takes,
 * and the reason is the same one — a wrapped Home/End reads as a bug the
 * first time a visitor lands on an edge and arrows past it.
 */

/** Given the active index, how many tabs there are, and a keydown's `key`,
    the index that key asks to move to — or null if the key is not a tab
    navigation key at all, so the caller knows to leave the event alone. */
export function tabStep(current: number, length: number, key: string): number | null {
  if (length <= 0) return null
  switch (key) {
    case 'ArrowLeft':
      return Math.max(0, current - 1)
    case 'ArrowRight':
      return Math.min(length - 1, current + 1)
    case 'Home':
      return 0
    case 'End':
      return length - 1
    default:
      return null
  }
}
