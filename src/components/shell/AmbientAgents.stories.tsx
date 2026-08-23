import type { Meta, StoryObj } from '@storybook/react'
import type { CSSProperties, ReactNode } from 'react'
import { DeskStage } from '@/design-system/storyHarness'
import { useWindows } from '@/store/windows'
import { AmbientAgents } from './AmbientAgents'

/* SEEDED DICE. The real desk rolls Math.random(); mulberry32 gives the
   catalog the same numbers every run, from a plain 32-bit integer seed —
   the smallest PRNG that doesn't need a dependency. Nothing here actually
   consumes it (see PINNING A FRAME below), but the `rng` prop is part of
   the component's contract now, and passing Math.random into a story
   Chromatic diffs would be the bug this whole task existed to fix. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const seededRng = mulberry32(1992)

/* PINNED FOR CHROMATIC. Every story below except Dispatch Flash renders
   through `frame` (AmbientAgents.tsx, "PINNING A FRAME") — a forced
   phase/spot/agent/bubble that skips the timer chain and the dice
   entirely, so the same pixels land on every run. `upFrame` is the one
   shape all three want (a unit standing, mid-line); each story only
   picks who and what they're saying. */
const upFrame = (agent: string, bubble: string) => ({
  phase: 'up' as const,
  spot: { x: 220, y: 200, face: 1 as const, align: 'center' as const },
  agent,
  bubble,
})

/* THE CREW, OFF DUTY. Two behaviours in one component, both decorative and
   both aria-hidden — every fact they mutter is spelled out in text inside
   COMMAND.CTR.

   HATCHES: a hole opens on a bare patch of desk, one unit climbs halfway
   out, stands there, turns, says a line, and drops back through the same
   hole. Then the hole closes. They used to walk the bottom edge and walked
   straight into the dock rail; nobody commutes now.

   FLASHES: opening a window summons the responsible unit beside its titlebar
   for about two seconds.

   ON THE REAL DESK IT TAKES NO PROPS. `rng` and `frame` exist only for this
   catalog (s88 follow-ups, task 3) — a seeded generator so the dice roll the
   same way twice, and a forced phase/spot/agent/bubble that skips the dice
   and the timer chain outright, which is the only way to promise Chromatic
   the same pixels on every run. Below that it still reads two stores —
   settings for the skin (each unit's avatar has a medieval cut) and the
   windows store, which it subscribes to directly rather than through a
   hook, since it wants the transition and not the value. The harness resets
   both per story, and clears the already-met list, so the introduction is
   available again in every story here rather than only the first one you
   happen to open.

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
  args: { rng: seededRng },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <Desk>
      <AmbientAgents {...args} />
    </Desk>
  ),
} satisfies Meta<typeof AmbientAgents>

export default meta
type Story = StoryObj<typeof meta>

/* A UNIT ON SHIFT, mid-line. On the real desk the hatch takes about a
   quarter second to open, the climb lands a beat later, and the whole
   visit is five to nine seconds: stand, turn, say something, drop, with
   four to nine seconds of bare desk before the next one surfaces
   somewhere else, never twice in the same place — the header comment
   above has the whole mechanic. This story pins the one frame worth
   diffing (standing, talking) rather than any of the timing around it.

   MOVE A CURSOR AT ONE, on the real desk. The first time you find a
   given unit they turn and introduce themselves — name, model, and the
   last task they took on — and that handshake is remembered in
   localStorage. After it, coming close buys a startled hop, and coming
   close again sends them down the hatch mid-sentence in
   `--accent-expressive`, which is the one place colour carries meaning
   in this component. None of that is reachable through a pinned frame;
   it needs a live cycle and a cursor, which is what the real desk is for.

   REDUCED MOTION RENDERS NOTHING ON THE REAL DESK — `prefers-reduced-motion`
   returns the cycle early rather than slowing it down. A pinned frame
   renders regardless (see AmbientAgents.tsx), which is correct here: the
   catalog entry is proving the art and copy exist, not re-litigating
   motion preference. */
export const OnShift: Story = {
  name: 'On shift',
  args: { frame: upFrame('fable', 'DISPATCHING. STAND BY.') },
}

/* MEDIEVAL. Same frame, same line, different cut of avatar — the mask URL is
   picked per skin (avatarFor), so the unit is redrawn rather than recoloured.
   The hatch itself is drawn from the skin's own ink and surface, so it comes
   along without a second definition. */
export const Medieval: Story = {
  globals: { theme: 'medieval' },
  args: { frame: upFrame('fable', 'DISPATCHING. STAND BY.') },
}

/* A CROWDED DESK. The blocks below are furniture — an icon column, a widget,
   a rail across the bottom — and none of them tell the component anything.
   findSpot rolls a point, probes ten places around the footprint (hatch,
   shoulders, head), and takes the spot only if every one of them answers
   with bare desk. So on the real desk hatches open in the gaps, never on
   the blocks, and the moment the desk fills up the crew simply stops
   appearing — that is the whole fix for walking into the dock. This story
   pins its own frame in the one gap all three blocks leave clear (x:220,
   y:200 misses the left column, the top-right widget and the bottom rail
   at every viewport width DeskStage renders), rather than re-proving the
   probe live on every Chromatic run. */
export const CrowdedDesk: Story = {
  name: 'Crowded desk',
  args: { frame: upFrame('nyquist', 'MOUNTING THE COMPONENT.') },
  render: (args) => (
    <Desk>
      <Block style={{ left: 24, top: 24, width: 96, height: 300 }} />
      <Block style={{ right: 40, top: 60, width: 220, height: 120 }} />
      <Block style={{ left: '50%', bottom: 0, width: 380, height: 56, transform: 'translateX(-50%)' }} />
      <AmbientAgents {...args} />
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
   no unit is dispatched. A flash follows a frame, and WORK has no frame.

   NO `frame` HERE — this story is testing the flash, not the hatch, and
   the hatch mechanic it inherits from meta.args (seeded rng, no cursor
   ever recorded) waits up to eight seconds for a first pointer event
   before it opens anything, well past this story's ~700ms play(). The
   crew simply never surfaces in frame. */
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
