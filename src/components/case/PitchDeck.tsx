import styles from './case.module.css'

/* Plate 01 — the pitch, end to end. Nine groups exported from the
   vision deck (Figma 201266-2467), each padded onto the same 825px
   canvas so the strip reads as one continuous slide under a single
   horizontal scroll. The deck's footer is live text pinned below the
   scroll, per the source frame. Background #000 is the slide fill
   sampled from that frame — GL's deck artifact, not LUNDE OS chrome,
   so it stays a hardcode (guardrail §5). */

const BASE = '/case/family-hub/pitch'

const SLIDES: Array<[file: string, w: number, alt: string]> = [
  ['01-ingredients', 1821, 'Deck intro — “Greenlight helps your family plan, stay organized, and connected,” with the family, their needs, and the feature list'],
  ['02-mobile', 732, 'The mobile companion — home-screen widget plus a detailed planning view, shown on two phones'],
  ['03-ambient', 1085, 'The home display in its morning ambient state — just what the family needs at a glance to start the day'],
  ['04-day', 1085, 'Happening Now — the day view'],
  ['05-week', 1085, 'This Week — the week view'],
  ['06-month', 1085, 'This Month — the full month view'],
  ['07-ask', 1085, 'Ask GL — the assistant, invoked from the hub'],
  ['08-thinking', 1085, 'The assistant thinking'],
  ['09-response', 1085, 'The assistant responding — a new component with related prompts and next steps'],
]

export function PitchDeck() {
  return (
    <div className={styles.deck}>
      <div
        className={styles.deckScroll}
        tabIndex={0}
        role="group"
        aria-label="Vision-deck strip — scrolls horizontally"
      >
        {SLIDES.map(([file, w, alt]) => (
          <img
            key={file}
            src={`${BASE}/${file}.webp`}
            width={w}
            height={825}
            alt={alt}
            loading="lazy"
            draggable={false}
          />
        ))}
      </div>
      <div className={styles.deckFooter}>
        <span>GLX product design</span>
        <span>2025</span>
      </div>
    </div>
  )
}
