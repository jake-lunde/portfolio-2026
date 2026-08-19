import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { CaseIndex } from './CaseIndex'
import { Section, Lead } from './CaseComponents'
import styles from './case.module.css'

/* INDEX — the case study's sidecar contents, plus the segmented read-o-meter
   that rides just under the title bar.

   NOBODY AUTHORS THIS LIST. The entries are read out of the anatomy already in
   the MDX: every Section prints "01 — label" in its own eyebrow, and the index
   walks the article for those and splits them. Add a section, the index knows.
   Rename one, the index renames. There is no second place to keep in step,
   which is the only reason a rail like this survives contact with a writer.

   THE SCROLLER IS THE WINDOW BODY, NOT THE VIEWPORT. A case study opens in a
   window that the reader can resize, so the component walks up from the
   article until it finds an ancestor that actually scrolls, and hangs its
   listener there. That is what the mock below is: a bounded, scrolling box
   around a real article, the same shape the window gives it.

   IT ARRIVES LATE ON PURPOSE. Nothing shows until the reader has scrolled past
   40px, and the tripline for the active row is the upper 45% of the frame —
   the same one PROGRESS.VWR uses, so the two rails can never disagree about
   where we are. Expansion on hover is an instant pop rather than a tween: 1992
   menus did not ease.

   The rail also needs room. It is gated behind a 640px CONTAINER query on the
   article, not a viewport one — the window is resizable and a viewport query
   would not know — so the narrow story below genuinely loses the rail and
   keeps the meter, which is what a case study read on a phone looks like. */

/** The window body: a bounded scroller around a real article, so the component
    finds the same thing walking up that it finds on the desk. */
function CaseBody({ width = '100%', children }: { width?: number | string; children: ReactNode }) {
  return (
    <div
      data-story-scroller=""
      style={{
        width,
        height: 460,
        overflowY: 'auto',
        border: 'var(--border-width-default) solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      <article className={styles.case}>
        <CaseIndex />
        <div className={styles.wrap}>{children}</div>
      </article>
    </div>
  )
}

const FILLER = [
  ['01', 'The gap', 'People saved, but never felt it.'],
  ['02', 'The bet', 'Put the number where the habit already is.'],
  ['03', 'The build', 'One surface, three teams, nine months.'],
  ['04', 'The result', 'Deposits went up and so did the conversations.'],
] as const

function Sections() {
  return (
    <>
      {FILLER.map(([no, label, title]) => (
        <Section key={no} no={no} label={label} title={title}>
          <Lead>
            A paragraph long enough that the section has height to scroll
            through, which is the only thing the index needs from it.
          </Lead>
          <div style={{ height: 360 }} aria-hidden="true" />
        </Section>
      ))}
    </>
  )
}

/** Scroll the mock window body, then let the observers settle. */
const scrollTo = (px: number) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const scroller = canvasElement.querySelector<HTMLElement>('[data-story-scroller]')
  if (!scroller) return
  scroller.scrollTop = px
  await new Promise((r) => setTimeout(r, 500))
}

const meta = {
  title: 'Case Study/CaseIndex',
  component: CaseIndex,
  parameters: { layout: 'fullscreen' },
  render: () => (
    <CaseBody>
      <Sections />
    </CaseBody>
  ),
} satisfies Meta<typeof CaseIndex>

export default meta
type Story = StoryObj<typeof meta>

/* At the top of the case. The meter is empty and the rail is not there yet —
   it is in the DOM, hidden by `visibility` so it stays out of the tab order
   and off the pointer, waiting for the reader to commit. */
export const AtTheTop: Story = {
  name: 'At the top',
}

/* Scrolled in. The rail has arrived, four blocks of the eighteen-segment meter
   are lit, and the second entry is current — the lowest section across the
   tripline drives the highlight, and rows above it show as done. Hover a row
   to see the instant expansion; press one and it scrolls the window body, not
   the page. */
export const Reading: Story = {
  play: scrollTo(700),
}

/* Near the end. Almost every segment is on and the last entry is current. The
   meter is integer state, so React only re-renders when a block genuinely
   flips rather than on every scroll event. */
export const NearTheEnd: Story = {
  name: 'Near the end',
  play: scrollTo(4000),
}

/* NARROW. Under the article's 640px container query the rail does not render
   at all and the meter stays — a case study on a phone keeps the sense of how
   far in it is and gives up the shortcut, because there is no margin to hang a
   shortcut in. The gate is on the container, so this is the window being
   dragged narrow, not a device. */
export const Narrow: Story = {
  render: () => (
    <CaseBody width={520}>
      <Sections />
    </CaseBody>
  ),
  play: scrollTo(700),
}

/* ONE SECTION, NO RAIL. The index refuses to draw a contents list with a
   single entry — a rail that says "01 — The gap" and nothing else is furniture
   pretending to be navigation. The meter still runs, because how far in you
   are is true whatever the shape of the piece. */
export const SingleSection: Story = {
  name: 'Single section',
  render: () => (
    <CaseBody>
      <Section no="01" label="The whole thing" title="One section, and that is the case.">
        <Lead>Some cases are one move. The index has an opinion about that.</Lead>
        <div style={{ height: 900 }} aria-hidden="true" />
      </Section>
    </CaseBody>
  ),
  play: scrollTo(400),
}
