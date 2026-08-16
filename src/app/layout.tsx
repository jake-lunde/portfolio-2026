import type { Metadata, Viewport } from 'next'
import {
  Barlow_Condensed,
  Boldonse,
  Cal_Sans,
  Geist,
  Geist_Mono,
  Eagle_Lake,
  Instrument_Sans,
  Instrument_Serif,
  MedievalSharp,
  Noto_Sans_JP,
} from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { SITE } from '@/lib/base'
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

/* BOX ART ONLY — Jake's own face, off his Figma box-art template, for the
   type printed on the SHIPPED.SW covers (src/programs/shelf). It is NOT a
   token face and must not become one by accident: nothing outside the shelf
   may reach for it, the skins' --display/--sans/--mono are untouched, and
   medieval's covers stay in MedievalSharp because a scriptorium does not
   set its tomes in a 2023 grotesque.
   ⚠️ At merge this wants folding into the token architecture properly (a
   `boxart` face role rather than a raw next/font variable). Variable axes +
   a true italic, which the cover variants use for the tagline. */
const boxArt = Instrument_Sans({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-boxart',
  display: 'swap',
  preload: false, // one program's artwork — never blocks the shell
})

/* BOX ART ONLY, AND ONE COVER OF IT. Jake's Family Hub comp is set in
   Instrument Serif — the big 400-weight title, the italic promise under it —
   and pass 11 prints the comp rather than approximating it in the sans. It
   ships exactly one weight and an italic, which is why the cover states
   `font-weight: 400` rather than inheriting the sans covers' 500: there is
   no bold here to ask for, only a synthesised one to avoid.
   Same rules as the sans above: not a token face, nothing outside the shelf
   may reach for it, never preloaded — one cover's lettering does not get to
   block the shell. */
const boxArtSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-boxart-serif',
  display: 'swap',
  preload: false,
})

/* BOX ART ONLY — THE CARTRIDGE COVER'S THREE FACES (pass 13). Jake's Figma
   pass sets `01 greenlight-invest / stripe` in three faces this repo did not
   load, so pass 12 printed all of it in the sans at his sizes. These are the
   real ones, straight off the comp:

   · Boldonse       — the wordmark above the picture. ONE cut, and it is a
                      display heavy at 400: the cover asks for
                      `--weight-regular`, not bold, because a synthesised
                      bold on a face this dense closes the counters.
   · Barlow Condensed — the house credit under the name and the age line
                      along the foot. Nine weights exist; 400 is the only one
                      either of them asks for, so 400 is the only one shipped.
   · Cal Sans       — the quoted promise in its pill and the starburst seal.
                      Also one cut at 400, already semibold-ish by drawing.

   Same rules as the two faces above: NOT token faces, nothing outside
   src/programs/shelf may reach for them, never preloaded — one cover's
   lettering does not get to block the shell — and medieval strikes all three
   back to `--display` (a scriptorium prints no starbursts).
   ⚠️ merge task: these fold into the token architecture with the other two,
   as `boxart` face roles rather than raw next/font variables. */
const boxArtTitle = Boldonse({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-boldonse',
  display: 'swap',
  preload: false,
})

const boxArtLabel = Barlow_Condensed({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  display: 'swap',
  preload: false,
})

const boxArtMark = Cal_Sans({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-cal-sans',
  display: 'swap',
  preload: false,
})

const cjk = Noto_Sans_JP({
  weight: '800',
  subsets: ['latin'],
  variable: '--font-cjk',
  display: 'swap',
  preload: false, // decorative only — never block on it
})

/* Medieval skin faces (Jake's picks, Notion "Typography"): MedievalSharp
   display · Eagle Lake body. Mono ALSO uses MedievalSharp (was Jacquard 12 —
   swapped 2026-07-19, too illegible at micro sizes like the ticker/icon
   labels). next/font requires module-scope instantiation, so these load for
   every skin; the medieval token set points --display/--sans/--mono at
   them. */
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

/* LINK PREVIEW — what a recruiter sees when the URL lands in Slack, in a
   LinkedIn post, or in iMessage. Until this shipped there was no og: or
   twitter: at all and lunde.co pasted as a bare blue link.

   Jake's public title is Staff Product Designer; design engineer is the
   second half of the sentence, not the headline, so it lives in the
   description and in the per-case lines (src/app/[...path]/page.tsx).

   THE IMAGE is src/app/opengraph-image.jpg, wired by Next's file
   convention: og:image AND twitter:image, with the alt text alongside it
   in opengraph-image.alt.txt. A 1200×630 capture of the booted classic
   desktop, and a SWAPPABLE PLACEHOLDER by image law: drop a new 1200×630
   file at the same path and every route's preview follows.

   ⚠️ WHY `openGraph` HERE CARRIES NO title, description OR url. A child
   segment's `openGraph` REPLACES this object outright rather than merging
   into it — set a title here and every deep link inherits the home page's
   card. Leave those three out and Next fills og:title and og:description
   from each route's own `title`/`description` instead, so a program page
   describes itself while still inheriting the site name, the locale and
   the image above. Same reason `twitter` holds nothing but the card type.
   og:url is the one casualty: it cannot be per-route without re-declaring
   the whole object per route, so routes state their canonical URL through
   `alternates.canonical` instead, which is the tag that carries the
   weight (see src/app/[...path]/page.tsx). */
const DESCRIPTION =
  'LUNDE OS: the portfolio of Jake Lunde, a staff product designer who ships production code. The site is the work.'
const TITLE = 'Jake Lunde · Staff Product Designer'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: TITLE,
    template: '%s · Jake Lunde',
  },
  description: DESCRIPTION,
  /* no `alternates` here on purpose — a canonical set at the root leaks
     to every child that doesn't override it, and they would all claim to
     be the home page. Each route states its own (app/page.tsx below and
     the catch-all's generateMetadata). */
  openGraph: {
    type: 'website',
    siteName: 'LUNDE OS',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
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
      className={`${sans.variable} ${mono.variable} ${pixel.variable} ${cjk.variable} ${boxArt.variable} ${boxArtSerif.variable} ${boxArtTitle.variable} ${boxArtLabel.variable} ${boxArtMark.variable} ${medievalDisplay.variable} ${medievalBody.variable}`}
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
