'use client'

import { useEffect, useRef, useState } from 'react'
import { useSettings } from '@/store/settings'
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

  useEffect(() => hydrate(), [hydrate])

  return (
    <header className={styles.menubar}>
      <div className={styles.wordmark}>
        LUNDE&nbsp;OS
        <span aria-hidden="true">v0.2 · 1992年アメリカ製</span>
      </div>
      <div className={styles.menuRight}>
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
