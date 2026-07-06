import styles from './shell.module.css'

/* Ambient foreign type — pure texture. Never content, never focusable. */

const GLYPHS: Array<{ text: string; top: string; left: string; size: string; rotate?: string }> = [
  { text: '設計技師', top: '8%', left: '58%', size: 'clamp(80px, 14vw, 190px)' },
  { text: '一九八四', top: '58%', left: '-4%', size: 'clamp(90px, 16vw, 220px)', rotate: '90deg' },
  { text: '周波数', top: '74%', left: '64%', size: 'clamp(60px, 9vw, 120px)' },
  { text: 'システム稼働中', top: '36%', left: '30%', size: 'clamp(28px, 4vw, 48px)' },
]

export function GlyphField() {
  return (
    <div className={styles.glyphField} aria-hidden="true">
      {GLYPHS.map((g) => (
        <span
          key={g.text}
          className={styles.glyph}
          style={{
            top: g.top,
            left: g.left,
            fontSize: g.size,
            transform: g.rotate ? `rotate(${g.rotate})` : undefined,
          }}
        >
          {g.text}
        </span>
      ))}
    </div>
  )
}
