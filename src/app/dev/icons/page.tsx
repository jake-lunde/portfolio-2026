'use client'

/* Scratch proof sheet for the pixel icon pass — not linked from anywhere,
   review-only. Renders every drawn grid at 1× (the size it ships at) and
   3× (integer blow-up for judging the art), next to the line art it
   replaces. Since the motion pass the 3× sits in a button, so hovering
   it runs the icon's cycle, and every frame of that cycle is laid out
   under it at 2× — the strip is the thing to judge for stray pixels.
   Delete or keep at Jake's pleasure. */

import { Icon, type IconName } from '@/components/shell/Icon'
import { PIXEL } from '@/components/shell/pixelIcons'

const NAMES = Object.keys(PIXEL) as IconName[]

function Frame({ d, size }: { d: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d={d} fill="currentColor" shapeRendering="crispEdges" />
    </svg>
  )
}

export default function IconProof() {
  return (
    <main style={{ padding: 40, background: 'var(--surface)', minHeight: '100vh', color: 'var(--content)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
        {NAMES.map((n) => {
          const frames = PIXEL[n]?.frames
          return (
            <div
              key={n}
              data-icon={n}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                border: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                style={{ display: 'inline-flex', padding: 0, background: 'none', border: 0, color: 'inherit' }}
                aria-label={`${n} at 3×, hover to play`}
              >
                <Icon name={n} size={96} />
              </button>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Icon name={n} size={32} />
                <span style={{ opacity: 0.4, display: 'inline-flex' }}>
                  <Icon name={n} size={31} />
                </span>
              </div>
              {frames && (
                <div style={{ display: 'flex', gap: 6 }} data-frames={frames.length}>
                  {frames.map((d, i) => (
                    <Frame key={i} d={d} size={64} />
                  ))}
                </div>
              )}
              <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{n}</code>
            </div>
          )
        })}
      </div>
    </main>
  )
}
