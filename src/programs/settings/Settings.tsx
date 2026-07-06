'use client'

import { useSettings } from '@/store/settings'
import styles from '../programs.module.css'

export default function Settings() {
  const theme = useSettings((s) => s.theme)
  const sound = useSettings((s) => s.sound)
  const setTheme = useSettings((s) => s.setTheme)
  const toggleSound = useSettings((s) => s.toggleSound)

  return (
    <div className={styles.settings}>
      <div className={styles.setRow}>
        <span className={styles.setLabel}>
          Appearance
          <span className={styles.setHint}>Print stock or terminal night</span>
        </span>
        <div className={styles.segmented} role="group" aria-label="Theme">
          <button
            className={styles.segBtn}
            aria-pressed={theme === 'light'}
            onClick={() => setTheme('light')}
          >
            Light
          </button>
          <button
            className={styles.segBtn}
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme('dark')}
          >
            Dark
          </button>
        </div>
      </div>

      <div className={styles.setRow}>
        <span className={styles.setLabel}>
          Sound
          <span className={styles.setHint}>Interface clicks, synthesized</span>
        </span>
        <div className={styles.segmented} role="group" aria-label="Sound">
          <button className={styles.segBtn} aria-pressed={sound} onClick={() => sound || toggleSound()}>
            On
          </button>
          <button className={styles.segBtn} aria-pressed={!sound} onClick={() => !sound || toggleSound()}>
            Off
          </button>
        </div>
      </div>

      <div className={styles.setRow} style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <span className={styles.setLabel}>
          Accent emphasis
          <span className={styles.setHint}>Coming in a later release</span>
        </span>
        <span className={styles.projSoon}>Soon</span>
      </div>
    </div>
  )
}
