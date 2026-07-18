import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  title: 'Primitives/Button',
  component: Button,
  argTypes: {
    tone: {
      control: 'radio',
      options: ['system', 'expressive'],
      description: 'Which accent answers on hover — blue (system) or pink (expressive)',
    },
    size: { control: 'radio', options: ['sm', 'md'] },
  },
  args: { children: 'Enter', tone: 'expressive', size: 'md' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Expressive: Story = {}

export const System: Story = { args: { tone: 'system', children: 'Open file' } }

export const Small: Story = { args: { size: 'sm', children: '✓ Done' } }

/* Every variant — and every one of them reads --button-radius, --button-weight,
   and the per-size --button-{sm,md}-* tokens (font-size, tracking, padding,
   border) from the token pipeline. Edit button/radius in Figma, push, and this
   whole board changes shape. */
export const TokenBoard: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button tone="system" size="md">Enter</Button>
      <Button tone="expressive" size="md">Retry</Button>
      <Button tone="system" size="sm">Open</Button>
      <Button tone="expressive" size="sm">✓ Done</Button>
    </div>
  ),
}
