import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { CASES } from '@/programs/projects/cases'
import { ShelfBox } from './ShelfBox'
import styles from './shelf.module.css'

/* ONE BOX ON THE SHELF. Front is Jake's box-art template — a cream ground,
   product photography feathering into it, a publisher mark and a type block
   standing on the bottom left. Back is the panel every 1992 carton had: an
   edition line, the name, a thesis, a three-row ledger standing on the foot
   under a solid accent rule, and the button.

   FOUR COVERS, FOUR REFERENCES OFF JAKE'S BOARD. `figma` is the soft comp he
   drew and nothing may drift from it; `stripe` is the Atari cartridge, brand
   zone and printed rainbow rules over hard-edged art; `catalog` is Photoshop
   5.5, a centred square plate on a light ground over a solid category bar;
   `nocturne` is the Electronic Arts game sleeve, black ground and the art in a
   framed vertical window. One composition in four moods was still one
   composition, which is the whole reason the variants exist.

   WHAT IT TAKES AND WHAT IT READS. Everything the box draws is a prop — the
   case, whether the pointer is fine, whether the tag is out, whether the
   launch layer is up — except the skin, which is a settings-store read
   (medieval prints its own vocabulary on the panel). The harness seeds that
   off the theme toolbar, which is the only reason this file exists: nothing
   in ShelfBox.tsx changed.

   THE BOX NEEDS ITS ROOM, AND THE ROOM IS FOUR NESTED ELEMENTS. `.wrap`
   declares the board's dimensions and the box-art faces, `.row` carries the
   980px camera, `.slot` carries preserve-3d and the plinth carries the rest.
   Drop the wrap and the box collapses to nothing (the width is a var it never
   inherits); drop any of the other three and the cuboid flattens into artwork.
   So these stories stand the box in the real chain rather than in a div,
   exactly the way Shelf.tsx does — which also means the row's 34/40px padding,
   the measured clearance for the hover pop, is doing its job here too.

   The tilt and the 38px pop are LIVE with a real mouse over the canvas
   (`fine: true`). Reduced-motion readers get the flattened stack; ShelfBox
   reads that itself. */

const SHIPPED = CASES.find((c) => c.status === 'live') ?? CASES[0]
const SOON = CASES.find((c) => c.status !== 'live') ?? CASES[CASES.length - 1]

/** The program root, the row and a slot — straight off shelf.module.css. */
function Shelf({ children }: { children: ReactNode }) {
  return (
    <div className={styles.wrap} style={{ height: 500 }}>
      <ul className={styles.row} data-shelf-stock="" data-shelf-row="">
        {children}
      </ul>
    </div>
  )
}

function Slot({ children }: { children: ReactNode }) {
  return (
    <li className={styles.slot} data-shelf-stock="">
      {children}
    </li>
  )
}

/* `revealed` is the shelf's business — one box at a time has its tag out, so
   the parent owns it. These stories own it the same way rather than pinning it
   to a boolean, so hovering the box in the canvas does what hovering it on the
   shelf does. */
function BoxOnShelf({
  slug,
  fine,
  overlayOpen,
  flipTag,
}: {
  slug: string
  fine: boolean
  overlayOpen: boolean
  flipTag: boolean
}) {
  const [revealed, setRevealed] = useState<string | null>(null)
  const c = CASES.find((x) => x.slug === slug) ?? CASES[0]
  return (
    <Shelf>
      <Slot>
        <ShelfBox
          c={c}
          fine={fine}
          revealed={revealed === c.slug}
          overlayOpen={overlayOpen}
          onReveal={setRevealed}
          onPlay={() => {}}
          flipTag={flipTag}
        />
      </Slot>
    </Shelf>
  )
}

/* NO `component` ON THE META, and it is the args that decide it. The stories
   drive a `slug` and let a wrapper own `revealed`, because that is how the
   shelf drives the box — pinning `revealed` to a boolean and handing over a
   whole CaseDef through the controls panel would be a different component
   than the one that ships. Storybook can have the type or the honest
   controls, not both, so the controls win and the props are documented in the
   argTypes below. Same shape CaseComponents.stories.tsx uses. */
const meta = {
  title: 'Shelf/ShelfBox',
  parameters: { layout: 'fullscreen' },
  argTypes: {
    slug: {
      control: 'select',
      options: CASES.map((c) => c.slug),
      description: 'Which case is in the box. The cover variant travels with it (cases.ts).',
    },
    fine: {
      control: 'boolean',
      description:
        'Hover-capable machine, measured once by the shelf via useFinePointer(). Off = no tilt, no pop — what every touch device gets.',
    },
    overlayOpen: {
      control: 'boolean',
      description:
        'The launch layer is up over the shelf. Every box under it reads a pointerleave it has to ignore, or a box turns itself back the moment the overlay covers it.',
    },
    flipTag: {
      control: 'boolean',
      description:
        'Draw the FLIP chip under the box. Off (the shipped setting), the cover itself becomes the announced control and carries the tab stop — PLAY is printed on the back panel, so a box with no way to turn from the keyboard is a case study with no way in.',
    },
  },
  args: { slug: SHIPPED.slug, fine: true, overlayOpen: false, flipTag: false },
  render: (args: { slug: string; fine: boolean; overlayOpen: boolean; flipTag: boolean }) => (
    <BoxOnShelf {...args} />
  ),
} satisfies Meta<{ slug: string; fine: boolean; overlayOpen: boolean; flipTag: boolean }>

export default meta
type Story = StoryObj<typeof meta>

/* A shipped box at rest, as the shelf ships it: no chip, the cover carrying
   the announcement. Hover it with a real mouse — the tilt follows the cursor
   and the box pops 38px toward the camera. Press it and it turns. */
export const Shipped: Story = {}

/* An unshipped box. `progress` in cases.ts is what tells the two apart, and
   the panel prints COMING SOON at the foot instead of PLAY. The meter, the
   phase line and the nudge-Jake button all went in pass 12: four registers
   spent apologising, where a carton would print two words and stop. */
export const ComingSoon: Story = {
  name: 'Coming soon',
  args: { slug: SOON.slug },
}

/* THE FLIP CHIP, drawn. One flag, kept so it can come back the day Jake wants
   it. With the chip on, the tag under the box is the announced control and the
   cover hands its tab stop back — the same apparatus either way, just a
   different thing wearing the label. */
export const WithFlipTag: Story = {
  name: 'With flip tag',
  args: { flipTag: true },
}

/* Coarse pointer. `fine: false` is what a phone gets: the tilt and pop
   handlers bail immediately, leaving the turn and the panel. The box is not a
   lesser box on touch, it is a still one. */
export const CoarsePointer: Story = {
  name: 'Coarse pointer',
  args: { fine: false },
}

/* THE FOUR COVERS. One box per variant, in the same row, at the same size —
   the comparison the variants were designed against, and the fastest way to
   see whether a fifth one would be a new idea or a repeat of one of these. */
export const EveryCover: Story = {
  name: 'Every cover',
  render: () => (
    <Shelf>
      {CASES.map((c) => (
        <Slot key={c.slug}>
          <ShelfBox
            c={c}
            fine
            revealed={false}
            overlayOpen={false}
            onReveal={() => {}}
            onPlay={() => {}}
            flipTag={false}
          />
        </Slot>
      ))}
    </Shelf>
  ),
}
