'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Plate } from './CaseComponents'
import { SPRINGS } from '@/lib/motion'
import { sfx } from '@/lib/sound'
import caseStyles from './case.module.css'
import styles from './moat.module.css'
import {
  MOAT_COMPANIES,
  REASON_LABELS,
  RING_NAMES,
  type Competitor,
  type MoatCompany,
} from './moatData'

/* The competitors bullseye: a rebuild of Greenlight's real "detailCard"
   (Figma 201633:65798) and its fly-up sheet (201633:65799). The plate
   picks the company; the card is Greenlight's own product surface, so
   it wears Greenlight's palette (moat.module.css) while everything
   around it stays on the site's tokens. Tap a chip and the sheet rises
   from the card's bottom edge over a scrim clipped to the card. */

const ASSET = '/case/greenlight-invest/moat/'
/* constant ids: programs/case islands can't use useId (hydration, see
   memory) and there is one bullseye on the page */
const TITLE_ID = 'moat-sheet-title'
const PANEL_ID = 'moat-sheet-panel'

export function MoatPlate() {
  const [ticker, setTicker] = useState(MOAT_COMPANIES[0].ticker)
  const [open, setOpen] = useState<string | null>(null) // competitor shown in the sheet
  const [seen, setSeen] = useState(false) // any sheet opened: the tooltip retires
  const company = MOAT_COMPANIES.find((c) => c.ticker === ticker) ?? MOAT_COMPANIES[0]

  const pickCompany = (t: string) => {
    if (t === ticker) return
    sfx.tap()
    setOpen(null)
    setTicker(t)
  }

  return (
    <Plate
      cap="Competitors"
      chip={
        <span className={caseStyles.fidChip} role="group" aria-label="Company">
          {MOAT_COMPANIES.map((c) => (
            <button
              key={c.ticker}
              type="button"
              className={caseStyles.fidChipSeg}
              aria-pressed={c.ticker === ticker}
              aria-label={tickerLabel(c)}
              onClick={() => pickCompany(c.ticker)}
            >
              {c.ticker}
            </button>
          ))}
        </span>
      }
    >
      <MoatCard
        company={company}
        open={open}
        setOpen={setOpen}
        seen={seen}
        onFirstOpen={() => setSeen(true)}
      />
    </Plate>
  )
}

/* visible text stays inside the accessible name (WCAG 2.5.3): "AAPL, Apple" */
const tickerLabel = (c: { ticker: string; name: string }) =>
  c.name === c.ticker ? undefined : `${c.ticker}, ${c.name}`

function Chip({ ticker, logo, big }: { ticker: string; logo?: string; big?: boolean }) {
  const size = big ? 64 : 40
  return logo ? (
    <img className={styles.logo} src={logo} alt="" width={size} height={size} draggable={false} />
  ) : (
    <span className={big ? `${styles.textChip} ${styles.textChipBig}` : styles.textChip}>{ticker}</span>
  )
}

function MoatCard({
  company,
  open,
  setOpen,
  seen,
  onFirstOpen,
}: {
  company: MoatCompany
  open: string | null
  setOpen: (t: string | null) => void
  seen: boolean
  onFirstOpen: () => void
}) {
  const reduced = useReducedMotion()
  const chipRefs = useRef(new Map<string, HTMLButtonElement>())
  const opener = useRef<string | null>(null)
  const restore = useRef(false)

  const swap = reduced ? { duration: 0 } : SPRINGS.widget
  const rise = reduced ? { duration: 0 } : SPRINGS.window
  const tip = company.competitors.find((c) => c.ticker === company.tip)
  const shown = company.competitors.find((c) => c.ticker === open) ?? null

  const openSheet = (c: Competitor) => {
    sfx.tap()
    opener.current = c.ticker
    onFirstOpen()
    setOpen(c.ticker)
  }

  const close = () => {
    restore.current = true
    setOpen(null)
  }

  /* focus goes back to the chip that opened the sheet (company switches
     close it without this, so focus stays on the picker) */
  useEffect(() => {
    if (open || !restore.current) return
    restore.current = false
    const el = opener.current ? chipRefs.current.get(opener.current) : undefined
    el?.focus({ preventScroll: true })
  }, [open])

  return (
    <div className={styles.stage}>
      <div className={styles.frame}>
        <div className={styles.card}>
          <div className={styles.content} inert={open !== null}>
            <div className={styles.titleRow}>
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={company.ticker}
                  className={styles.title}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={swap}
                >
                  {company.ticker}&rsquo;s competitors
                </motion.span>
              </AnimatePresence>
              <img className={styles.info} src={`${ASSET}icon-info.svg`} alt="" width={24} height={24} aria-hidden="true" />
            </div>

            <div
              className={styles.chart}
              role="group"
              aria-label={`${company.name}’s competitors. The closer a company sits to the middle, the more directly it competes.`}
            >
              <span className={`${styles.ring} ${styles.ringOuter}`} aria-hidden="true" />
              <span className={`${styles.ring} ${styles.ringMid}`} aria-hidden="true" />
              <span className={`${styles.ring} ${styles.ringInner}`} aria-hidden="true" />

              <AnimatePresence initial={false}>
                <motion.div
                  key={company.ticker}
                  className={styles.layer}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={swap}
                >
                  <span className={styles.center} role="img" aria-label={company.name}>
                    <Chip ticker={company.ticker} logo={company.logo} big />
                  </span>
                  {company.competitors.map((c) => (
                    <motion.button
                      key={c.ticker}
                      ref={(el: HTMLButtonElement | null) => {
                        if (el) chipRefs.current.set(c.ticker, el)
                        else chipRefs.current.delete(c.ticker)
                      }}
                      type="button"
                      className={styles.orbit}
                      style={{ left: c.x - 20, top: c.y - 20 }}
                      aria-label={`${c.name}, ${RING_NAMES[c.ring].one}`}
                      aria-haspopup="dialog"
                      whileTap={reduced ? undefined : { scale: 0.92 }}
                      transition={SPRINGS.deck}
                      onClick={() => openSheet(c)}
                    >
                      <Chip ticker={c.ticker} logo={c.logo} />
                    </motion.button>
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* ring labels ride above the chips, as in the Figma card */}
              <span className={styles.pill} style={{ top: 0 }} aria-hidden="true">
                {RING_NAMES[3].pill}
              </span>
              <span className={styles.pill} style={{ top: 41 }} aria-hidden="true">
                {RING_NAMES[2].pill}
              </span>
              <span className={styles.pill} style={{ top: 82 }} aria-hidden="true">
                {RING_NAMES[1].pill}
              </span>

              <AnimatePresence initial={false}>
                {!seen && tip && (
                  <motion.span
                    key={`tip-${company.ticker}`}
                    className={styles.tooltip}
                    style={{ left: tip.x - 99, top: tip.y - 52 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={swap}
                    aria-hidden="true"
                  >
                    Tap to learn more
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {shown && (
              <motion.div
                key="scrim"
                className={styles.scrim}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduced ? { duration: 0 } : { duration: 0.2 }}
                onClick={close}
                aria-hidden="true"
              />
            )}
            {shown && (
              <Sheet
                key="sheet"
                company={company}
                shown={shown}
                onPick={(t) => setOpen(t)}
                onClose={close}
                transition={rise}
                reduced={!!reduced}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function Sheet({
  company,
  shown,
  onPick,
  onClose,
  transition,
  reduced,
}: {
  company: MoatCompany
  shown: Competitor
  onPick: (t: string) => void
  onClose: () => void
  transition: object
  reduced: boolean
}) {
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())
  const strip = useRef<HTMLDivElement>(null)
  const list = company.competitors

  /* focus lands on the selected tab when the sheet opens */
  useEffect(() => {
    tabRefs.current.get(shown.ticker)?.focus({ preventScroll: true })
    // open only: later tab changes move focus themselves
  }, [])

  /* keep the selected tab inside the strip, which scrolls sideways */
  useEffect(() => {
    const el = tabRefs.current.get(shown.ticker)
    const s = strip.current
    if (!el || !s) return
    const pad = 16
    const left = el.offsetLeft - pad
    const right = el.offsetLeft + el.offsetWidth + pad - s.clientWidth
    const to = s.scrollLeft > left ? left : s.scrollLeft < right ? right : s.scrollLeft
    if (to !== s.scrollLeft) s.scrollTo({ left: to, behavior: reduced ? 'auto' : 'smooth' })
  }, [shown.ticker, reduced])

  const pickAt = (i: number) => {
    const c = list[(i + list.length) % list.length]
    sfx.tap()
    onPick(c.ticker)
    tabRefs.current.get(c.ticker)?.focus({ preventScroll: true })
  }

  const onTabKey = (e: React.KeyboardEvent) => {
    const i = list.findIndex((c) => c.ticker === shown.ticker)
    const keys: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }
    if (e.key in keys) {
      e.preventDefault()
      pickAt(keys[e.key])
    }
  }

  return (
    <motion.div
      className={styles.sheet}
      role="dialog"
      aria-labelledby={TITLE_ID}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={transition}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onClose()
        }
      }}
    >
      <div className={styles.sheetHead}>
        <h3 id={TITLE_ID} className={styles.sheetTitle}>
          {company.ticker}&rsquo;s competitors
        </h3>
        <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          <img src={`${ASSET}icon-close.svg`} alt="" width={24} height={24} />
        </button>
      </div>

      <div ref={strip} className={styles.tabs} role="tablist" aria-label="Competitors">
        {list.map((c) => {
          const on = c.ticker === shown.ticker
          return (
            <button
              key={c.ticker}
              ref={(el) => {
                if (el) tabRefs.current.set(c.ticker, el)
                else tabRefs.current.delete(c.ticker)
              }}
              type="button"
              role="tab"
              className={styles.tab}
              aria-selected={on}
              aria-controls={PANEL_ID}
              aria-label={tickerLabel(c)}
              tabIndex={on ? 0 : -1}
              onClick={() => {
                if (on) return
                sfx.tap()
                onPick(c.ticker)
              }}
              onKeyDown={onTabKey}
            >
              {c.ticker}
            </button>
          )
        })}
      </div>

      <div id={PANEL_ID} role="tabpanel" aria-label={shown.name} className={styles.panel}>
        <h4 className={styles.why}>Why they&rsquo;re {RING_NAMES[shown.ring].plural}</h4>
        <p className={styles.body}>{shown.why}</p>
        <ul className={styles.traits}>
          {shown.reasons.map((r) => (
            <li key={r.kind}>
              <span className={styles.traitLabel}>
                <span className={styles.traitEmoji} aria-hidden="true">{REASON_LABELS[r.kind].emoji}</span>{REASON_LABELS[r.kind].label}
              </span>
              <span className={styles.traitText}>{r.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}
