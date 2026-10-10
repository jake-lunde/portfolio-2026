import type { Meta, StoryObj } from '@storybook/react'
import { OverviewPage } from './OverviewPage'
import styles from './case.module.css'

/* Nike's stock page in one phone, the overview video playing in its
   header. Six numbered callouts sit outside the phone with a leader to
   each target; a click springs the page there. The chip in the cap row
   turns the narration on, from the top. Hover scrubs the page on
   desktop, a phone scrolls it natively, and narrow, the callouts become
   a list with numbered dots on the page. The plate lives inside .case
   because every case breakpoint asks that box's width, not the
   screen's. */

const meta = {
  title: 'Case Study/Overview Page',
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
  render: () => <OverviewPage />,
}

export const Phone: Story = {
  name: 'Phone',
  parameters: { viewport: { defaultViewport: 'phone' } },
  render: () => <OverviewPage />,
}
