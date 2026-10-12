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
   (Figma 201633:65798) and its two fly-up sheets: a competitor's
   (201633:65799) and the chart explainer behind the "i" (201633:65803).
   The plate picks the company with the plate grammar's pill tabs (the
   same row as The first lap's); the card is Greenlight's own product
   surface, so it wears Greenlight's palette (moat.module.css) while
   everything around it stays on the site's tokens. Tap a chip or the
   "i" and a sheet rises from the card's bottom edge over a scrim
   clipped to the card. */

const ASSET = '/case/greenlight-invest/moat/'
/* constant ids: programs/case islands can't use useId (hydration, see
   memory) and there is one bullseye on the page */
const TITLE_ID = 'moat-sheet-title'
const INFO_TITLE_ID = 'moat-info-title'
const PANEL_ID = 'moat-sheet-panel'
const STAGE_ID = 'moat-stage'
const tabId = (t: string) => `moat-tab-${t}`
/* the bubble sits 6px right of Figma's spot: with the ring pills now
   centred, Figma's spot left ~1px between it and the "Competitors"
   pill. The arrow still lands on the chip (286–326 across). */
const TIP_NUDGE = 6

/* which sheet is up: a competitor's (by ticker) or the explainer */
type Open = { kind: 'competitor'; ticker: string } | { kind: 'info' } | null

export function MoatPlate() {
  const [ticker, setTicker] = useState(MOAT_COMPANIES[0].ticker)
  const [open, setOpen] = useState<Open>(null)
  const [seen, setSeen] = useState(false) // any competitor sheet opened: the tooltip retires
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const company = MOAT_COMPANIES.find((c) => c.ticker === ticker) ?? MOAT_COMPANIES[0]

  /* a switch closes any open sheet; focus stays on the tabs */
  const pickCompany = (k: number, focus = false) => {
    const next = MOAT_COMPANIES[k].ticker
    if (focus) tabRefs.current[k]?.focus()
    if (next === ticker) return
    sfx.tap()
    setOpen(null)
    setTicker(next)
  }

  return (
    <Plate cap="Competitors">
      <MoatCard
        company={company}
        open={open}
        setOpen={setOpen}
        seen={seen}
        onFirstOpen={() => setSeen(true)}
      />
      <div
        className={`${caseStyles.plateTabs} ${caseStyles.lapTabs}`}
        role="tablist"
        aria-label="Company"
        onKeyDown={(e) => {
          const k = MOAT_COMPANIES.findIndex((c) => c.ticker === ticker)
          const n = MOAT_COMPANIES.length
          const to =
            e.key === 'ArrowRight' ? (k + 1) % n
            : e.key === 'ArrowLeft' ? (k - 1 + n) % n
            : e.key === 'Home' ? 0
            : e.key === 'End' ? n - 1
            : null
          if (to === null) return
          e.preventDefault()
          pickCompany(to, true)
        }}
      >
        {MOAT_COMPANIES.map((c, k) => (
          <button
            key={c.ticker}
            ref={(el) => {
              tabRefs.current[k] = el
            }}
            id={tabId(c.ticker)}
            type="button"
            role="tab"
            className={caseStyles.plateTab}
            aria-selected={c.ticker === ticker}
            aria-controls={STAGE_ID}
            aria-label={tickerLabel(c)}
            tabIndex={c.ticker === ticker ? 0 : -1}
            onClick={() => pickCompany(k)}
          >
            {c.ticker}
          </button>
        ))}
      </div>
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
  open: Open
  setOpen: (o: Open) => void
  seen: boolean
  onFirstOpen: () => void
}) {
  const reduced = useReducedMotion()
  const chipRefs = useRef(new Map<string, HTMLButtonElement>())
  const infoRef = useRef<HTMLButtonElement>(null)
  const opener = useRef<string | null>(null) // a chip's ticker, or 'info'
  const restore = useRef(false)

  const swap = reduced ? { duration: 0 } : SPRINGS.widget
  const rise = reduced ? { duration: 0 } : SPRINGS.window
  const tip = company.competitors.find((c) => c.ticker === company.tip)
  const shown =
    open?.kind === 'competitor' ? company.competitors.find((c) => c.ticker === open.ticker) ?? null : null
  const up = shown !== null || open?.kind === 'info'

  const openSheet = (c: Competitor) => {
    sfx.tap()
    opener.current = c.ticker
    onFirstOpen()
    setOpen({ kind: 'competitor', ticker: c.ticker })
  }

  const openInfo = () => {
    sfx.tap()
    opener.current = 'info'
    setOpen({ kind: 'info' })
  }

  const close = () => {
    restore.current = true
    setOpen(null)
  }

  /* focus goes back to whatever opened the sheet, a chip or the "i"
     (company switches close it without this, so focus stays on the tabs) */
  useEffect(() => {
    if (open || !restore.current) return
    restore.current = false
    const el = opener.current === 'info' ? infoRef.current : opener.current ? chipRefs.current.get(opener.current) : undefined
    el?.focus({ preventScroll: true })
  }, [open])

  return (
    <div
      id={STAGE_ID}
      className={styles.stage}
      role="tabpanel"
      aria-labelledby={tabId(company.ticker)}
    >
      <div className={styles.frame}>
        <div className={styles.card}>
          <div className={styles.content} inert={up}>
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
              <button
                ref={infoRef}
                type="button"
                className={styles.info}
                aria-label="What this chart shows"
                aria-haspopup="dialog"
                onClick={openInfo}
              >
                <img src={`${ASSET}icon-info.svg`} alt="" width={24} height={24} />
              </button>
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

              {/* ring labels ride above the chips, centred on the rings'
                  vertical axis (Figma sets them 14px right of it) */}
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
                    style={{ left: tip.x - 99 + TIP_NUDGE, top: tip.y - 52 }}
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
            {up && (
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
                onPick={(t) => setOpen({ kind: 'competitor', ticker: t })}
                onClose={close}
                transition={rise}
                reduced={!!reduced}
              />
            )}
            {open?.kind === 'info' && (
              <InfoSheet key="info" company={company} onClose={close} transition={rise} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/* the sheet's shell: rises from the card's bottom edge, Escape closes */
function SheetShell({
  titleId,
  title,
  onClose,
  transition,
  className,
  closeRef,
  children,
}: {
  titleId: string
  title: React.ReactNode
  onClose: () => void
  transition: object
  className?: string
  closeRef?: React.Ref<HTMLButtonElement>
  children: React.ReactNode
}) {
  return (
    <motion.div
      className={className ? `${styles.sheet} ${className}` : styles.sheet}
      role="dialog"
      aria-labelledby={titleId}
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
        <h3 id={titleId} className={styles.sheetTitle}>
          {title}
        </h3>
        <button ref={closeRef} type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          <img src={`${ASSET}icon-close.svg`} alt="" width={24} height={24} />
        </button>
      </div>
      {children}
    </motion.div>
  )
}

/* the chart explainer behind the "i" (Figma 201633:65803). Copy is the
   Figma node's, with its stray brackets dropped and the company swapped
   in. The assistant prompt row is drawn to match the design and does
   nothing: there is no assistant on this page. */
function InfoSheet({
  company,
  onClose,
  transition,
}: {
  company: MoatCompany
  onClose: () => void
  transition: object
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const name = company.name

  /* the close button is the sheet's only control: focus lands there */
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <SheetShell
      titleId={INFO_TITLE_ID}
      title={<>{company.ticker}&rsquo;s competitors</>}
      onClose={onClose}
      transition={transition}
      className={styles.infoSheet}
      closeRef={closeRef}
    >
      <div className={styles.explain}>
        <p>
          This chart shows how closely other major companies compete with {name}. The closer a logo is to
          the center, the more directly it rivals {name} in areas like {company.areas}. It helps you see who{' '}
          {name} is really up against, and who&rsquo;s playing a more distant role in the space.
        </p>
        <p>Tap any of the competitors on the chart to learn more about them and how they compare.</p>
      </div>
      <div className={styles.prompt}>
        <img src={`${ASSET}icon-assistant.svg`} alt="" width={40} height={40} />
        <span className={styles.promptText}>
          <span>Is {name} a strong company in</span> <span>their industry?</span>
        </span>
        <img src={`${ASSET}icon-chevron-right.svg`} alt="" width={24} height={24} />
      </div>
    </SheetShell>
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
    <SheetShell
      titleId={TITLE_ID}
      title={<>{company.ticker}&rsquo;s competitors</>}
      onClose={onClose}
      transition={transition}
    >
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
    </SheetShell>
  )
}
