import { useEffect, useReducer } from 'react'

/* Live proof-of-pipeline board. Reads the CSS custom properties off
   getComputedStyle(document.documentElement) at render time, so whatever the
   token pipeline emits into tokens.generated.css is what shows here. Re-reads
   when the theme toolbar flips data-skin / data-theme:
     - MutationObserver on <html> catches the attribute change (set by the
       preview theme decorator), and
     - a direct subscription to Storybook's globals channel catches toolbar
       changes even on a bare docs page where the story decorator may not run.
   Both simply force a re-render; all values are read fresh each render. */

const COLOR_TOKENS = [
  '--surface',
  '--surface-raised',
  '--content',
  '--content-muted',
  '--surface-inverse',
  '--content-inverse',
  '--border',
  '--accent',
  '--accent-expressive',
  '--accent-support',
  '--accent-expressive-text',
  '--accent-expressive-mark',
  '--focus',
] as const

const TYPE_TOKENS = [
  { name: '--display', label: 'Display (Geist Pixel)', sample: 'LUNDE OS' },
  { name: '--sans', label: 'Body (Geist)', sample: 'The site is the work.' },
  { name: '--mono', label: 'Mono (Geist Mono)', sample: 'DOCUMENT ID / FIG. 01' },
] as const

/** Raw declared value of a custom property (may still contain var() refs). */
function raw(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** Fully-resolved value via a probe element (substitutes var() chains). */
function resolveColor(name: string): string {
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const v = getComputedStyle(probe).color
  probe.remove()
  return v
}

function resolveLength(name: string): string {
  const probe = document.createElement('span')
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.width = `var(${name})`
  document.body.appendChild(probe)
  const v = getComputedStyle(probe).width
  probe.remove()
  return v
}

const mono = 'var(--mono)'
const ink = 'var(--content)'
const inkSoft = 'var(--content-muted)'

const checker =
  'repeating-conic-gradient(var(--border) 0% 25%, transparent 0% 50%) 0 / 12px 12px'

export function TokensBoard() {
  const [, force] = useReducer((n: number) => n + 1, 0)

  useEffect(() => {
    const rerender = () => force()

    const obs = new MutationObserver(rerender)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-skin', 'data-theme'],
    })

    // Also react to the toolbar directly, in case the decorator that mutates
    // <html> isn't wrapping this docs page.
    let channel: { on: (e: string, cb: () => void) => void; off: (e: string, cb: () => void) => void } | null =
      null
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { addons } = require('@storybook/preview-api')
      channel = addons.getChannel()
      channel?.on('globalsUpdated', rerender)
      channel?.on('storyRendered', rerender)
    } catch {
      /* not running inside Storybook — ignore */
    }

    return () => {
      obs.disconnect()
      channel?.off('globalsUpdated', rerender)
      channel?.off('storyRendered', rerender)
    }
  }, [])

  const menubar = { raw: raw('--menubar-h'), resolved: resolveLength('--menubar-h') }

  return (
    <div style={{ fontFamily: 'var(--sans)', color: ink }}>
      <h3 style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', margin: '28px 0 12px' }}>
        Color
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {COLOR_TOKENS.map((name) => (
          <div
            key={name}
            style={{ border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}
          >
            <div style={{ height: 64, background: checker }}>
              <div style={{ height: '100%', background: `var(${name})` }} />
            </div>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontFamily: mono, fontSize: 12, color: ink }}>{name}</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: inkSoft, marginTop: 2 }}>
                {raw(name)}
              </div>
              <div style={{ fontFamily: mono, fontSize: 11, color: inkSoft }}>
                → {resolveColor(name)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', margin: '32px 0 12px' }}>
        Type
      </h3>
      <div style={{ display: 'grid', gap: 14 }}>
        {TYPE_TOKENS.map(({ name, label, sample }) => (
          <div
            key={name}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontFamily: mono, fontSize: 11, color: inkSoft }}>
              {name} · {label}
            </div>
            <div style={{ fontFamily: `var(${name})`, fontSize: 30, marginTop: 8, color: ink }}>
              {sample}
            </div>
            <div style={{ fontFamily: mono, fontSize: 10, color: inkSoft, marginTop: 6 }}>
              {raw(name)}
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', margin: '32px 0 12px' }}>
        Metrics
      </h3>
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontFamily: mono, fontSize: 12, color: ink }}>--menubar-h</div>
          <div style={{ fontFamily: mono, fontSize: 11, color: inkSoft }}>
            {menubar.raw} → {menubar.resolved}
          </div>
        </div>
        <div
          aria-hidden
          style={{
            width: 120,
            height: 'var(--menubar-h)',
            background: 'var(--accent)',
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  )
}
