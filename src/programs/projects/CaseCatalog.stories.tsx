import type { Meta, StoryObj } from '@storybook/react'
import { CASES } from './cases'
import { CaseCatalog } from './CaseCatalog'

/* THE CASE OVERVIEW MOCK, ROUND 2 — the box metaphor is out (Jake's
   call), the cover film stays, and the copy re-homes to the page on the
   token type ramp at the reference portfolio's hierarchy. Family Hub is
   the guinea pig.

   Unwired on purpose: nothing imports this from the app. If the direction
   lands, it graduates to the case's opening screen (case:<slug> and
   /projects/<slug> land here before the MDX) — see CaseCatalog.tsx. */

const familyHub = CASES.find((c) => c.slug === 'family-hub')!

const meta = {
  title: 'Projects/CaseCatalog',
  component: CaseCatalog,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CaseCatalog>

export default meta
type Story = StoryObj<typeof meta>

export const FamilyHub: Story = {
  args: { c: familyHub },
}

/* the same page in the narrow column — the mobile read, where the stacked
   order is the whole layout */
export const FamilyHubNarrow: Story = {
  args: { c: familyHub },
  globals: { viewport: { value: 'mobile1' } },
}
