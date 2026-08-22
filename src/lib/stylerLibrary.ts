/* THE LIBRARY'S LIST — what /styler puts on a shelf, and nothing about how
 * it draws.
 *
 * STYLER only had one door for its first three rounds: arm INSPECT, find an
 * instance of the component on the desktop, pick it, then take the chip in
 * the inspector's foot. That is the right door when you are already looking
 * at the thing. It is the wrong one when you know which component you want,
 * because it asks you to go hunting the desktop for a stamp before the tool
 * will show you a stamp.
 *
 * So the library is the second door, and this file is the half of it that a
 * node harness can read. It holds NO JSX and imports nothing that touches
 * the DOM, for the same reason styleCandidates.ts and stylerBlocks.ts hold
 * none: the thing worth testing here is the LIST — every promoted component
 * on the shelf, each one opening on a variant the stage can actually draw —
 * and a list that can only be checked by rendering React is a list nobody
 * checks.
 *
 * WHY `variant` IS A NUMBER AND NOT A NODE. The recipes live in
 * stageSpecs.tsx (JSX over five real components) and they take a skin, so
 * the thumbnail cannot be resolved here. What CAN be decided here is WHICH
 * of a spec's variants a card opens on, and the answer is the first one:
 * every spec is authored with its plainest state at the head — button's
 * SYSTEM before EXPRESSIVE, window's ACTIVE before RESTING — so index 0 is
 * already the "this is what it looks like" variant, and a second ordering
 * rule for the library would be a second thing to keep in sync with the
 * specs. The card reads this index rather than writing 0 itself, so the
 * choice is stated once and the test can hold it.
 */

import { COMPONENT_IDS, type ComponentId } from './styleCandidates'
import { flattenLayers, layersFor, rowsFor } from './stylerBlocks'

export type LibraryEntry = {
  id: ComponentId
  /** which of the spec's variants the card draws (see above) */
  variant: number
  /** how many nodes the declared anatomy has, root included */
  layers: number
  /** how many properties the component declares */
  tokens: number
}

/** Every promoted component, in COMPONENT_IDS order, with the two counts a
    card prints under the picture. The order is the ids' own: alphabetical,
    which is the order a person scanning a shelf for a name expects, and it
    costs nothing to keep because that is how the pilot list is written. */
export function libraryEntries(): LibraryEntry[] {
  return COMPONENT_IDS.map((id) => ({
    id,
    variant: 0,
    layers: flattenLayers(layersFor(id)).length,
    tokens: rowsFor(id).length,
  }))
}
