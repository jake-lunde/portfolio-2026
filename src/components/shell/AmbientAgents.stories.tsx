import type { Meta, StoryObj } from '@storybook/react'
import { DeskStage } from '@/design-system/storyHarness'
import { useWindows } from '@/store/windows'
import { AmbientAgents } from './AmbientAgents'

/* THE CREW, OFF DUTY. Two behaviours in one component, both decorative and
   both aria-hidden — every fact they mutter is spelled out in text inside
   COMMAND.CTR.

   WANDERER: one unit strolls the bottom edge of the desk, stops to inspect
   something, says a line, and bolts if your cursor gets too close. The first
   time your cursor finds a given unit they do not bolt — they stop, turn and
   introduce themselves, name their model and say what they last worked on,
   because nobody should have to guess what these things are. After the
   handshake that unit reverts to startle-then-flee, and the introduction is
   remembered across visits in localStorage.

   FLASHES: opening a window summons the responsible unit beside its titlebar
   for about two seconds.

   IT TAKES NO PROPS AND READS TWO STORES — settings for the skin (each unit's
   avatar has a medieval cut) and the windows store, which it subscribes to
   directly rather than through a hook, since it wants the transition and not
   the value. The harness resets both per story, and clears the
   already-met list, so the introduction is available again in every story
   here rather than only the first one you happen to open.

   NOTHING IN THE COMPONENT CHANGED FOR THESE STORIES. The one thing the stage
   provides is a bounded desk to walk along: the walker is positioned against
   the desktop, and the flee maths reads the real pointer against the real
   viewport, so the stories run full-bleed and give it a room rather than a
   box. Move a mouse toward the unit down there — the startle and the bolt are
   live, not described. */

const meta = {
  title: 'Shell/AmbientAgents',
  component: AmbientAgents,
  parameters: { layout: 'fullscreen' },
  render: () => (
    <DeskStage height={420}>
      <AmbientAgents />
    </DeskStage>
  ),
} satisfies Meta<typeof AmbientAgents>

export default meta
type Story = StoryObj<typeof meta>

/* A unit on shift. They walk at 26px/s, pause every 140–360px to inspect, and
   the speech bubble comes and goes on its own timer. When one walks off the
   edge they clock out and the next unit enters from the same wing five seconds
   later, so leave the story open a minute and the whole crew comes through.

   REDUCED MOTION RENDERS NOTHING HERE. The wanderer is unambiguously
   decoration, so `prefers-reduced-motion` does not slow it down or fade it in:
   the walk loop returns early and the unit is never mounted. Flashes still
   work, because a card appearing for two seconds is not motion sickness. It
   gets no story of its own because there would be nothing in the frame and
   nothing to compare — set the OS preference, reload the canvas, and this
   story goes quiet. The component reads useReducedMotion itself and there is
   no prop to lie to it with. */
export const OnShift: Story = {
  name: 'On shift',
}

/* Medieval. Same walk, same lines, different cut of avatar — the mask URL is
   picked per skin (avatarFor), so the unit is redrawn rather than recoloured.
   The flee state still flips the mask's ink to --accent-expressive, which is
   the one place in this component colour carries meaning, and it is carrying
   it alongside a shape change rather than alone. */
export const Medieval: Story = {
  globals: { theme: 'medieval' },
}

/* A DISPATCH FLASH. The story opens README in the windows store, which is the
   exact transition the component subscribes to; the responsible unit appears
   beside where that window would sit, says what it does, and clears itself
   after 1.9 seconds. No window is drawn here — the flash is answering the
   store, not the frame, and this is the cheapest possible proof of that.

   TWO THINGS THIS STORY LEARNED THE HARD WAY, both of them facts about the
   machine rather than about the catalog:

   The setInitial call is not decoration. The subscriber treats the first thing
   it hears as the state of the world rather than as news, so whatever is
   already open when it wakes up gets no flash. On the desk that first report
   is Desktop.tsx handing over the windows the URL asked for; here it is the
   same call with nothing in it.

   And the program has to be one that resolves to a window. WORK is the
   counter-example: it keeps a registry entry for its icon and its deep link
   and opens a mode of the desk instead, so resolveWindow hands back null and
   no unit is dispatched. A flash follows a frame, and WORK has no frame. */
export const DispatchFlash: Story = {
  name: 'Dispatch flash',
  play: async () => {
    await new Promise((r) => setTimeout(r, 300))
    useWindows.getState().setInitial([])
    await new Promise((r) => setTimeout(r, 100))
    useWindows.getState().open('readme')
    await new Promise((r) => setTimeout(r, 300))
  },
}
