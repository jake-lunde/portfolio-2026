'use client'

/* Scratch proof sheet for the pixel icon pass — not linked from anywhere,
   review-only. Renders every drawn grid at 1× (the size it ships at) and
   3× (integer blow-up for judging the art), next to the line art it
   replaces. Since the motion pass the 3× sits in a button, so hovering
   it runs the icon's cycle, and every frame of that cycle is laid out
   under it at 2× — the strip is the thing to judge for stray pixels.
   Below the icons: the folder media (mediaSprites.ts) at 1× and 3× with
   an icon on the label, the way Folder.tsx composes them. Then the whole
   sheet again inside a data-skin="medieval" scope — the woodblock plates
   (medievalPixelIcons.ts) with their cycles, judged the same way.
   Delete or keep at Jake's pleasure. */

import { Icon, type IconName } from '@/components/shell/Icon'
import { PIXEL } from '@/components/shell/pixelIcons'
import { MEDIEVAL_PIXEL } from '@/components/shell/medievalPixelIcons'
import { MEDIA, type MediaKind } from '@/components/shell/mediaSprites'

const MEDIA_PROOF: [MediaKind, IconName][] = [
  ['tape', 'ipod'],
  ['cart', 'camera'],
]

function Sprite({ kind, icon, scale }: { kind: MediaKind; icon: IconName; scale: number }) {
  const m = MEDIA[kind]
  return (
    <span style={{ position: 'relative', display: 'block', width: m.w * scale, height: m.h * scale }}>
      <svg width={m.w * scale} height={m.h * scale} viewBox={`0 0 ${m.w} ${m.h}`} aria-hidden="true">
        <path d={m.ink} fill="currentColor" shapeRendering="crispEdges" />
      </svg>
      <span style={{ position: 'absolute', left: m.label.x * scale, top: m.label.y * scale, lineHeight: 0 }}>
        <Icon name={icon} size={32 * scale} />
      </span>
    </span>
  )
}

function Frame({ d, size }: { d: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d={d} fill="currentColor" shapeRendering="crispEdges" />
    </svg>
  )
}

function Sheet({ glyphs }: { glyphs: typeof PIXEL }) {
  const names = Object.keys(glyphs) as IconName[]
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
      {names.map((n) => {
        const frames = glyphs[n]?.frames
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
  )
}

export default function IconProof() {
  return (
    <main style={{ padding: 40, background: 'var(--surface)', minHeight: '100vh', color: 'var(--content)' }}>
      <Sheet glyphs={PIXEL} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, marginTop: 40 }}>
        {MEDIA_PROOF.map(([kind, icon]) => (
          <div
            key={kind}
            data-media={kind}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 16, border: '1px solid var(--border)' }}
          >
            <button
              type="button"
              style={{ display: 'inline-flex', padding: 0, background: 'none', border: 0, color: 'inherit' }}
              aria-label={`${kind} at 3×, hover to play the label`}
            >
              <Sprite kind={kind} icon={icon} scale={3} />
            </button>
            <Sprite kind={kind} icon={icon} scale={1} />
            <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{kind}</code>
          </div>
        ))}
      </div>
      {/* the medieval tier: same sheet, re-scoped — nested data-skin swaps the
          glyph <g>s and the skin's tokens for everything inside */}
      <section
        data-skin="medieval"
        data-sheet="medieval"
        style={{ marginTop: 40, padding: 40, background: 'var(--surface)', color: 'var(--content)' }}
      >
        <Sheet glyphs={MEDIEVAL_PIXEL} />
      </section>
    </main>
  )
}
