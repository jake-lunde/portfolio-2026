import type { Meta, StoryObj } from '@storybook/react'
import { LapFlow } from './LapFlow'
import styles from './case.module.css'

/* The first lap, one grade at a time. The chip in the cap row picks
   4TH or 8TH; the phone plays itself every 4.5s, and a tap on the right
   half of the screen steps forward, the left half back. The plate lives
   inside .case because every case breakpoint asks that box's width,
   not the screen's. */

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
