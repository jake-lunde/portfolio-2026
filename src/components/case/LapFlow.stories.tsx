import type { Meta, StoryObj } from '@storybook/react'
import { LapFlow } from './LapFlow'
import styles from './case.module.css'

/* The first lap, two grades side by side. Wide: hover across the stage
   to step both phones, or flip the chip to FADE and watch it play.
   Phone: the phones stay side by side and a horizontal drag scrubs.
   The plate lives inside .case because every case breakpoint asks that
   box's width, not the screen's. */

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
  name: 'Wide, hover scrub',
  render: () => <LapFlow />,
}

export const Phone: Story = {
  name: 'Phone, drag to scrub',
  parameters: { viewport: { defaultViewport: 'phone' } },
  render: () => <LapFlow />,
}
