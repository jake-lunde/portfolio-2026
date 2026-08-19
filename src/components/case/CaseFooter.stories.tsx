import type { Meta, StoryObj } from '@storybook/react'
import { CaseFooter } from './CaseFooter'

/* THE FOOT OF A CASE STUDY. Two doors, and that is the whole component: the
   next project, and the way back to all the work.

   ONE DOOR IN, NOT A FLAT INDEX (session 25). "All work" opens no window — it
   brings SHELF.MODE up over the case the reader is standing in, and Escape
   puts them back on the page they were reading. That is a shelf-mode store
   call, not a link, which is why the footer needed the harness to be
   catalogued: press the button in any story here and the store really flips,
   even though nothing in the canvas draws the shelf.

   The next-project button is prop-driven and has two states. `live` with a
   `slug` prints an arrow and opens the case; anything else is disabled and
   prints "· soon". Both are real states of a shipping site — two of the four
   cases have not been written yet, and the foot of a case has to say so
   without apologising. */

const meta = {
  title: 'Case Study/CaseFooter',
  component: CaseFooter,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '10px 30px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    next: {
      control: 'object',
      description:
        'The case after this one. `live` plus a `slug` makes the button a door; without both it is disabled and reads soon.',
    },
  },
  args: { next: { name: 'Family Hub', live: true, slug: 'family-hub' } },
} satisfies Meta<typeof CaseFooter>

export default meta
type Story = StoryObj<typeof meta>

/* Both doors open. Press "Next project" and the windows store opens the case;
   press "All work" and SHELF.MODE comes on. Neither draws anything here — the
   footer's job is to ask, and something else answers. */
export const NextIsLive: Story = {
  name: 'Next is live',
}

/* The next case is not written yet. The button goes disabled and the label
   swaps the arrow for "· soon" — the reader is told what is coming rather
   than handed a door that opens on nothing. "All work" is unaffected, so the
   foot of an unwritten-neighbour case still leads somewhere. */
export const NextIsSoon: Story = {
  name: 'Next is soon',
  args: { next: { name: 'Interview Pipeline', live: false } },
}

/* A live case whose slug is missing — the same disabled treatment, from the
   other half of the test. Worth having in the catalog because the two
   conditions are separate fields in cases.ts and either one on its own is
   enough to close the door. */
export const NextHasNoSlug: Story = {
  name: 'Next has no slug',
  args: { next: { name: 'Tooling', live: true } },
}

/* SHELF.MODE already up. Nothing in the footer changes, and that is the point:
   the mode is a fact about the desk, not about the page under it, so pressing
   "All work" while it is already on is a no-op the store swallows rather than
   a second entrance. */
export const ShelfAlreadyUp: Story = {
  name: 'Shelf already up',
  parameters: { stores: { shelfMode: true } },
}
