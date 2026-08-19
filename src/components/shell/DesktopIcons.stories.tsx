import type { Meta, StoryObj } from '@storybook/react'
import { DeskStage } from '@/design-system/storyHarness'
import { DesktopIcons } from './DesktopIcons'

/* THE LAUNCHER. On a desktop it is one door: README. Everything else that
   used to sit on the desk moved to the dock rail along the bottom, and the
   grid kept the one program that is an introduction rather than a tool.

   It reads three stores and takes no props — the windows store to open a
   program, the shelf-mode store because WORK opens no window at all (it brings
   the shelf up on the desk instead), and settings for the skin, because
   program names are skin vocabulary. All three are seeded by the harness, so
   the buttons here are live: press README and the windows store really opens
   it, press WORK on the mobile story and SHELF.MODE really comes on. Nothing
   draws the window, so what you see is the launcher doing its half of the job.

   THE MOBILE GRID IS THE INTERESTING ONE. The dock does not render below
   720px, so the docked programs are rendered here too and hidden by CSS above
   that width — same mechanism the trash icon has always used. Nothing renders
   twice: at any given width exactly one copy of each program is on screen. A
   media query cannot reach into JSX to exclude an id, which is why the
   duplication exists at all, and the story below is the proof that it costs
   nothing. */

const meta = {
  title: 'Shell/DesktopIcons',
  component: DesktopIcons,
  parameters: { layout: 'fullscreen' },
  render: () => (
    <DeskStage height={300}>
      <DesktopIcons />
    </DeskStage>
  ),
} satisfies Meta<typeof DesktopIcons>

export default meta
type Story = StoryObj<typeof meta>

/* The desk as it ships: one door, top left, under the menu bar's line. The
   rest of the grid is present in the DOM and display:none — inspect the nav
   and you will find the docked programs and the trash sitting there waiting
   for a narrow screen. */
export const OneDoor: Story = {
  name: 'One door',
}

/* Under 720px the dock stands down and its programs reappear in the grid, in
   the rail's own reading order, with trash at the end. This is the launcher a
   phone gets — and it is the same component, the same nav, the same buttons.

   The grid starts at 118px on mobile to clear the nameplate that takes the
   band above it; the stage here has no nameplate in it, so that gap is empty
   space rather than a mistake. */
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    stores: { openWindows: [] },
  },
  render: () => (
    <DeskStage height={620}>
      <DesktopIcons />
    </DeskStage>
  ),
}

/* Medieval renames the programs rather than redrawing them. The labels come
   from the skin vocabulary (programName), the glyphs from Icon's medieval
   path set, and both switch off the same data-skin the theme toolbar writes.
   Flip the toolbar on any story here and this is what happens; it gets its own
   entry so the two namings can be read side by side. */
export const MedievalVocabulary: Story = {
  name: 'Medieval vocabulary',
  globals: { theme: 'medieval' },
}
