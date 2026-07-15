import type { Meta, StoryObj } from '@storybook/react'
import { TokensBoard } from './TokensBoard'

/* The live token board as a Story so the preview theme decorator wraps it —
   that decorator sets data-skin/data-theme on <html>, which TokensBoard reads
   via getComputedStyle. Embedded into Tokens.mdx via <Story>, so the docs page
   (not just canvas) reacts to the Theme toolbar. */

const meta = {
  title: 'Design System/Tokens',
  component: TokensBoard,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TokensBoard>

export default meta

export const Board: StoryObj<typeof meta> = {}
