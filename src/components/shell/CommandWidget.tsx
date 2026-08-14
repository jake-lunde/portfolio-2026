'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import { useWindows } from '@/store/windows'
import { useSettings } from '@/store/settings'
import { sfx } from '@/lib/sound'
import { t } from '@/content/copy'
import { CREW, CREW_BY_ID, HUMAN, HUMAN_PORTRAIT, avatarFor, isCrewId } from './crew'
import { Icon } from './Icon'
import shellStyles from './shell.module.css'
import styles from './commandWidget.module.css'

/* COMMAND.CTR, ambient form — the orchestration deck's permanent seat in
   the OS. There is no desktop icon for it; this control and the
   /command deep link are the two ways in.

   Round 4: Jake's ruling that this is system chrome, not a floating
   desktop widget — it moved into the menu bar. The trigger is a glyph
   button on the exact footprint sound/theme/palette share
   (shellStyles.menuGlyphBtn), the program's own 'nodes' icon, plus a
   status LED (Dock.tsx's own language: a 4px var(--accent) dot,
   rendered only when lit, never just recoloured). Click toggles a
   popover anchored under the button; the popover's CONTENT below —
   state, CAST, leading edge, way in — is the same chip this file drew
   before the move, re-homed rather than redesigned. Data flow and
   polling are untouched; only where it renders and how it opens moved.

   One row, one target, four things in it: the state, the CAST (Jake's
   monogram at the head of the line, then the five units, the one named
   by the latest event lit), the LEADING EDGE of the feed inline, and
   the way in — an arrow that surfaces on hover (the spelled-out ENTER
   COMMAND CENTER line survives only on mobile, where there is no hover).

   Two states, and the difference is carried by TEXT, DOT SHAPE and
   ELEVATION before it is carried by colour or motion:

   LIVE  a real Claude session has reported to /api/cc-feed inside the
         last 15 minutes. The chip lifts onto --surface-raised behind a
         full-weight frame, fills its dot with --accent-expressive (with
         a pulse where motion is allowed) and reads "LIVE". The menu bar
         LED is keyed on this same boolean.
   IDLE  no session running. The chip sits flush on --surface behind a
         hairline with a hollow dot and reads how long ago the last
         session was — a dormant instrument, not a disabled control.

   The feed only ever ages the chip *downwards*: if it is empty, stale or
   unreachable the popover still renders and still opens the deck. */

type Ev = {
  t: number
  agent: string
  action: string
  target?: string
  label: string
  redact?: boolean
}

const LIVE_FRESH_MS = 15 * 60_000
/* Every poll can cost a billed Blob `list()`, and this chip lives on the
   desktop for as long as the tab is open — a background tab polling all
   night is real money for zero eyeballs. Two rules: a slow interval, and
   NEVER poll while the tab is hidden (we catch up on the way back).
   5 minutes is deliberately far slower than it feels like it should be:
   LIVE_FRESH_MS is FIFTEEN minutes, so the chip cannot miss a live
   session at this rate — it just learns about it a little later. */
const POLL_MS = 300_000

/* `updated` is the feed's last write, so it outlives the session that
   wrote it. On an instrument this small "2H AGO" reads better than a
   date, and it is computed post-mount only (never during SSR) so there
   is nothing for hydration to disagree about. */
function ago(then: number) {
  const mins = Math.round((Date.now() - then) / 60_000)
  if (mins < 2) return 'JUST NOW'
  if (mins < 60) return `${mins}M AGO`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}H AGO`
  const days = Math.round(hrs / 24)
  if (days < 7) return `${days}D AGO`
  const wks = Math.round(days / 7)
  return wks < 5 ? `${wks}W AGO` : `${Math.round(days / 30)}MO AGO`
}

export function CommandWidget() {
  const openWindow = useWindows((s) => s.open)
  const windows = useWindows((s) => s.windows)
  const skin = useSettings((s) => s.skin)
  const reduced = useReducedMotion()
  const [leading, setLeading] = useState<Ev | null>(null)
  const [updated, setUpdated] = useState(0)
  const [live, setLive] = useState(false)
  // the popover — new in round 4, everything above is the pre-existing
  // poll/data-flow, untouched
  const [panelOpen, setPanelOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let dead = false
    const poll = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const res = await fetch('/api/cc-feed')
        const d: { updated: number; events: Ev[] } = await res.json()
        if (dead) return
        // a report with a call sign we don't know is dropped, never drawn
        const evs = (Array.isArray(d.events) ? d.events : []).filter((e) => isCrewId(e?.agent))
        const stamp = typeof d.updated === 'number' ? d.updated : 0
        setUpdated(stamp)
        setLeading(evs.length ? evs[evs.length - 1] : null)
        setLive(stamp > 0 && Date.now() - stamp < LIVE_FRESH_MS && evs.length > 0)
      } catch {
        /* feed unreachable — stay idle, still offer the deck */
      }
    }
    void poll()
    const pollTimer = setInterval(() => void poll(), POLL_MS)
    // coming back to the tab is the one moment a fresh read is worth paying for
    const onVis = () => {
      if (document.visibilityState === 'visible') void poll()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      dead = true
      clearInterval(pollTimer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // the full program is open — no reason to keep the popover up too
  const deckOpen = windows.some((w) => w.id === 'command')

  // close on outside pointer / Escape — the same recipe as SkinSwitch's flyout
  useEffect(() => {
    if (!panelOpen) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPanelOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [panelOpen])

  const openDeck = () => {
    setPanelOpen(false)
    sfx.open()
    openWindow('command')
  }

  const lastSeen = updated > 0 ? ago(updated) : null
  const stamp = live ? 'LIVE' : (lastSeen ?? 'IDLE')
  const onDuty = leading?.agent ?? null
  const edgeName = onDuty ? (CREW_BY_ID[onDuty]?.name ?? onDuty.toUpperCase()) : null
  const label = `${t('menubar.command', skin)}${live ? ' (live)' : ''}`

  return (
    <div className={shellStyles.commandSwitch} ref={ref}>
      <button
        type="button"
        className={`${shellStyles.menuBtn} ${shellStyles.menuGlyphBtn} ${shellStyles.commandBtn}`}
        onClick={() => {
          sfx.tap()
          setPanelOpen((v) => !v)
        }}
        aria-haspopup="true"
        aria-expanded={panelOpen}
        aria-label={label}
        title={label}
      >
        <Icon name="nodes" size={14} />
        {live && <span className={shellStyles.commandLed} aria-hidden="true" />}
      </button>

      <AnimatePresence>
        {panelOpen && !deckOpen && (
          <motion.div
            className={shellStyles.commandPopover}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={SPRINGS.mini}
            data-spring="mini"
          >
            <div className={styles.ccWidget} data-state={live ? 'live' : 'idle'}>
              <button
                type="button"
                className={styles.ccBar}
                onClick={openDeck}
                aria-label={
                  live
                    ? `Command Center is live — Jake's agents are orchestrating now${
                        edgeName && !leading?.redact
                          ? `. Latest: ${edgeName}, ${leading?.label}`
                          : ''
                      }. Enter the Command Center.`
                    : `Command Center is idle${
                        lastSeen ? `, last session ${lastSeen.toLowerCase()}` : ''
                      }. Enter the Command Center to see how this site gets built.`
                }
              >
                {/* row 1 — the glance layer: dot + stamp + cast. Ambient, always
                    true, meant to be read without stopping. */}
                <span className={styles.ccRowGlance}>
                  <span className={styles.ccDot} aria-hidden="true" />
                  <span className={styles.ccStamp}>{stamp}</span>

                  {/* the cast, in pyramid order: the human first, then the crew.
                      Decorative — every name is spelled out inside the deck. */}
                  <span className={styles.ccCast} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className={styles.ccMono}
                      data-active={onDuty === HUMAN.id || undefined}
                      src={HUMAN_PORTRAIT}
                      alt=""
                    />
                    <span className={styles.ccCastRule} />
                    {CREW.map((a) => (
                      <span
                        key={a.id}
                        className={styles.ccFace}
                        data-active={onDuty === a.id || undefined}
                        style={{
                          WebkitMaskImage: `url(${avatarFor(a.id, skin)})`,
                          maskImage: `url(${avatarFor(a.id, skin)})`,
                        }}
                      />
                    ))}
                  </span>
                </span>

                {/* row 2 — the action layer: the leading edge of the feed, then
                    the way in. What happened, and what to do about it. */}
                <span className={styles.ccRowAction}>
                  <span className={styles.ccEdge}>
                    {leading ? (
                      <>
                        <b>{edgeName}</b>
                        {' · '}
                        {leading.redact ? (
                          <span
                            className={styles.ccRedact}
                            role="img"
                            aria-label="Redacted — classified until it ships"
                          />
                        ) : (
                          leading.label
                        )}
                      </>
                    ) : (
                      'NO TRAFFIC — CREW ASLEEP'
                    )}
                  </span>

                  {/* the spelled-out way in survives only on mobile, where there
                      is no hover; on desktop the whole chip is the target and the
                      arrow below says so on approach (Jake, s44) */}
                  <span className={styles.ccCta}>
                    ENTER COMMAND CENTER
                    <span aria-hidden="true">&nbsp;→</span>
                  </span>
                </span>

                {/* desktop affordance: an arrow surfaces at the chip's right edge
                    on hover/focus — the aria-label already says where it goes */}
                <span className={styles.ccArrow} aria-hidden="true">
                  →
                </span>
              </button>

              {/* only the liveness sentence lives here — never the timestamp, or
                  every poll would re-announce as the relative time ticked over */}
              <span className={styles.ccSr} role="status">
                {live
                  ? 'Command Center: a session is orchestrating live.'
                  : 'Command Center: idle, no session running.'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
