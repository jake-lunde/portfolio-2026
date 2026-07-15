import type { Meta, StoryObj } from '@storybook/react'
import { Stamp } from './Stamp'

/* Rubber-stamp archival accent (§3). Blue = system, pink = expressive. */
const meta = {
  title: 'Primitives/Stamp',
  component: Stamp,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['blue', 'pink'],
      description: 'blue = system accent, pink = expressive accent',
    },
    children: { control: 'text' },
  },
  args: {
    children: 'Under construction',
    tone: 'blue',
  },
} satisfies Meta<typeof Stamp>

export default meta
type Story = StoryObj<typeof meta>

export const Blue: Story = {
  args: { children: 'Declassified', tone: 'blue' },
}

export const Pink: Story = {
  args: { children: 'Confidential', tone: 'pink' },
}

export const BothTones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
      <Stamp tone="blue">Spec-01</Stamp>
      <Stamp tone="pink">Do not copy</Stamp>
      <Stamp tone="blue">Approved</Stamp>
      <Stamp tone="pink">Draft</Stamp>
    </div>
  ),
}
