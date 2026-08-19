import { useEffect } from 'react'
import type { Meta, StoryObj, Decorator } from '@storybook/react'
import { CommandWidget } from './CommandWidget'

/* COMMAND.CTR, ambient form — the orchestration deck's permanent seat in the
   menu bar. A glyph button on the same footprint sound and theme share, an LED
   that lights only when a session is genuinely running, and a hover card under
   it carrying the state, the cast and the leading edge of the feed.

   TWO STATES, and the difference is carried by TEXT, DOT SHAPE and ELEVATION
   before it is carried by colour or motion. LIVE: a real Claude session
   reported to /api/cc-feed inside the last fifteen minutes, so the card lifts
   onto --surface-raised behind a full-weight frame, fills its dot with
   --accent-expressive and reads LIVE. IDLE: no session, so the card sits flush
   on --surface behind a hairline with a hollow dot and reads how long ago the
   last one was. A dormant instrument, never a disabled control.

   WHERE THE DATA COMES FROM IN THESE STORIES. On the desk the widget polls
   /api/cc-feed. There is no server behind a static catalog, so the stories
   stub `fetch` for the one route and hand back a fixed payload — the shape the
   route really returns, timestamps computed off `Date.now()` so LIVE stays
   live whenever the story is opened. The stub goes up before the component
   mounts and comes down when the story leaves. The widget itself is untouched:
   it does the same poll, the same crew-id filter, the same freshness maths.

   ONE THING THE STUB CANNOT REACH: the widget refuses to poll at all while
   the tab is hidden, because every poll can cost a billed Blob list() and a
   background tab polling all night is real money for nobody's eyes. So a
   catalog opened in a hidden preview pane shows IDLE on every story here until
   the tab comes forward. That is the component being careful, not the stories
   being wrong.

   HOVER REVEALS, CLICK ESCALATES (Jake, s66). Resting on the glyph brings the
   card up; clicking the glyph or the card opens the deck. There is no click
   that only shows the card, so the stories that want the card up focus the
   glyph instead — focus is the keyboard's hover here, and it runs the same
   reveal path. */

type Ev = { t: number; agent: string; action: string; target?: string; label: string; redact?: boolean }

const MINUTE = 60_000

/* ONE STUB, INSTALLED ONCE. Wrapping fetch inside the decorator instead would
   wrap the previous wrapper every time a story re-rendered, and the chain
   would never come down. So the real fetch is captured at module load, the
   wrapper goes on once, and the only thing the stories move is `FEED`. With
   FEED null the wrapper is transparent — every other story in the catalog
   makes the same request it always did. */
const REAL_FETCH = typeof window !== 'undefined' ? window.fetch.bind(window) : null

let FEED: { updated: number; events: Ev[] } | null = null

if (REAL_FETCH) {
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    if (FEED && url.includes('/api/cc-feed')) {
      return Promise.resolve(
        new Response(JSON.stringify(FEED), { headers: { 'content-type': 'application/json' } }),
      )
    }
    return REAL_FETCH(input, init)
  }) as typeof window.fetch
}

/** Point the stub at one payload for the length of a story. Set during render
    because the widget polls from an effect, which runs after; cleared on
    unmount so the next story starts from a machine with no feed. */
function withFeed(updated: number, events: Ev[]): Decorator {
  return (Story) => {
    FEED = { updated, events }
    /* eslint-disable-next-line react-hooks/rules-of-hooks */
    useEffect(() => () => {
      FEED = null
    }, [])
    return <Story />
  }
}

const LIVE_FEED: Ev[] = [
  { t: Date.now() - 9 * MINUTE, agent: 'hertz', action: 'return', label: 'READ THE SHELF STORE' },
  { t: Date.now() - 3 * MINUTE, agent: 'nyquist', action: 'dispatch', label: 'WROTE THE MENU BAR STORIES' },
]

const meta = {
  title: 'Shell/CommandWidget',
  component: CommandWidget,
  /* The card hangs from the button's bottom-right corner and is 320px wide, so
     the frame needs room under and to the left of the glyph or the story
     clips its own subject. */
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: 380, paddingBottom: 220 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CommandWidget>

export default meta
type Story = StoryObj<typeof meta>

/** Focus the glyph. Focus is the keyboard's hover on this control, so it runs
    the same reveal the pointer does, and it is the one path a story can drive
    without faking a pointer.

    The focusin goes out by hand as well as through .focus(). A browser window
    that does not itself have focus — a snapshot runner, a background tab, a
    preview pane — moves activeElement on .focus() and sends no event, and the
    card would never come up in exactly the places a catalog gets looked at
    automatically. Same event the browser sends, sent deliberately. */
const revealCard = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const glyph = canvasElement.querySelector<HTMLButtonElement>('button')
  glyph?.focus()
  glyph?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 400))
}

/* Resting. Just the glyph on its menu-bar footprint, no LED, nothing revealed.
   This is what the bar looks like almost all of the time. */
export const Resting: Story = {
  decorators: [withFeed(Date.now() - 6 * 60 * MINUTE, LIVE_FEED)],
}

/* LIVE. A session reported three minutes ago, so the LED is lit on the glyph
   and the card is up: filled dot, LIVE, the cast with NYQUIST picked out, and
   the leading edge of the feed spelled out under it. */
export const Live: Story = {
  decorators: [withFeed(Date.now() - 3 * MINUTE, LIVE_FEED)],
  play: revealCard,
}

/* IDLE. The last session was six hours ago — past the fifteen-minute freshness
   window — so the LED is off, the dot is hollow and the stamp reads the age
   instead of a state. The card still offers the deck, because the point of the
   idle state is that the way in never closes. */
export const Idle: Story = {
  decorators: [withFeed(Date.now() - 6 * 60 * MINUTE, LIVE_FEED)],
  play: revealCard,
}

/* REDACTED. A live report can mark itself classified until it ships, and the
   deck honours that inline: the label is replaced by a redaction bar with its
   own accessible name, and the crew member is still named. Worth a story
   because it is the one branch in the card that changes the shape of the row
   rather than its wording. */
export const Redacted: Story = {
  decorators: [
    withFeed(Date.now() - 2 * MINUTE, [
      { t: Date.now() - 2 * MINUTE, agent: 'fable', action: 'dispatch', label: 'CLASSIFIED', redact: true },
    ]),
  ],
  play: revealCard,
}

/* NO TRAFFIC. The feed is reachable and empty — a fresh deployment, or a
   window with nothing in it. The card reads CREW ASLEEP rather than an error,
   which is the rule the whole widget follows: the feed only ever ages the chip
   downwards, and never takes the door away. */
export const NoTraffic: Story = {
  name: 'No traffic',
  decorators: [withFeed(0, [])],
  play: revealCard,
}
