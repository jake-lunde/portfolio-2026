import type { Meta, StoryObj } from '@storybook/react'
import { VizShell } from './VizShell'

/* VizShell is the CRT plate all six site visualizers open inside — a pure
   children wrapper (viz.module.css's `.viz` padding + the global `crt-glow`
   text-shadow, dark theme only). The plate's own background is NOT drawn
   here: it comes from the enclosing window body (Window.tsx sets
   `chrome: 'crt'` → `.windowBody.crt { background: var(--surface-inverse) }`,
   shell.module.css:1249). So every story below wraps VizShell in that same
   dark plate — --surface-inverse background, --content-inverse ink — rather
   than letting it float on the catalog's --surface page, which would show
   the chrome the real window always supplies. */

const meta = {
  title: 'Programs/Visualizers/VizShell',
  decorators: [
    (Story) => (
      <div
        className="crt"
        style={{
          background: 'var(--surface-inverse)',
          padding: 24,
          position: 'relative',
          minHeight: 200,
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj

/* Simple mono readout — the kind of content every real visualizer prints
   inside the shell (HUD cells, chip rows). House rule: text ON the crt body
   is --content-inverse, never --content. */
export const Default: Story = {
  render: () => (
    <VizShell>
      <p
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 13,
          letterSpacing: 'var(--tracking-14)',
          textTransform: 'uppercase',
          color: 'var(--content-inverse)',
          margin: 0,
        }}
      >
        VIZ.01 — test pattern
      </p>
    </VizShell>
  ),
}

/* A token-colored test pattern: bars in the plate's own accent (`.viz` pins
   --accent to its luminous variant so the system blue reads against the
   always-dark plate regardless of theme) and the expressive accent, next to
   plain inverse-ink text — the two colors every visualizer actually draws
   with. */
export const TestPattern: Story = {
  render: () => (
    <VizShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 220 }}>
        <span style={{ height: 14, background: 'var(--accent)' }} />
        <span style={{ height: 14, background: 'var(--accent-expressive)' }} />
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: 'var(--tracking-12)',
            textTransform: 'uppercase',
            color: 'var(--content-inverse)',
          }}
        >
          signal · locked
        </span>
      </div>
    </VizShell>
  ),
}

/* VizShell has no size prop of its own — it is a plain padding wrapper, and
   every real visualizer sizes itself via the window registry (vizRegistry.tsx
   `size: { w, h }`, e.g. Ride at 720×716, Models at 700×560). This story
   demonstrates the shell at two of those real window widths, holding the
   test pattern content, to show the padding holds regardless of how wide
   the enclosing window is — VizShell itself never constrains it. */
export const AtWindowSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {[
        { label: 'Models · 700px', w: 700 },
        { label: 'Ride · 720px', w: 720 },
      ].map(({ label, w }) => (
        <div key={label} style={{ width: w }}>
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--content)',
              marginBottom: 6,
            }}
          >
            {label}
          </p>
          <VizShell>
            <p
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 13,
                color: 'var(--content-inverse)',
                margin: 0,
              }}
            >
              VIZ.01 — test pattern
            </p>
          </VizShell>
        </div>
      ))}
    </div>
  ),
}
