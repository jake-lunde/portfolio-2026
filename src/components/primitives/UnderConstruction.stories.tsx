import type { Meta, StoryObj } from '@storybook/react'
import { UnderConstruction } from './UnderConstruction'

/* Empty-state plate for stub programs (§5 boot/empty states). */
const meta = {
  title: 'Primitives/UnderConstruction',
  component: UnderConstruction,
  tags: ['autodocs'],
  argTypes: {
    note: { control: 'text' },
  },
  args: {
    note: 'This program is being wired up. Check back after the next boot cycle.',
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnderConstruction>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ShortNote: Story = {
  args: { note: 'Coming soon.' },
}

export const LongNote: Story = {
  args: {
    note: 'The guestbook needs a small backend before it can persist your signature. For now, sign the wall in your imagination.',
  },
}
