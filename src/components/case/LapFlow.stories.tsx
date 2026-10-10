import type { Meta, StoryObj } from '@storybook/react'
import { LapFlow } from './LapFlow'
import styles from './case.module.css'

/* The app at two levels. The chip in the cap row picks 4TH (level 1)
   or 8TH (level 2); the pills under the phone pick the screen.
   Onboarding plays itself every 4.5s and a tap on either half of the
   screen steps it; the other three tabs are long pages that scroll in
   the frame (hover on desktop, native scroll on a phone). The plate
   lives inside .case because every case breakpoint asks that box's
   width, not the screen's. */

const meta = {
  title: 'Case Study/Lap Flow',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <article className={styles.case}>
        <div className={styles.wrap}>
          <Story />
        </div>
      </article>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj

export const Wide: Story = {
  name: 'Wide',
  render: () => <LapFlow />,
}

export const Phone: Story = {
  name: 'Phone',
  parameters: { viewport: { defaultViewport: 'phone' } },
  render: () => <LapFlow />,
}
