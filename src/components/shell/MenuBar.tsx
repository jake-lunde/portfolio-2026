'use client'

import { useEffect, useRef, useState } from 'react'
import { useSettings } from '@/store/settings'
import { useInspect } from '@/store/inspect'
import { t } from '@/content/copy'
import { OS_VERSION } from '@/lib/version'
import { SkinSwitch } from './SkinSwitch'
import { FableMark } from './FableMark'
import styles from './shell.module.css'

/* Menubar glyphs — the desktop icon language (Icon.tsx: 1.5px line art on
   currentColor) redrawn on a 16 grid for a 34px bar. Local to this file:
   these controls are the only place the OS says "sound" or "theme" as a
   picture. Decorative always — the button's aria-label is the meaning. */
function NoteGlyph({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M7 12.4V3.2c2.2.7 3.3 2 3.3 4" />
      <circle cx="5.2" cy="12.4" r="1.9" fill="currentColor" stroke="none" />
      {muted ? <path d="M2.6 2.6l10.8 10.8" /> : null}
    </svg>
  )
}

function SunGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M12.95 3.05l-1.4 1.4M4.45 11.55l-1.4 1.4" />
    </svg>
  )
}

function MoonGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M8 2a4 4 0 0 0 6 6 6 6 0 1 1-6-6Z" />
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

export function MenuBar() {
  const theme = useSettings((s) => s.theme)
  const sound = useSettings((s) => s.sound)
  const skin = useSettings((s) => s.skin)
  const toggleTheme = useSettings((s) => s.toggleTheme)
  const toggleSound = useSettings((s) => s.toggleSound)
  const hydrate = useSettings((s) => s.hydrate)
  const inspecting = useInspect((s) => s.on)
  const toggleInspect = useInspect((s) => s.toggle)
  /* EDIT.MODE (SYS-99) and INSPECT.MODE cannot both hold the desktop.
     InspectShell already stands down when the editor arms, but as the
     SECOND mover that showed as a flash: panels appeared, the desktop
     compressed, and everything snapped back inside a frame with no word
     of why. The refusal belongs on the control, before the flip. */
  const [editing, setEditing] = useState(false)

  useEffect(() => hydrate(), [hydrate])

  useEffect(() => {
    const read = () => setEditing(!!document.body.dataset.editmode)
    read()
    const obs = new MutationObserver(read)
    obs.observe(document.body, { attributes: true, attributeFilter: ['data-editmode'] })
    return () => obs.disconnect()
  }, [])

  return (
    /* the menubar is the tool's own toolbar while INSPECT.MODE is up, so
       it is exempt from picking (InspectShell) — the way OUT of the mode
       must never be something the mode swallows */
    <header className={styles.menubar} data-inspect-self="">
      <div className={styles.menuLeft}>
        <div className={styles.wordmark}>
          LUNDE&nbsp;OS
          <span aria-hidden="true">{OS_VERSION} · 1992年アメリカ製</span>
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

            Hidden below 900px, where there would be no canvas left
            between the docks (see .inspectBtn). */}
        <button
          className={`${styles.menuBtn} ${styles.inspectBtn}`}
          data-inspect-toggle=""
          onClick={() => {
            if (editing) return
            toggleInspect()
          }}
          aria-pressed={inspecting}
          aria-disabled={editing || undefined}
          data-busy={editing || undefined}
          title={editing ? t('inspect.editbusy', skin) : undefined}
          aria-label={
            editing
              ? t('inspect.editbusy', skin)
              : `Inspect mode ${inspecting ? 'on' : 'off'}`
          }
        >
          INSPECT
        </button>
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
