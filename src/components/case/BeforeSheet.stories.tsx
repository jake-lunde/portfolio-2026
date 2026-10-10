import type { Meta, StoryObj } from '@storybook/react'
import { BeforeSheet } from './BeforeSheet'
import styles from './case.module.css'

/* The old Invest contact sheet. Wide: every frame shares the row, and
   each screen scrolls like a normal page with wheel, trackpad or touch.
   Phone: the row turns into a snap carousel, one frame per swipe. The
   sheet lives inside .case because every case breakpoint asks that
   box's width, not the screen's. */

const meta = {
  title: 'Case Study/Before Sheet',
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
  name: 'Wide, contact sheet',
  render: () => <BeforeSheet />,
}

export const Phone: Story = {
  name: 'Phone, snap carousel',
  parameters: { viewport: { defaultViewport: 'phone' } },
  render: () => <BeforeSheet />,
}
