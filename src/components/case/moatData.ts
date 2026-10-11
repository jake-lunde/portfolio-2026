/* Illustrative product content written for the case study; ring
   placement and reasons are the author's reading of public facts, not
   Greenlight data.

   The competitors bullseye (MoatPlate.tsx). NVIDIA is the template from
   Jake's Figma file: its chip positions are the Figma card's, and its
   Apple sheet copy is verbatim from the design. Every other sheet was
   written to match that register: plain, for a kid, no jargon.

   x/y are chip CENTRES inside the 326x350 ring chart (centre 163,175).
   Chips sit on a ring's edge: ~75 from centre for closest rivals, ~118
   for competitors, ~162 for farther out. The upper middle stays clear
   for the three ring-label pills. `tip` names the chip that wears the
   "Tap to learn more" tooltip; it always sits at the Figma Apple spot
   (306,98) so the bubble fits the card. Array order is the sheet's tab
   order and the chips' keyboard order. */

export type Ring = 1 | 2 | 3

export type ReasonKind = 'tech' | 'brand' | 'cost'

export type Reason = { kind: ReasonKind; text: string }

export type Competitor = {
  ticker: string
  name: string
  ring: Ring
  x: number
  y: number
  /** circle-cropped logo in public/case/greenlight-invest/moat; text chip when absent */
  logo?: string
  why: string
  reasons: [Reason, Reason, Reason]
}

export type MoatCompany = {
  ticker: string
  name: string
  logo?: string
  /** ticker of the chip the tooltip points at */
  tip: string
  competitors: Competitor[]
}

/* the reason categories from Jake's copy, with the Figma emoji */
export const REASON_LABELS: Record<ReasonKind, { emoji: string; label: string }> = {
  tech: { emoji: '🧠', label: 'Special technology' },
  brand: { emoji: '🎯', label: 'Famous brand' },
  cost: { emoji: '💰', label: 'Cheaper to make stuff' },
}

/* pill text, sheet heading ("Why they’re …"), chip aria-label */
export const RING_NAMES: Record<Ring, { pill: string; plural: string; one: string }> = {
  1: { pill: 'Closest rivals', plural: 'closest rivals', one: 'closest rival' },
  2: { pill: 'Competitors', plural: 'competitors', one: 'competitor' },
  3: { pill: 'Farther out', plural: 'farther out', one: 'farther out' },
}

const LOGO = '/case/greenlight-invest/moat/'

export const MOAT_COMPANIES: MoatCompany[] = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA',
    logo: `${LOGO}nvda.png`,
    tip: 'AAPL',
    competitors: [
      /* Figma's tab order (AMD, AAPL, INTC, QCOM, AMZN); GOOG, untabbed in the design, goes last */
      {
        ticker: 'AMD',
        name: 'AMD',
        ring: 1,
        x: 105,
        y: 222,
        logo: `${LOGO}amd.png`,
        why: 'AMD makes the same kinds of chips NVIDIA does: graphics chips for gaming and big AI chips for data centers. When a company shops for AI chips, it usually looks at both.',
        reasons: [
          { kind: 'tech', text: 'AMD designs its own graphics and AI chips.' },
          { kind: 'brand', text: 'Gamers know the Radeon and Ryzen names.' },
          { kind: 'cost', text: 'AMD builds chips from small, cheap pieces.' },
        ],
      },
      {
        ticker: 'AAPL',
        name: 'Apple',
        ring: 3,
        x: 306,
        y: 98,
        logo: `${LOGO}aapl.png`,
        /* verbatim from the Figma sheet (201633:65799), em dash included */
        why: 'Apple is strong — but they’re not focused on competing in NVIDIA’s space right now (AI, gaming, and data center chips). If that ever changes, they could move closer!',
        reasons: [
          { kind: 'tech', text: 'Apple designs its own powerful chips.' },
          { kind: 'brand', text: 'Everyone knows Apple.' },
          { kind: 'cost', text: 'Apple controls a lot of their production.' },
        ],
      },
      {
        ticker: 'INTC',
        name: 'Intel',
        ring: 1,
        x: 229,
        y: 143,
        logo: `${LOGO}intc.png`,
        why: 'Intel makes the brains inside lots of computers, and it makes graphics chips and AI chips too. It wants the same customers NVIDIA has.',
        reasons: [
          { kind: 'tech', text: 'Intel has made computer chips for over 50 years.' },
          { kind: 'brand', text: '“Intel Inside” has been on computers for decades.' },
          { kind: 'cost', text: 'Intel builds chips in its own factories.' },
        ],
      },
      {
        ticker: 'QCOM',
        name: 'Qualcomm',
        ring: 3,
        x: 19,
        y: 251,
        logo: `${LOGO}qcom.png`,
        why: 'Qualcomm makes the chips inside lots of Android phones. It’s starting to make AI chips for data centers, but that’s still new, so it sits farther out.',
        reasons: [
          { kind: 'tech', text: 'Snapdragon chips power lots of phones.' },
          { kind: 'brand', text: 'Phone fans know the Snapdragon name.' },
          { kind: 'cost', text: 'Qualcomm doesn’t own costly chip factories.' },
        ],
      },
      {
        ticker: 'AMZN',
        name: 'Amazon',
        ring: 2,
        x: 249,
        y: 256,
        why: 'Amazon designs its own AI chips for its cloud business, so it can buy fewer from NVIDIA. It still buys plenty of NVIDIA chips too.',
        reasons: [
          { kind: 'tech', text: 'Amazon designs its own AI chips, called Trainium.' },
          { kind: 'brand', text: 'Everyone knows Amazon.' },
          { kind: 'cost', text: 'Its own chips cost Amazon less than buying them.' },
        ],
      },
      {
        ticker: 'GOOG',
        name: 'Google',
        ring: 2,
        x: 62,
        y: 114,
        why: 'Google designs its own AI chips, called TPUs, so it can buy fewer from NVIDIA. It mostly uses them in its own data centers and rents them out through its cloud.',
        reasons: [
          { kind: 'tech', text: 'Google designs its own AI chips.' },
          { kind: 'brand', text: 'Almost everyone uses Google every day.' },
          { kind: 'cost', text: 'It buys fewer chips from other companies.' },
        ],
      },
    ],
  },
  {
    ticker: 'AAPL',
    name: 'Apple',
    logo: `${LOGO}aapl.png`,
    tip: 'SONY',
    competitors: [
      {
        ticker: 'GOOG',
        name: 'Google',
        ring: 1,
        x: 93,
        y: 201,
        why: 'Google makes Android, the software on most phones that aren’t iPhones, and its own Pixel phones. When people pick a new phone, they usually pick between the two.',
        reasons: [
          { kind: 'tech', text: 'Google makes Android, used on most phones.' },
          { kind: 'brand', text: 'Almost everyone uses Google every day.' },
          { kind: 'cost', text: 'Android is free for phone makers to use.' },
        ],
      },
      {
        ticker: 'MSFT',
        name: 'Microsoft',
        ring: 1,
        x: 231,
        y: 207,
        why: 'Microsoft makes Windows, the software on most computers in the world. Lots of people pick between a Mac and a Windows laptop.',
        reasons: [
          { kind: 'tech', text: 'Microsoft makes Windows and Office.' },
          { kind: 'brand', text: 'Most computers in the world run Windows.' },
          { kind: 'cost', text: 'There’s a Windows laptop for every budget.' },
        ],
      },
      {
        ticker: 'AMZN',
        name: 'Amazon',
        ring: 2,
        x: 66,
        y: 107,
        why: 'Amazon makes Echo speakers, Kindles, and Fire tablets, and its helper Alexa goes up against Siri. It also has Prime Video, a rival to Apple TV.',
        reasons: [
          { kind: 'tech', text: 'Amazon’s Alexa talks to you, like Siri.' },
          { kind: 'brand', text: 'Everyone knows Amazon.' },
          { kind: 'cost', text: 'Amazon sells its gadgets at low prices.' },
        ],
      },
      {
        ticker: 'META',
        name: 'Meta',
        ring: 2,
        x: 222,
        y: 277,
        why: 'Meta makes Quest headsets, which go up against Apple’s Vision Pro. It also runs Instagram and WhatsApp, where people spend lots of time on their phones.',
        reasons: [
          { kind: 'tech', text: 'Meta builds virtual reality headsets.' },
          { kind: 'brand', text: 'Billions of people use Instagram and WhatsApp.' },
          { kind: 'cost', text: 'Quest headsets cost much less than Apple’s.' },
        ],
      },
      {
        ticker: 'SONY',
        name: 'Sony',
        ring: 3,
        x: 306,
        y: 99,
        why: 'Sony makes headphones and PlayStation, so it competes with Apple in a few spots. It also makes the camera sensors in iPhones, so they work together too.',
        reasons: [
          { kind: 'tech', text: 'Sony makes some of the best camera sensors.' },
          { kind: 'brand', text: 'PlayStation is famous everywhere.' },
          { kind: 'cost', text: 'Sony makes its own camera parts.' },
        ],
      },
      {
        ticker: 'DELL',
        name: 'Dell',
        ring: 3,
        x: 59,
        y: 299,
        why: 'Dell makes laptops and desktop computers, mostly for schools and offices. Some people choose a Dell instead of a Mac, but Dell doesn’t make phones.',
        reasons: [
          { kind: 'tech', text: 'Dell builds big computers for data centers.' },
          { kind: 'brand', text: 'Schools and offices everywhere use Dell.' },
          { kind: 'cost', text: 'Dell builds computers once you order them.' },
        ],
      },
    ],
  },
  {
    ticker: 'NKE',
    name: 'Nike',
    tip: 'PUMSY',
    competitors: [
      {
        ticker: 'ADDYY',
        name: 'Adidas',
        ring: 1,
        x: 233,
        y: 149,
        why: 'Adidas makes running shoes, soccer cleats, and sportswear, just like Nike. They’re the two biggest sportswear companies in the world.',
        reasons: [
          { kind: 'tech', text: 'Adidas makes Boost foam for bouncy shoes.' },
          { kind: 'brand', text: 'Everyone knows the three stripes.' },
          { kind: 'cost', text: 'Huge batches make each pair cheaper.' },
        ],
      },
      {
        ticker: 'LULU',
        name: 'Lululemon',
        ring: 1,
        x: 93,
        y: 149,
        why: 'Lululemon makes workout clothes, like yoga pants and running shorts, and now sneakers too. Lots of people pick between Nike and Lululemon when they shop for gym clothes.',
        reasons: [
          { kind: 'tech', text: 'Lululemon invents its own stretchy fabrics.' },
          { kind: 'brand', text: 'Lululemon’s yoga pants are famous.' },
          { kind: 'cost', text: 'No other store takes a cut of its sales.' },
        ],
      },
      {
        ticker: 'UAA',
        name: 'Under Armour',
        ring: 2,
        x: 73,
        y: 251,
        why: 'Under Armour makes sports clothes and shoes, and lots of athletes wear it. It’s much smaller than Nike, so it doesn’t compete everywhere.',
        reasons: [
          { kind: 'tech', text: 'Under Armour made sweat-wicking shirts popular.' },
          { kind: 'brand', text: 'Football and gym fans know the UA logo.' },
          { kind: 'cost', text: 'Under Armour sells lots of gear at outlet prices.' },
        ],
      },
      {
        ticker: 'ONON',
        name: 'On',
        ring: 2,
        x: 260,
        y: 243,
        why: 'On is a Swiss company that makes running shoes, and it’s growing fast. Runners who used to buy Nike are trying On instead.',
        reasons: [
          { kind: 'tech', text: 'On’s shoes have bouncy pods on the bottom.' },
          { kind: 'brand', text: 'Tennis star Roger Federer helped build On.' },
          { kind: 'cost', text: 'On doesn’t pay to run its own factories.' },
        ],
      },
      {
        ticker: 'SKX',
        name: 'Skechers',
        ring: 3,
        x: 13,
        y: 236,
        why: 'Skechers makes comfy everyday shoes for walking and school. It doesn’t go after star athletes the way Nike does, so it sits farther out.',
        reasons: [
          { kind: 'tech', text: 'Skechers makes hands-free slip-in shoes.' },
          { kind: 'brand', text: 'Skechers is famous for comfy shoes.' },
          { kind: 'cost', text: 'Skechers keeps its prices low for families.' },
        ],
      },
      {
        ticker: 'PUMSY',
        name: 'Puma',
        ring: 3,
        x: 306,
        y: 99,
        why: 'Puma makes soccer cleats, sneakers, and sportswear. It’s a lot smaller than Nike, so it sits farther out.',
        reasons: [
          { kind: 'tech', text: 'Puma makes Nitro foam for fast running shoes.' },
          { kind: 'brand', text: 'Soccer stars and racing teams wear Puma.' },
          { kind: 'cost', text: 'Puma’s sneakers usually cost less than Nike’s.' },
        ],
      },
    ],
  },
  {
    ticker: 'DIS',
    name: 'Disney',
    tip: 'AAPL',
    competitors: [
      {
        ticker: 'NFLX',
        name: 'Netflix',
        ring: 1,
        x: 98,
        y: 213,
        why: 'Netflix is a streaming app full of movies and shows, just like Disney+. Families often have to choose which one to pay for.',
        reasons: [
          { kind: 'tech', text: 'Netflix is great at picking what to watch.' },
          { kind: 'brand', text: 'Netflix is the biggest streaming app in the world.' },
          { kind: 'cost', text: 'Millions of members help pay for each show.' },
        ],
      },
      {
        ticker: 'WBD',
        name: 'Warner Bros. Discovery',
        ring: 1,
        x: 237,
        y: 188,
        why: 'Warner Bros. Discovery makes movies and shows, like Harry Potter, Batman, and HBO shows. It has its own streaming app, HBO Max, just like Disney+.',
        reasons: [
          { kind: 'tech', text: 'Warner Bros. runs a giant movie studio.' },
          { kind: 'brand', text: 'Batman and Harry Potter are famous everywhere.' },
          { kind: 'cost', text: 'It owns tons of old movies to stream.' },
        ],
      },
      {
        ticker: 'CMCSA',
        name: 'Comcast',
        ring: 2,
        x: 66,
        y: 107,
        why: 'Comcast owns Universal, which makes movies and runs theme parks, and the streaming app Peacock. Universal’s parks go up against Disney World.',
        reasons: [
          { kind: 'tech', text: 'Comcast brings internet to millions of homes.' },
          { kind: 'brand', text: 'Universal made Jurassic Park and the Minions.' },
          { kind: 'cost', text: 'Owning NBC gives Peacock lots of shows.' },
        ],
      },
      {
        ticker: 'PARA',
        name: 'Paramount',
        ring: 2,
        x: 231,
        y: 272,
        why: 'Paramount makes movies like Top Gun, owns Nickelodeon, and has its own streaming app, Paramount+. It competes with Disney for kids’ shows and movies.',
        reasons: [
          { kind: 'tech', text: 'Paramount runs its own big movie studio.' },
          { kind: 'brand', text: 'SpongeBob lives on Paramount’s Nickelodeon.' },
          { kind: 'cost', text: 'Owning CBS gives Paramount+ lots of shows.' },
        ],
      },
      {
        ticker: 'AAPL',
        name: 'Apple',
        ring: 3,
        x: 306,
        y: 99,
        logo: `${LOGO}aapl.png`,
        why: 'Apple has its own streaming app, Apple TV, with shows and movies. It’s much smaller than Disney+, and Apple makes most of its money from iPhones.',
        reasons: [
          { kind: 'tech', text: 'Apple makes iPhones and Apple TV boxes.' },
          { kind: 'brand', text: 'Everyone knows Apple.' },
          { kind: 'cost', text: 'Apple pays for big shows with iPhone money.' },
        ],
      },
      {
        ticker: 'AMZN',
        name: 'Amazon',
        ring: 3,
        x: 77,
        y: 312,
        why: 'Amazon has Prime Video and owns MGM, the movie studio behind James Bond. Streaming is a small part of Amazon, which mostly sells stuff online.',
        reasons: [
          { kind: 'tech', text: 'Amazon’s huge computers stream the video.' },
          { kind: 'brand', text: 'Everyone knows Amazon.' },
          { kind: 'cost', text: 'Prime Video comes free with Prime.' },
        ],
      },
    ],
  },
]
