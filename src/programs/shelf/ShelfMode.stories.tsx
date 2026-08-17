import type { Meta, StoryObj } from '@storybook/react'
import { ShelfMode } from './ShelfMode'
import shell from '@/components/shell/shell.module.css'

/* SHELF.MODE — the shelf as a mode of the desk (Jake's "Hide Others"
   ruling; the mechanism is in ShelfMode.tsx). Pressing WORK opens no
   window: the desk recedes on the shelf's own 980px camera and all four
   boxes come up on a plank that spans the screen.

   TWO THINGS MAKE THIS STORYABLE AT ALL, and both are worth knowing before
   you edit it:

   1. The mode is `position: fixed` over the desk. A story frame cannot
      contain a fixed layer — unless an ancestor carries a transform, which
      makes it the containing block. `translateZ(0)` on the mock desk below
      is doing exactly that, so the whole mode renders INSIDE the canvas
      instead of taking over the Storybook chrome. It costs nothing: the
      boxes' own 3D lives under `.row`'s perspective, which is its own
      rendering context and does not care what is above it.

   2. The recede is not simulated. `.deskLayer` + `data-shelf-mode` are the
      real class and the real attribute off shell.module.css, so what you
      see receding here is the rule that ships. Flip `receded` off to see
      the transform's actual contribution: same plank, desk left where it
      stood.

   The row measures ITSELF (ResizeObserver in ShelfMode.tsx) — so the
   Narrow story is not a different component or a breakpoint, it is the
   same shelf in a smaller room, scaling rather than scrolling, which is
   the ruling this whole mode exists to keep. */

function MockDesk({ receded, width, children }: { receded: boolean; width: number | string; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        height: 720,
        /* the containing block for the mode's fixed layer — see (1) above */
        transform: 'translateZ(0)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      <div className={shell.desktop} data-shelf-mode={receded ? 'on' : 'off'} style={{ position: 'absolute' }}>
        <div className={shell.deskLayer}>
          {/* a desk with something on it, so the recede has a subject */}
          <div
            style={{
              position: 'absolute',
              left: 60,
              top: 40,
              width: 380,
              height: 280,
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              padding: 12,
              fontFamily: 'var(--display)',
              color: 'var(--content)',
            }}
          >
            README
          </div>
          <div
            style={{
              position: 'absolute',
              right: 80,
              top: 180,
              width: 320,
              height: 320,
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              padding: 12,
              fontFamily: 'var(--display)',
              color: 'var(--content)',
            }}
          >
            FAMILY HUB
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

const meta = {
  title: 'Shelf/ShelfMode',
  component: ShelfMode,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    receded: {
      control: 'boolean',
      description:
        'The desk behind: on = the shipped recede (perspective(980px) translateZ(-62.55px) + 0.3), off = the same plank over a desk that never moved.',
    },
    width: { control: 'text', description: 'How wide the room is. Under 1160px the row scales rather than scrolls.' },
  },
  args: { receded: true, width: '100%' },
  render: ({ receded, width }: { receded: boolean; width: number | string }) => (
    <MockDesk receded={receded} width={width}>
      <ShelfMode />
    </MockDesk>
  ),
} satisfies Meta<{ receded: boolean; width: number | string }>

export default meta
type Story = StoryObj<typeof meta>

/* The shipped moment: four boxes on a plank that spans the desk, the desk
   itself 62.55px further from the same camera the hover pop travels
   toward. Hover a box — the tilt and the 38px pop are live here, and on a
   desk they have the whole room to grow into (no clipping edge). */
export const OnTheDesk: Story = {}

/* The plank with the recede switched off. Not a state the mode can be in —
   it is here to show what the desk contributes, which is the half of the
   effect nobody sees because it happens behind the thing they are looking
   at. */
export const DeskAtRest: Story = {
  args: { receded: false },
}

/* 1000px of room against the 1160 the shelf wants at full size, so
   `--deck-scale` lands near 0.85 and every box metric follows it. All four
   boxes are still in frame, which is the point: on a desk the shelf never
   scrolls (Jake overturned the s39b "always cut a box" ruling to get
   here). */
export const Narrow: Story = {
  args: { width: 1000 },
}
