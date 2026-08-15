'use client'

/* Scratch proof sheet for the pixel icon pass — not linked from anywhere,
   review-only. Renders every drawn grid at 1× (the size it ships at) and
   3× (integer blow-up for judging the art), next to the line art it
   replaces. Delete or keep at Jake's pleasure. */

import { Icon, type IconName } from '@/components/shell/Icon'
import { PIXEL } from '@/components/shell/pixelIcons'

const NAMES = Object.keys(PIXEL) as IconName[]

export default function IconProof() {
  return (
    <main style={{ padding: 40, background: 'var(--surface)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
        {NAMES.map((n) => (
          <div
            key={n}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              border: '1px solid var(--border)',
            }}
          >
            <Icon name={n} size={96} />
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Icon name={n} size={32} />
              <span style={{ opacity: 0.4, display: 'inline-flex' }}>
                <Icon name={n} size={31} />
              </span>
            </div>
            <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{n}</code>
          </div>
        ))}
      </div>
    </main>
  )
}
