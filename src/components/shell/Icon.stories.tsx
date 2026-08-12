import type { Meta, StoryObj } from '@storybook/react'
import { Icon, type IconName } from './Icon'

/* 32×32 line-art icons, currentColor. Classic is the default glyph set;
   a MEDIEVAL_PATHS subset swaps in per-icon via [data-skin='medieval']
   in Icon.module.css — CSS-driven, so the Storybook theme toolbar's
   skin global (see .storybook/preview.tsx) is what flips it, not
   anything in this file. No skin switcher is built here on purpose. */

const meta = {
  title: 'Shell/Icon',
  component: Icon,
  args: { name: 'doc', size: 32 },
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

/* `PATHS` (classic) and `MEDIEVAL_PATHS` are module-private in Icon.tsx —
   only the `IconName` union is exported. There's no runtime constant to
   derive this list from, so it's hand-enumerated here, in the exact
   order the union declares it, to stay a straightforward diff against
   Icon.tsx if a name is ever added or removed. */
const ICON_NAMES: IconName[] = [
  'doc',
  'printer',
  'resume',
  'folder',
  'note',
  'ipod',
  'music',
  'reel',
  'wave',
  'book',
  'sliders',
  'rings',
  'camera',
  'puzzle',
  'brush',
  'chip',
  'trash',
  'bike',
  'flower',
  'disc',
  'plane',
  'mountain',
  'star',
  'nodes',
  'steps',
  'clipboard',
  'swatch',
  'smiley',
  'bubble',
  'mystery',
  'suggest',
]

export const Doc: Story = {}

/* Every name, labelled — the design-system evidence for the full set.
   Grid cells use semantic tokens only (border/surface/content), so the
   chrome around each glyph stays legible in every skin the toolbar
   switches to. */
export const AllIcons: Story = {
  name: 'All icons',
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
        gap: 1,
        background: 'var(--border)',
        border: 'var(--border-width-default) solid var(--border)',
      }}
    >
      {ICON_NAMES.map((name) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '20px 8px',
            background: 'var(--surface)',
            color: 'var(--content)',
          }}
        >
          <Icon name={name} />
          <span
            style={{
              font: 'var(--type-caption-size) var(--mono)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--content-muted)',
            }}
          >
            {name}
          </span>
        </div>
      ))}
    </div>
  ),
}

/* Sizes + currentColor: the glyph is stroke="currentColor", so it reads
   whatever `color` its container sets — no color prop of its own. */
export const SizesAndColor: Story = {
  name: 'Sizes & currentColor',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
      <div style={{ color: 'var(--content)' }}>
        <Icon name="suggest" size={16} />
      </div>
      <div style={{ color: 'var(--content)' }}>
        <Icon name="suggest" size={32} />
      </div>
      <div style={{ color: 'var(--content)' }}>
        <Icon name="suggest" size={64} />
      </div>
      <div style={{ color: 'var(--accent)' }}>
        <Icon name="suggest" size={32} />
      </div>
      <div style={{ color: 'var(--accent-expressive)' }}>
        <Icon name="suggest" size={32} />
      </div>
    </div>
  ),
}
