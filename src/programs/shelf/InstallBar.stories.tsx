import type { Meta, StoryObj } from '@storybook/react'
import { InstallBar } from './InstallBar'

/* The shelf's progress meter, carried whole from the retired IN PROGRESS
   window. Two real call sites, both reproduced here:
     - ShelfBox.tsx (back panel, unshipped case): plain `meter`, no stripes,
       a per-box stagger via `delay`.
     - LaunchOverlay.tsx (the PLAY loading beat): `striped` `progressbar`,
       animated on a `seconds` tween rather than a spring — an install
       sequence steps on a clock.
   `.track` has no intrinsic width of its own (it fills its container), so
   every story below sets a width on the wrapper rather than on the bar. */

const meta = {
  title: 'Shelf/InstallBar',
  component: InstallBar,
  argTypes: {
    pct: { control: { type: 'range', min: 0, max: 100 } },
    striped: { control: 'boolean' },
    role: { control: 'radio', options: ['progressbar', 'meter'] },
    seconds: { control: 'number' },
    delay: { control: 'number' },
  },
  args: {
    pct: 42,
    striped: false,
    role: 'meter',
    label: 'Case Study: 42% — in progress',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 260 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InstallBar>

export default meta
type Story = StoryObj<typeof meta>

/* ShelfBox's exact shape: plain meter, no stripes, mid-progress. */
export const Meter: Story = {}

export const MeterEmpty: Story = {
  args: { pct: 0, label: 'Case Study: 0% — not started' },
}

export const MeterComplete: Story = {
  args: { pct: 100, label: 'Case Study: 100% — shipped' },
}

/* LaunchOverlay's exact shape: the OS 9 striped installer, on a tween
   instead of a spring (`seconds`), taller track (`.trackLg`). */
export const StripedInstaller: Story = {
  args: {
    pct: 68,
    striped: true,
    role: 'progressbar',
    label: 'Loading Greenlight Invest',
    seconds: 0.42,
  },
}

/* Multiple bars staggered by `delay` — the shelf's own pattern for four
   boxes animating in without arriving in lockstep (`0.05 * (index + 1)`). */
export const StaggeredRow: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[35, 60, 80, 95].map((pct, i) => (
        <InstallBar
          key={pct}
          pct={pct}
          role="meter"
          label={`Case ${i + 1}: ${pct}%`}
          delay={0.05 * (i + 1)}
        />
      ))}
    </div>
  ),
}
