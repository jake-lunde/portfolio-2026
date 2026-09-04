import type { Meta, StoryObj } from '@storybook/react'
import { CaseRating } from './CaseRating'

/* FIVE STARS AT THE FOOT OF A CASE. The reader presses one, the press goes
   to /api/rating, and the average comes back.

   THE AVERAGE IS HIDDEN UNTIL THE PRESS. A number sitting over an empty row
   of stars tells the reader what to think before they have thought it, so
   the readout only turns up once they have voted. That also means the whole
   idle state of this component is five muted stars and one line of mono, and
   there is nothing else to draw.

   NO API HERE. Storybook has no /api/rating to answer, so every fetch in the
   canvas fails and the component swallows it: the stars still fill, the
   eyebrow still swaps to THANKS, and the readout never appears. That is the
   same path a visitor gets when the network drops, which makes this catalog
   entry the offline test as much as the visual one.

   Nothing tweens. Hover fills up to the star under the cursor and leaving the
   row puts it straight back, on the house rule that 1992 menus didn't ease,
   so reduced motion needs no separate story.

   One vote per person is the server's job, not this component's: it keys on a
   hashed IP and a second press replaces the first. Press four here, then
   press two, and both are honest votes. */

const meta = {
  title: 'Case Study/CaseRating',
  component: CaseRating,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '10px 30px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    slug: {
      control: 'text',
      description:
        'The case being rated. It keys both the POST and the localStorage note of the reader’s own star, so two cases never share a vote.',
    },
  },
  args: { slug: 'family-hub' },
} satisfies Meta<typeof CaseRating>

export default meta
type Story = StoryObj<typeof meta>

/* Nobody has voted. Five muted stars and the ask, which is the state most
   readers meet. Hover across the row to watch the fill follow the cursor. */
export const Unrated: Story = {
  name: 'Unrated',
}

/* The other case, and the reason `slug` is a prop rather than a guess from
   the URL: the spec sheet and the shelf both render cases outside their own
   route, so the component is told which one it is standing in. */
export const OtherCase: Story = {
  name: 'Other case',
  args: { slug: 'greenlight-invest' },
}
