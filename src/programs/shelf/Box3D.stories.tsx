import type { Meta, StoryObj } from '@storybook/react'
import { Box3D } from './Box3D'
import styles from './shelf.module.css'

/* Box3D is the shelf's cuboid primitive: six absolutely-positioned faces in
   one preserve-3d context, a Motion flip (front↔back) and a cursor-pressure
   tilt+pop on fine pointers. It takes real React nodes for `front`/`back` —
   Box3D.tsx's own doc comment is explicit that they "must carry `.face`
   styling itself" (position, backface-visibility, the board material), so
   these placeholders reuse the real `.face` class from shelf.module.css
   rather than approximating it — that class also reads `--board` etc. off
   `.plinth`, which Box3D's own root sets, so the cardboard material renders
   for free even on a placeholder.

   `fine` is NOT read internally here — Box3D takes it as a prop, set once by
   the shelf via the exported `useFinePointer()` hook (a media-query read,
   not a per-box hook call). Storybook can't fake `(hover: hover) and
   (pointer: fine)` on a per-story basis, so these stories pass `fine`
   directly as a control instead of calling the hook — which is exactly the
   contract Box3D itself expects (see Box3D.tsx's JSDoc on the prop). With a
   real mouse over the canvas and `fine: true`, the tilt/pop is genuinely
   live in these stories, not just described. */

function PlaceholderFace({ label }: { label: string }) {
  return (
    <div
      className={styles.face}
      style={{
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--display)',
        fontSize: 22,
        color: 'var(--content)',
      }}
    >
      {label}
    </div>
  )
}

const meta = {
  title: 'Shelf/Box3D',
  component: Box3D,
  argTypes: {
    flipped: { control: 'boolean' },
    fine: {
      control: 'boolean',
      description: 'Hover-capable, fine-pointer machine — measured once by the shelf via useFinePointer(). Off = no tilt/pop, matches touch.',
    },
  },
  args: {
    front: <PlaceholderFace label="FRONT" />,
    back: <PlaceholderFace label="BACK" />,
    flipped: false,
    fine: true,
  },
} satisfies Meta<typeof Box3D>

export default meta
type Story = StoryObj<typeof meta>

/* At rest, front showing. `fine: true` is the default arg above — move a
   real mouse over the box in the canvas to see the cursor-pressure tilt and
   the 38px pop toward the camera (both driven by springs in Box3D.tsx,
   SPRINGS.window). Reduced-motion users get the flattened fallback
   automatically (useReducedMotion inside the component). */
export const Resting: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Hover with a mouse to see the live tilt/pop affordance — it is not simulated, it is the real pointer handler.',
      },
    },
  },
}

/* The back panel, turned over — the Motion flip (SPRINGS.deck) that
   Box3D drives whenever `flipped` changes. */
export const Flipped: Story = {
  args: { flipped: true },
}

/* Coarse pointer / touch: `fine: false` turns the tilt/pop off entirely —
   `enter`/`move` bail immediately (Box3D.tsx) — leaving only the flip. This
   is the state every box is in on a touch device. */
export const CoarsePointer: Story = {
  args: { fine: false },
}
