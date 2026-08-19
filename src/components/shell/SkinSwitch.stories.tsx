import type { Meta, StoryObj } from '@storybook/react'
import { SkinSwitch } from './SkinSwitch'

/* THE SKIN SWITCH — the control that trails the wordmark, shows which skin is
   running and flies out to offer the rest.

   THE REASON IT IS IN THE CATALOG AT ALL is the menu. Each row carries its own
   `data-skin`, and because the generated tokens are scoped by that attribute,
   the MEDIEVAL row re-scopes surface, accent and the display face for its own
   subtree. So the row is genuinely parchment and vermilion in its own
   typeface — a live preview built out of the token system, not a picture of
   one. Open the menu in any theme and the rows do not change: each one is
   always itself. That is the whole demonstration.

   Underwater has no token scope yet, so it stays disabled and reads SOON. A
   real state of a shipping control, not a placeholder.

   The active skin comes from the settings store, which the harness seeds off
   the theme toolbar — so flipping the toolbar to Medieval moves the check to
   the medieval row and relabels the trigger, same as pressing it would.

   THE OPEN STATE HAS NO PROP. Whether the flyout is up is local useState
   inside the component, and decoupling it would mean editing a shipping
   control to make a catalog easier, which is backwards. So the open stories
   press the trigger the visitor presses — a plain DOM click in a play
   function, no test library, since the catalog has none installed. */

const meta = {
  title: 'Shell/SkinSwitch',
  component: SkinSwitch,
} satisfies Meta<typeof SkinSwitch>

export default meta
type Story = StoryObj<typeof meta>

/** Press the real trigger. The menu opens on SPRINGS.deck, so give the flyout
    a beat to land before anything downstream reads the frame. */
const openMenu = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const trigger = canvasElement.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')
  trigger?.click()
  await new Promise((r) => setTimeout(r, 400))
}

/* Closed. A chip with a dot, the running skin's name and a caret — the same
   frame INSPECT wears at the other end of the bar, so the two controls
   bracketing the menu bar read as one family. */
export const Closed: Story = {}

/* Open. Three rows, each in its own skin: classic in system ink, medieval in
   parchment under its display face, underwater dimmed with SOON where the
   check would go. The caret has turned and aria-expanded is true.

   Reduced-motion readers get the same menu on a plain opacity fade — the
   component reads useReducedMotion itself, so switch the OS setting and reload
   the canvas to see it. */
export const Open: Story = {
  play: openMenu,
}

/* The same menu with medieval running: the check moves and the trigger
   relabels, but every row still wears its own skin. The preview does not
   follow the active skin, which is what makes it a preview. */
export const MedievalRunning: Story = {
  name: 'Medieval running',
  globals: { theme: 'medieval' },
  play: openMenu,
}
