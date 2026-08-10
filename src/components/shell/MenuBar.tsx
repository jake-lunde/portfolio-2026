'use client'

import { useEffect, useRef, useState } from 'react'
import { useSettings } from '@/store/settings'
import { useInspect } from '@/store/inspect'
import { OS_VERSION } from '@/lib/version'
import { SkinSwitch } from './SkinSwitch'
import styles from './shell.module.css'

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

  useEffect(() => hydrate(), [hydrate])

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
            summoned from the chrome rather than opened from an icon. The
            ring glyph is the program's own identity mark. Hidden below
            900px, where there would be no canvas left (see .inspectBtn). */}
        <button
          className={`${styles.menuBtn} ${styles.inspectBtn}`}
          onClick={toggleInspect}
          aria-pressed={inspecting}
          aria-label={`Inspect mode ${inspecting ? 'on' : 'off'}`}
        >
          ◎ INSPECT
        </button>
        <button
          className={styles.menuBtn}
          onClick={toggleSound}
          aria-pressed={sound}
          aria-label={`Sound ${sound ? 'on' : 'off'}`}
        >
          SND {sound ? '●' : '○'}
        </button>
        {skin === 'classic' && (
          <button
            className={styles.menuBtn}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? 'LGT' : 'DRK'}
          </button>
        )}
        <Clock />
      </div>
    </header>
  )
}
