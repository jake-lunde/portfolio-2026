import type { Meta, StoryObj } from '@storybook/react'
import { DeskStage } from '@/design-system/storyHarness'
import { MenuBar } from './MenuBar'

/* THE MENU BAR — the machine's chrome, and the one surface that is up in
   every skin, on every screen, whatever program is running. Five controls
   between the wordmark and the clock: the skin switch, INSPECT, sound, theme,
   the design-system door, COMMAND.CTR and FABLE.

   IT TAKES NO PROPS. Every piece of state it draws is a store read — sound
   and theme and skin from settings, the pressed state of INSPECT from the
   inspect store — which is exactly what kept it out of the catalog until the
   harness landed. Nothing in MenuBar.tsx changed to get these stories; the
   stories seed the stores it was already reading.

   TWO THINGS THE STAGE IS DOING, both worth knowing before editing:

   1. The bar is `position: fixed`. A story canvas cannot hold a fixed layer
      unless an ancestor carries a transform, which DeskStage does — so the
      bar renders inside the frame instead of pinning itself across the
      Storybook chrome. Same trick ShelfMode.stories.tsx uses for the shelf.

   2. MenuBar calls the settings store's hydrate() on mount, which reads the
      skin and theme back off <html>. The theme toolbar wrote them there, so
      hydrate agrees with the harness rather than fighting it — the bar in the
      catalog reads its skin the same way the bar on the desk does.

   The theme button is deliberately missing outside classic: medieval and
   underwater have one mode each, and MenuBar branches on that in JS
   (`skin === 'classic'`). Flip the toolbar to Medieval to see the gap. */

const meta = {
  title: 'Shell/MenuBar',
  component: MenuBar,
  parameters: { layout: 'fullscreen' },
  render: () => (
    <DeskStage height={320}>
      <MenuBar />
    </DeskStage>
  ),
} satisfies Meta<typeof MenuBar>

export default meta
type Story = StoryObj<typeof meta>

/* The bar as a visitor first meets it: sound on, nothing inspecting, no
   program open. Every control here is live — press the note, press INSPECT,
   hover COMMAND.CTR's glyph — and the harness puts the machine back the way
   it found it when you move to the next story. */
export const Default: Story = {}

/* Sound off. The note takes a slash and aria-pressed goes false; nothing about
   the state is carried by colour, which is the rule the glyph pair exists to
   keep (Jake, s44: the three-letter names went, the meaning stayed). */
export const Muted: Story = {
  parameters: { stores: { sound: false } },
}

/* INSPECT.MODE running. The chip flips to its accent-ink pressed treatment
   (.inspectBtn[aria-pressed] in shell.module.css) and the hover hint stands
   down — while the tool is up its own header explains it, so a second copy of
   the sentence under the chip would be one explanation too many. */
export const Inspecting: Story = {
  parameters: { stores: { inspect: true } },
}

/* COMMAND.CTR's deck already open. The LED and the glyph stay, but the hover
   popover is suppressed: `deckOpen` is a read of the windows store, so a story
   that opens the window gets the real suppression rather than a described one.
   Hover the nodes glyph to prove nothing comes up. */
export const DeckOpen: Story = {
  name: 'Command deck open',
  parameters: { stores: { openWindows: ['command'] } },
}
