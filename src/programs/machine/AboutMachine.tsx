'use client'

import { Icon, type IconName } from '@/components/shell/Icon'
import { Button } from '@/components/primitives/Button'
import { useWindows } from '@/store/windows'
import { sfx } from '@/lib/sound'
import { OS_VERSION } from '@/lib/version'
import styles from './machine.module.css'

/* About This Machine — reformatted after the System 7 "About This
   Macintosh" window: identity block, a memory row, a list of allocations
   with bars, and one push button. That's the whole window; it hugs its
   contents.

   The long-form read — the spec sheet plus the four-section appraisal
   written by the AI that spent three days inside this design system —
   used to hang off a twirl-down here. It now has its own window
   (`ai-opinion` → AiOpinion.tsx), opened by the button below. The
   disclosure and its SSR-collapsed-height workaround are gone with it:
   nothing in this window animates open, so nothing can ship expanded and
   spike CLS on hydration. */

const TOTAL_K = 4096
const UNUSED_K = 512

type MemoryItem = {
  icon: IconName
  label: string
  k: number
}

/* Five allocations + the unused block sum to exactly TOTAL_K. Bar widths
   are derived from k/TOTAL_K below, never hardcoded, so the reconciliation
   stays true if these numbers ever change. */
const MEMORY_ITEMS: MemoryItem[] = [
  { icon: 'swatch', label: 'Design systems & tokens', k: 1152 },
  { icon: 'steps', label: 'Prototyping — SwiftUI, React', k: 896 },
  { icon: 'nodes', label: 'Research → product decisions', k: 768 },
  { icon: 'chip', label: 'AI-assisted tooling', k: 640 },
  { icon: 'flower', label: 'Music, ink & the dog', k: 128 },
]

export default function AboutMachine() {
  const open = useWindows((s) => s.open)

  return (
    <div className={styles.machine}>
      <div className={styles.identity}>
        <div className={styles.identityLeft}>
          <Icon name="chip" size={32} />
          <div>
            <p className={styles.machineName}>Jake Lunde</p>
            <p className={styles.machineRole}>Staff Product Designer · Seattle, WA</p>
          </div>
        </div>
        <div className={styles.identityRight}>
          <p className={styles.sysVersion}>LUNDE OS {OS_VERSION}</p>
          <p className={styles.copyright}>© Jake Lunde 2026</p>
        </div>
      </div>

      <hr className={styles.rule} />

      <div className={styles.memoryRow}>
        <span>Total Memory: {TOTAL_K.toLocaleString()}K</span>
        <span>Largest Unused Block: {UNUSED_K.toLocaleString()}K</span>
      </div>

      <div className={styles.itemList}>
        {MEMORY_ITEMS.map((item, i) => {
          const pct = (item.k / TOTAL_K) * 100
          const isBackgroundProcess = i === MEMORY_ITEMS.length - 1
          return (
            <div className={styles.itemRow} key={item.label}>
              <span className={styles.itemIcon} aria-hidden="true">
                <Icon name={item.icon} size={16} />
              </span>
              <span className={styles.itemLabel}>{item.label}</span>
              <span className={styles.itemSize}>{item.k.toLocaleString()}K</span>
              <div
                className={styles.barTrack}
                role="meter"
                aria-valuemin={0}
                aria-valuemax={TOTAL_K}
                aria-valuenow={item.k}
                aria-label={item.label}
              >
                <div
                  className={isBackgroundProcess ? styles.barFillExpressive : styles.barFill}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* the window's one action, sitting where a System 7 dialog puts its
          default button. margin-top:auto on the row means any slack between
          the registered window height and the content lands here instead of
          under the button. */}
      <div className={styles.ctaRow}>
        <Button
          type="button"
          tone="system"
          size="md"
          className={styles.ctaButton}
          onClick={() => {
            sfx.open()
            open('ai-opinion')
          }}
        >
          WHAT DOES MY AI THINK ABOUT ME?
        </Button>
      </div>
    </div>
  )
}
