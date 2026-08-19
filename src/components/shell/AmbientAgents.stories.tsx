import type { Meta, StoryObj } from '@storybook/react'
import type { CSSProperties, ReactNode } from 'react'
import { DeskStage } from '@/design-system/storyHarness'
import { useWindows } from '@/store/windows'
import { AmbientAgents } from './AmbientAgents'

/* THE CREW, OFF DUTY. Two behaviours in one component, both decorative and
   both aria-hidden — every fact they mutter is spelled out in text inside
   COMMAND.CTR.

   HATCHES: a hole opens on a bare patch of desk, one unit climbs halfway
   out, stands there, turns, says a line, and drops back through the same
   hole. Then the hole closes. They used to walk the bottom edge and walked
   straight into the dock rail; nobody commutes now.

   FLASHES: opening a window summons the responsible unit beside its titlebar
   for about two seconds.

   IT TAKES NO PROPS AND READS TWO STORES — settings for the skin (each unit's
   avatar has a medieval cut) and the windows store, which it subscribes to
   directly rather than through a hook, since it wants the transition and not
   the value. The harness resets both per story, and clears the already-met
   list, so the introduction is available again in every story here rather
   than only the first one you happen to open.

   THE ONE THING THE STAGE HAS TO PROVIDE IS A DESK. The component asks the
   document for `[data-desktop-root]`, measures it, and then asks
   `elementFromPoint` whether the patch it rolled is bare — which is how it
   keeps off icons, widgets and windows without being told where any of them
   are. On the real desk that root is the shell's `<main>`; here it is the
   box below. Give it nothing to stand on and nothing surfaces, which is
   itself the correct behaviour and the subject of the last story. */

/** the stage, dressed as a desk: the root the component measures, and the
    layer whose bare pixels count as "there is room here". */
function Desk({ children }: { children: ReactNode }) {
  return (
    <DeskStage height={460}>
      <div data-desktop-root="" data-desk-layer="" style={{ position: 'absolute', inset: 0 }}>
        {children}
      </div>
    </DeskStage>
  )
}

const meta = {
  title: 'Shell/AmbientAgents',
  component: AmbientAgents,
  parameters: {
    layout: 'fullscreen',
    /* NOT SNAPSHOTTED. Where a unit surfaces, when it surfaces, which
       unit it is and what it says are all rolled at runtime, and between
       visits there are four to nine seconds of bare desk — a Chromatic
       frame of this catches a different picture every run, including an
       empty one. The catalog entry is still live and playable; it is the
       diff that has nothing to compare. The dispatch flash below drives
       itself from the store and IS snapshotted. */
    chromatic: { disableSnapshot: true },
  },
  render: () => (
    <Desk>
      <AmbientAgents />
    </Desk>
  ),
} satisfies Meta<typeof AmbientAgents>

export default meta
type Story = StoryObj<typeof meta>

/* A UNIT ON SHIFT. The hatch takes about a quarter second to open, the climb
   lands a beat later, and the whole visit is five to nine seconds: stand,
   turn, say something, drop. Four to nine seconds of bare desk, then the next
   unit surfaces somewhere else — leave the story open a minute and the whole
   crew comes through, never twice in the same place.

   MOVE A CURSOR AT ONE. The first time you find a given unit they turn and
   introduce themselves — name, model, and the last task they took on — and
   that handshake is remembered in localStorage. After it, coming close buys
   a startled hop, and coming close again sends them down the hatch
   mid-sentence in `--accent-expressive`, which is the one place colour
   carries meaning in this component.

   REDUCED MOTION RENDERS NOTHING HERE. The crew are unambiguously decoration,
   so `prefers-reduced-motion` does not slow them down or fade them in: the
   cycle returns early and no hatch is ever opened. Flashes still work,
   because a card appearing for two seconds is not motion sickness. It gets no
   story of its own because there would be nothing in the frame and nothing to
   compare — set the OS preference, reload the canvas, and this story goes
   quiet. The component reads useReducedMotion itself and there is no prop to
   lie to it with. */
export const OnShift: Story = {
  name: 'On shift',
}

/* MEDIEVAL. Same hatch, same lines, different cut of avatar — the mask URL is
   picked per skin (avatarFor), so the unit is redrawn rather than recoloured.
   The hatch itself is drawn from the skin's own ink and surface, so it comes
   along without a second definition. */
export const Medieval: Story = {
  globals: { theme: 'medieval' },
}

/* A CROWDED DESK. The blocks below are furniture — an icon column, a widget,
   a rail across the bottom — and none of them tell the component anything.
   It rolls a point, probes seven places around the footprint (hatch,
   shoulders, head), and takes the spot only if every one of them answers
   with bare desk. So hatches open in the gaps, never on the blocks, and the
   moment the desk fills up the crew simply stops appearing. That is the
   whole fix for walking into the dock, and this is the story that proves
   it. */
export const CrowdedDesk: Story = {
  name: 'Crowded desk',
  render: () => (
    <Desk>
      <Block style={{ left: 24, top: 24, width: 96, height: 300 }} />
      <Block style={{ right: 40, top: 60, width: 220, height: 120 }} />
      <Block style={{ left: '50%', bottom: 0, width: 380, height: 56, transform: 'translateX(-50%)' }} />
      <AmbientAgents />
    </Desk>
  ),
}

function Block({ style }: { style: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        background: 'color-mix(in srgb, var(--content) 8%, transparent)',
        border: 'var(--border-width-default) solid var(--border)',
        ...style,
      }}
    />
  )
}

/* A DISPATCH FLASH. The story opens README in the windows store, which is the
   exact transition the component subscribes to; the responsible unit appears
   beside where that window would sit, says what it does, and clears itself
   after 1.9 seconds. No window is drawn here — the flash is answering the
   store, not the frame, and this is the cheapest possible proof of that. (On
   the real desk that same report does one more thing: if a unit happens to be
   standing where the new window will land, it ducks instead of being papered
   over.)

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
  parameters: { chromatic: { disableSnapshot: false } },
  play: async () => {
    await new Promise((r) => setTimeout(r, 300))
    useWindows.getState().setInitial([])
    await new Promise((r) => setTimeout(r, 100))
    useWindows.getState().open('readme')
    await new Promise((r) => setTimeout(r, 300))
  },
}
