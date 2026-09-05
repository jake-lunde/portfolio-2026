import type { Meta, StoryObj } from '@storybook/react'
import { Plate } from './CaseComponents'
import { ResearchBars } from './ResearchBars'
import styles from './case.module.css'

/* The survey chart in its plate. The phone story is the visual proof for
   the s140 rebuild: labels above their bars at the case's label size,
   bars filling the track, the cap row dropping its tag onto its own line
   instead of breaking it mid-phrase. The chart lives inside .case
   because every case breakpoint asks that box's width, not the screen's. */

const meta = {
  title: 'Case Study/Research Bars',
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

const Chart = () => (
  <Plate
    cap="The survey"
    tag="PARENT PREFERENCES · SEPT 2025"
    caption="Most essential features, n = 1,200 US parents."
  >
    <ResearchBars />
  </Plate>
)

export const Wide: Story = {
  name: 'Wide — label beside bar',
  render: () => <Chart />,
}

export const Phone: Story = {
  name: 'Phone — label above bar',
  parameters: { viewport: { defaultViewport: 'phone' } },
  render: () => <Chart />,
}
