'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useSettings } from '@/store/settings'
import { useInspect } from '@/store/inspect'
import { useWindows } from '@/store/windows'
import { OS_VERSION } from '@/lib/version'
import { SPRINGS } from '@/lib/motion'
import { sfx } from '@/lib/sound'
import { t } from '@/content/copy'
import { SkinSwitch } from './SkinSwitch'
import { FableMark } from './FableMark'
import { CommandWidget } from './CommandWidget'
import { Icon } from './Icon'
import styles from './shell.module.css'

/* Menubar glyphs — the desktop icon language (Icon.tsx: 32×32 grid,
   1.5px line art, round caps/joins, on currentColor) redrawn at the same
   grid and stroke recipe so a menubar glyph weighs exactly what a
   desktop one does. (Round 4: the original redraw used a 16-unit grid at
   the same 1.5 strokeWidth, which is proportionally DOUBLE Icon.tsx's
   weight at a shared 14px display size — that's the "note/sun/moon are
   heavier than palette" Jake flagged. Fix is the grid, not the number.)
   Local to this file rather than Icon.tsx PATHS: NoteGlyph needs a prop
   (the mute slash) Icon.tsx's static PATHS can't carry, and sun/moon are
   a single glyph swapped by theme state, not a name other programs
   reference — keeping the trio together here keeps one obvious home for
   "menubar-only" glyphs. Decorative always — the button's aria-label is
   the meaning. */
function NoteGlyph({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 24.8V6.4c4.4 1.4 6.6 4 6.6 8" />
      <circle cx="10.4" cy="24.8" r="3.8" fill="currentColor" stroke="none" />
      {muted ? <path d="M5.2 5.2l21.6 21.6" /> : null}
    </svg>
  )
}

function SunGlyph() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="6" />
      <path d="M16 2v4M16 26v4M2 16h4M26 16h4M6.1 6.1l2.8 2.8M23.1 23.1l2.8 2.8M25.9 6.1l-2.8 2.8M8.9 23.1l-2.8 2.8" />
    </svg>
  )
}

function MoonGlyph() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 4a8 8 0 0 0 12 12 12 12 0 1 1-12-12Z" />
    </svg>
  )
}

function Clock() {
  const [time, setTime] = useState<string | null>(null)
  const clicks = useRef<number[]>([])

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // SSR renders a blank slot; no CLS because width is reserved
  // easter egg: triple-click summons LOU.SYS
  const onClick = () => {
    const now = Date.now()
    clicks.current = [...clicks.current.filter((t) => now - t < 900), now]
    if (clicks.current.length >= 3) {
      clicks.current = []
      window.dispatchEvent(new Event('lunde:screensaver'))
    }
  }

  return (
    <span className={styles.clock} aria-hidden="true" onClick={onClick}>
      {time ?? ''}
    </span>
  )
}

/* A constant, never useId(): programs are dynamic imports in a tree that
   reshapes at the SSR handover, and a generated id mismatches across it.
   The menu bar renders once, so one literal is safe. */
const INSPECT_HINT_ID = 'inspect-chip-hint'

export function MenuBar() {
  const theme = useSettings((s) => s.theme)
  const sound = useSettings((s) => s.sound)
  const skin = useSettings((s) => s.skin)
  const toggleTheme = useSettings((s) => s.toggleTheme)
  const toggleSound = useSettings((s) => s.toggleSound)
  const hydrate = useSettings((s) => s.hydrate)
  const inspecting = useInspect((s) => s.on)
  const toggleInspect = useInspect((s) => s.toggle)
  const openWindow = useWindows((s) => s.open)
  const reduced = useReducedMotion()
  const [hintUp, setHintUp] = useState(false)

  useEffect(() => hydrate(), [hydrate])

  const inspectHint = t('inspect.chip.hint', skin)

  return (
    /* the menubar is the tool's own toolbar while INSPECT.MODE is up, so
       it is exempt from picking (InspectShell) — the way OUT of the mode
       must never be something the mode swallows */
    <header className={styles.menubar} data-inspect-self="">
      <div className={styles.menuLeft}>
        <div className={styles.wordmark}>
          {/* the house mark, in system ink — mask-image lets a raster
              PNG take var(--content) and follow dark mode for free
              (see .mark below). Decorative: the wordmark text already
              names the machine. */}
          <span className={styles.mark} aria-hidden="true" />
          LUNDE&nbsp;OS
          <span aria-hidden="true">{OS_VERSION}</span>
        </div>
        <SkinSwitch />
      </div>
      <div className={styles.menuRight}>
        {/* INSPECT.MODE (SYS-21) is a tool mode, not a program: it docks
            two panels and turns the desktop into its canvas, so it is
            summoned from the chrome rather than opened from an icon.

            No glyph. The ring used to carry the program's identity here,
            back when this bar stayed up while the tool ran and the toggle
            was the only thing on screen that said INSPECT. The mode wears
            its own accent-flooded header now and this bar hides behind
            it, so the mark had nothing left to identify — it was decoration
            on a word that was already the label. Word only.

            The copy editor used to refuse this button while it held the
            desktop (SYS-99). It rides inside INSPECT now, as an affordance
            on a pick, so there is nothing left to refuse and no busy state
            to explain.

            Round 4: restyled onto the skin switch's own chip (styles
            .skinTrigger, reused wholesale rather than duplicated) so the
            two framed controls at either end of the bar read as one
            family. Position, toggle behaviour, aria-pressed and the
            900px stand-down (see .inspectBtn) are untouched — only the
            box changed. The pressed state keeps its original accent-ink
            treatment, translated onto the chip (.inspectBtn[aria-pressed]
            in shell.module.css) rather than SkinSwitch's open/caret
            language, since INSPECT toggles a mode, it doesn't open a
            menu. Hidden below 900px, where there would be no canvas left
            between the docks (the whole switch goes, see .inspectSwitch). */}
        {/* s67: the chip is one seven-letter word, and a stranger has no
            way to guess it opens a live token and spring reader. It gets
            COMMAND.CTR's reveal from one seat over (CommandWidget.tsx,
            s66): hover or focus raises a hint card under the chip,
            absolutely positioned so nothing in the bar moves. The card
            stays down while the tool is up, where INSPECT's own header
            already explains itself. The card is decoration. The sentence
            reaches assistive tech through the hidden span the button
            names in aria-describedby, whether the card is up or not. No
            `title` on top of it: the native tooltip would draw the same
            words a second time, half a second late. */}
        <div
          className={styles.inspectSwitch}
          /* touch has no hover, so a tap goes straight through to the mode */
          onPointerEnter={(e) => {
            if (e.pointerType !== 'touch') setHintUp(true)
          }}
          onPointerLeave={() => setHintUp(false)}
          onFocus={() => setHintUp(true)}
          onBlur={() => setHintUp(false)}
        >
          <button
            className={`${styles.skinTrigger} ${styles.inspectBtn}`}
            data-inspect-toggle=""
            onClick={toggleInspect}
            aria-pressed={inspecting}
            aria-label={`Inspect mode ${inspecting ? 'on' : 'off'}`}
            aria-describedby={INSPECT_HINT_ID}
          >
            INSPECT
          </button>
          <span id={INSPECT_HINT_ID} className={styles.srOnly}>
            {inspectHint}
          </span>
          <AnimatePresence>
            {hintUp && !inspecting && (
              <motion.span
                className={styles.inspectHint}
                aria-hidden="true"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={SPRINGS.mini}
                data-spring="mini"
              >
                {inspectHint}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {/* sound + theme dropped their three-letter names for glyphs
            (Jake, s44): a music note that takes a slash when muted, and
            the current theme as sun or moon. State still reads without
            colour — the slash and the shape change carry it. */}
        <button
          className={`${styles.menuBtn} ${styles.menuGlyphBtn}`}
          onClick={toggleSound}
          aria-pressed={sound}
          aria-label={`Sound ${sound ? 'on' : 'off'}`}
          title={`Sound ${sound ? 'on' : 'off'}`}
        >
          <NoteGlyph muted={!sound} />
        </button>
        {skin === 'classic' && (
          <button
            className={`${styles.menuBtn} ${styles.menuGlyphBtn}`}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? <SunGlyph /> : <MoonGlyph />}
          </button>
        )}
        {/* DESIGN SYSTEM — a straight line to the token doc from anywhere
            in the OS, on the same glyph-button footprint as sound/theme.
            Opens the same window (spec-sheet) SETTINGS' customize row and
            the SPEC.SHEET desktop icon both lead to. */}
        <button
          className={`${styles.menuBtn} ${styles.menuGlyphBtn}`}
          onClick={() => {
            sfx.open()
            openWindow('spec-sheet')
          }}
          aria-label={t('menubar.designSystem', skin)}
          title={t('menubar.designSystem', skin)}
        >
          <Icon name="palette" size={14} />
        </button>
        {/* COMMAND.CTR — round 4: Jake's ruling that this is system
            chrome, not a floating desktop widget. Same glyph-button
            footprint as sound/theme/palette (menuGlyphBtn), the program's
            own 'nodes' icon, plus a dock-language LED (see Dock.tsx's
            .led — 4px, var(--accent), rendered only when lit rather than
            recoloured) standing in for the desktop chip's old dot. Seat:
            between DESIGN SYSTEM and the "?", so the two "go somewhere
            else in the OS" controls bracket it. Full logic lives in
            CommandWidget.tsx — this file only places it. */}
        <CommandWidget />
        {/* The mark holds the far-right corner, beside the time (Jake's
            s44 order: INSPECT · sound · theme · ? · clock) — the last
            interactive thing in the bar, where a "?" reads as the door to
            ask something. Below 720 the clock hides and the mark IS the
            corner. Survives the 900px fold where INSPECT stands down. */}
        <FableMark />
        <Clock />
      </div>
    </header>
  )
}
