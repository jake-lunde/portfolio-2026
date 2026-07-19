import type { Preview, Decorator } from '@storybook/react'
import { useEffect } from 'react'
import { Geist, Geist_Mono, Eagle_Lake, MedievalSharp, Noto_Sans_JP } from 'next/font/google'
import localFont from 'next/font/local'

/* Mirror src/app/layout.tsx so components in the catalog set in the real
   typefaces. globals.css is imported AFTER the generated tokens (same order as
   the app), so hand-authored utility classes + base styles apply. */
import '../src/styles/tokens.generated.css'
import '../src/app/globals.css'

const sans = Geist({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })
const pixel = localFont({
  src: '../src/app/fonts/GeistPixel-latin.woff2',
  weight: '400',
  variable: '--font-pixel',
  display: 'swap',
})
const cjk = Noto_Sans_JP({
  weight: '800',
  subsets: ['latin'],
  variable: '--font-cjk',
  display: 'swap',
  preload: false,
})
const medievalDisplay = MedievalSharp({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-medieval-display',
  display: 'swap',
  preload: false,
})
const medievalBody = Eagle_Lake({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-medieval-body',
  display: 'swap',
  preload: false,
})
const fontVars = `${sans.variable} ${mono.variable} ${pixel.variable} ${cjk.variable} ${medievalDisplay.variable} ${medievalBody.variable}`

/* Plain-CSS fallbacks so the catalog still renders if next/font's Google fetch
   is skipped (CI / offline). These feed the generated tokens, which reference
   --font-* (e.g. --display: var(--font-pixel), var(--font-mono), monospace). */
const fontFallback = `
:root {
  --font-sans: ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  --font-pixel: 'Courier New', ui-monospace, monospace;
  --font-cjk: ui-sans-serif, system-ui, sans-serif;
  --font-medieval-display: 'Luminari', 'Palatino', serif;
  --font-medieval-body: 'Palatino', Georgia, serif;
}
.sb-show-main { background: var(--surface); color: var(--content); }
/* globals.css locks the viewport (body{overflow:hidden}) because the OS shell
   owns scrolling — but in Storybook that traps every docs/story page. Undo it
   here so the catalog scrolls normally. Storybook-only; the site is untouched. */
html, body { height: auto !important; overflow: auto !important; }
`

/* Map the toolbar theme id → the DOM attributes that MATCH the generated CSS
   selectors exactly (see src/styles/tokens.generated.css):
     classic-light  -> [data-skin='classic'], no data-theme  => :root/classic light
     classic-dark   -> [data-skin='classic'][data-theme='dark']
     medieval       -> [data-skin='medieval'] (falls back to classic values today)
     underwater     -> [data-skin='underwater'] (falls back to classic values today) */
function applyTheme(theme: string) {
  const el = document.documentElement
  const [skin, mode] = theme.split('-') // e.g. 'classic-dark' -> ['classic','dark']
  el.setAttribute('data-skin', skin)
  if (mode === 'dark') {
    el.setAttribute('data-theme', 'dark')
  } else {
    el.removeAttribute('data-theme')
  }
}

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) ?? 'classic-light'
  useEffect(() => {
    applyTheme(theme)
  }, [theme])
  // apply synchronously on first render too, so SSR-less initial paint is on-theme
  if (typeof document !== 'undefined') applyTheme(theme)

  return (
    <div className={fontVars} style={{ background: 'var(--surface)', color: 'var(--content)', padding: 24 }}>
      <style>{fontFallback}</style>
      <Story />
    </div>
  )
}

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: { disable: true }, // theme decorator owns the background
  },
  initialGlobals: { theme: 'classic-light' },
  globalTypes: {
    theme: {
      description: 'LUNDE OS skin / mode',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        dynamicTitle: true,
        items: [
          { value: 'classic-light', title: 'Classic — Light' },
          { value: 'classic-dark', title: 'Classic — Dark' },
          { value: 'medieval', title: 'Medieval' },
          { value: 'underwater', title: 'Underwater' },
        ],
      },
    },
  },
  decorators: [withTheme],
}

export default preview
