import type { Meta, StoryObj } from '@storybook/react'
import { LapFlow } from './LapFlow'
import styles from './case.module.css'

/* The app at two levels. The chip in the cap row picks LEVEL 1 (the
   fourth grader) or LEVEL 2 (the eighth); the pills pick the screen.
   Onboarding plays itself every 4.5s and a tap on either half of the
   screen steps it; the other three tabs are long pages whose top and
   bottom chrome stay pinned while the middle scrolls like a normal page
   (wheel, trackpad or touch). The plate lives inside .case because
   every case breakpoint asks that box's width, not the screen's. */

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
