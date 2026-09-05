import type { Meta, StoryObj } from '@storybook/react'
import { useLayoutEffect } from 'react'
import { Hero } from './CaseComponents'
import { HeroSketch } from './HeroSketch'
import { useFidelity, type Fidelity } from './fidelity'
import styles from './case.module.css'

/* The hero's art slot on both faces of the fidelity switch. The pair is
   the proof for the s140 rule (see fidelity.ts): one stage, one ratio,
   so the header is exactly as tall in draft as in shipped and flipping
   never moves the reader's place.

   The mode is the case-wide store, so these two stories set it on mount.
   Read them one at a time — in the docs view they share the store and
   the last one mounted wins. */

function Face({ mode }: { mode: Fidelity }) {
  useLayoutEffect(() => {
    useFidelity.setState({ mode })
  }, [mode])

  return (
    <Hero
      eyebrow="Consumer hardware · 2024–2025"
      title="Family Hub"
      thesis="A screen on the kitchen wall that the whole house actually uses."
      meta={[
        ['Role', 'Senior Product Designer'],
        ['Partners', 'Eng, Research, Brand'],
        ['Timeline', '14 months'],
        ['Shipped', 'Hardware · iOS · Android'],
      ]}
      art={<HeroSketch />}
    />
  )
}

const meta = {
  title: 'Case Study/Hero Sketch',
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

export const Draft: Story = {
  name: 'Draft — the collage',
  render: () => <Face mode="draft" />,
}

export const Shipped: Story = {
  name: 'Shipped — the device',
  render: () => <Face mode="shipped" />,
}

export const DraftPhone: Story = {
  name: 'Phone — draft',
  parameters: { viewport: { defaultViewport: 'phone' } },
  render: () => <Face mode="draft" />,
}

export const ShippedPhone: Story = {
  name: 'Phone — shipped',
  parameters: { viewport: { defaultViewport: 'phone' } },
  render: () => <Face mode="shipped" />,
}
