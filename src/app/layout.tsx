import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Noto_Sans_JP } from 'next/font/google'
import './globals.css'

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const cjk = Noto_Sans_JP({
  weight: '800',
  subsets: ['latin'],
  variable: '--font-cjk',
  display: 'swap',
  preload: false, // decorative only — never block on it
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

/* Set theme before paint: localStorage wins; prefers-color-scheme first visit only. */
const themeInit = `(function(){try{var t=localStorage.getItem('lunde-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} ${cjk.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  )
}
