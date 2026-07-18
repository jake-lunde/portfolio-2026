import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Eagle_Lake, Jacquard_12, MedievalSharp, Noto_Sans_JP } from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const sans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

/* Geist Pixel isn't in this Next version's google-font data yet; self-hosted
   (OFL) from fonts/GeistPixel-latin.woff2 */
const pixel = localFont({
  src: './fonts/GeistPixel-latin.woff2',
  weight: '400',
  variable: '--font-pixel',
  display: 'swap',
})

const cjk = Noto_Sans_JP({
  weight: '800',
  subsets: ['latin'],
  variable: '--font-cjk',
  display: 'swap',
  preload: false, // decorative only — never block on it
})

/* Medieval skin faces (Jake's picks, Notion "Typography"): MedievalSharp
   display · Eagle Lake body · Jacquard 12 mono (a pixel blackletter — the
   LUNDE OS bridge). next/font requires module-scope instantiation, so they
   load for every skin; the medieval token set points --display/--sans/--mono
   at them. */
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
const medievalMono = Jacquard_12({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-medieval-mono',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: {
    default: 'Jake Lunde — Design Engineer',
    template: '%s — Jake Lunde',
  },
  description:
    'LUNDE OS: the portfolio of Jake Lunde, a principal-level product designer who ships production code. The site is the work.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e7e1d2' },
    { media: '(prefers-color-scheme: dark)', color: '#0d100c' },
  ],
}

/* Set theme + skin before paint: localStorage wins; prefers-color-scheme first visit only. */
const themeInit = `(function(){try{var t=localStorage.getItem('lunde-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;var s=localStorage.getItem('lunde-skin')||'classic';document.documentElement.dataset.skin=s}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} ${pixel.variable} ${cjk.variable} ${medievalDisplay.variable} ${medievalBody.variable} ${medievalMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        {children}
        <div className="grain" aria-hidden="true" />
        <Analytics />
      </body>
    </html>
  )
}
