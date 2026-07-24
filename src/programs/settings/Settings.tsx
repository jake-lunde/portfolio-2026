'use client'

import type { Skin } from '@/store/settings'
import { useSettings } from '@/store/settings'
import { WALLPAPERS, wallpaperMask } from '@/components/shell/wallpapers'
import { sfx } from '@/lib/sound'
import { CopyText as Copy } from '@/content/CopyText'
import styles from '../programs.module.css'

const SKINS: Array<{ id: Skin; name: string; disabled?: boolean }> = [
  { id: 'classic', name: 'Classic' },
  { id: 'medieval', name: 'Medieval' },
  { id: 'underwater', name: 'Underwater', disabled: true },
]

export default function Settings() {
  const theme = useSettings((s) => s.theme)
  const sound = useSettings((s) => s.sound)
  const wallpaper = useSettings((s) => s.wallpaper)
  const skin = useSettings((s) => s.skin)
  const setTheme = useSettings((s) => s.setTheme)
  const toggleSound = useSettings((s) => s.toggleSound)
  const setWallpaper = useSettings((s) => s.setWallpaper)
  const setSkin = useSettings((s) => s.setSkin)

  return (
    <div className={styles.settings}>
      <div className={styles.setCol}>
        <span className={styles.setLabel}>
          <Copy k="settings.skinLabel" as="span" />
          <Copy k="settings.skinHint" as="span" className={styles.setHint} />
        </span>
        <div className={styles.swatches} role="group" aria-label="Skin">
          {SKINS.map((sk) => (
            <button
              key={sk.id}
              className={styles.swatch}
              aria-pressed={skin === sk.id}
              aria-label={`${sk.name} skin`}
              disabled={sk.disabled}
              onClick={() => {
                if (sk.disabled) return
                sfx.tap()
                setSkin(sk.id)
              }}
            >
              <span className={styles.skinTile} data-skin={sk.id} aria-hidden="true">
                <span className={styles.skinDot} />
              </span>
              <span className={styles.swatchName}>{sk.name}</span>
              {sk.disabled && <Copy k="shared.soon" as="span" className={styles.projSoon} />}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.setRow}>
        <span className={styles.setLabel}>
          <Copy k="settings.appearanceLabel" as="span" />
          <Copy k="settings.appearanceHint" as="span" className={styles.setHint} />
        </span>
        <div className={styles.segmented} role="group" aria-label="Theme">
          <button
            className={styles.segBtn}
            aria-pressed={theme === 'light'}
            onClick={() => setTheme('light')}
          >
            <Copy k="settings.light" as="span" />
          </button>
          <button
            className={styles.segBtn}
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme('dark')}
          >
            <Copy k="settings.dark" as="span" />
          </button>
        </div>
      </div>

      <div className={styles.setRow}>
        <span className={styles.setLabel}>
          <Copy k="settings.soundLabel" as="span" />
          <Copy k="settings.soundHint" as="span" className={styles.setHint} />
        </span>
        <div className={styles.segmented} role="group" aria-label="Sound">
          <button className={styles.segBtn} aria-pressed={sound} onClick={() => sound || toggleSound()}>
            <Copy k="settings.on" as="span" />
          </button>
          <button className={styles.segBtn} aria-pressed={!sound} onClick={() => !sound || toggleSound()}>
            <Copy k="settings.off" as="span" />
          </button>
        </div>
      </div>

      <div className={styles.setCol}>
        <span className={styles.setLabel}>
          <Copy k="settings.wallpaperLabel" as="span" />
          <Copy k="settings.wallpaperHint" as="span" className={styles.setHint} />
        </span>
        <div className={styles.swatches} role="group" aria-label="Wallpaper pattern">
          {WALLPAPERS.map((wp) => (
            <button
              key={wp.id}
              className={styles.swatch}
              aria-pressed={wallpaper === wp.id}
              aria-label={`${wp.name} wallpaper`}
              onClick={() => {
                sfx.tap()
                setWallpaper(wp.id)
              }}
            >
              <span className={styles.swatchTile} style={wp.tile ? wallpaperMask(wp) : undefined} aria-hidden="true" />
              <span className={styles.swatchName}>{wp.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.setRow} style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <span className={styles.setLabel}>
          <Copy k="settings.accentLabel" as="span" />
          <Copy k="settings.accentHint" as="span" className={styles.setHint} />
        </span>
        <Copy k="shared.soon" as="span" className={styles.projSoon} />
      </div>
    </div>
  )
}
