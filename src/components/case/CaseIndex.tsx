'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText } from '@/content/CopyText'
import { sfx } from '@/lib/sound'
import styles from './case.module.css'

/* INDEX — the case's sidecar contents, plus a segmented read-o-meter
   riding just under the title bar. Entries derive from the Section
   anatomy already in the MDX (secNo renders "01 — label"), so authoring
   stays free: add a section, the index knows. The scroller is the
   WINDOW body, not the viewport — found by walking up from the article.
   The rail arrives only once the reader has actually started scrolling;
   its tripline matches PROGRESS.VWR's so the two rails never disagree
   about where we are. Expansion is an instant pop, not a tween — 1992
   menus didn't ease. */

const SEGS = 18

type Entry = { no: string; label: string; el: Element }

function scrollParent(from: Element | null): HTMLElement | null {
  for (let el = from?.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el
  }
  return null
}

export function CaseIndex() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  const [entries, setEntries] = useState<Entry[]>([])
  const [active, setActive] = useState(-1)
  const [filled, setFilled] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const article = ref.current?.closest('article')
    if (!article) return
    const found: Entry[] = []
    for (const el of article.querySelectorAll(`.${styles.section}`)) {
      const raw = el.querySelector(`.${styles.secNo}`)?.textContent ?? ''
      const [no, label] = raw.split('—').map((s) => s.trim())
      if (no && label) found.push({ no, label, el })
    }
    setEntries(found)

    // active beat: same tripline as the evolution rail (upper 45%);
    // the lowest live section drives the highlight
    const live = new Set<number>()
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          const i = found.findIndex((f) => f.el === e.target)
          if (e.isIntersecting) live.add(i)
          else live.delete(i)
        }
        setActive(live.size ? Math.max(...live) : -1)
      },
      { rootMargin: '0px 0px -55% 0px', threshold: 0 },
    )
    found.forEach((f) => io.observe(f.el))

    // meter + arrival ride the window body's own scroll; integer segment
    // state means React only re-renders when a block actually flips
    const scroller = scrollParent(article)
    const onScroll = () => {
      if (!scroller) return
      const max = scroller.scrollHeight - scroller.clientHeight
      setFilled(max > 0 ? Math.round((scroller.scrollTop / max) * SEGS) : 0)
      setStarted(scroller.scrollTop > 40)
    }
    onScroll()
    scroller?.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(onScroll)
    if (scroller) ro.observe(scroller)
    return () => {
      io.disconnect()
      scroller?.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [])

  return (
    <div ref={ref} className={styles.idxRoot}>
      <div className={styles.meterSlot} aria-hidden="true">
        <div className={styles.meter}>
          {Array.from({ length: SEGS }, (_, i) => (
            <span
              key={i}
              className={styles.meterSeg}
              data-on={i < filled ? 'true' : undefined}
            />
          ))}
        </div>
      </div>
      {entries.length > 1 && (
        <nav
          className={styles.idxSlot}
          aria-label={t('case.index.aria', skin)}
          data-in={started ? 'true' : undefined}
        >
          <div className={styles.idx}>
            <CopyText k="case.index.title" className={styles.idxTitle} />
            {entries.map((en, i) => (
              <button
                key={en.no}
                className={styles.idxRow}
                aria-current={i === active ? 'true' : undefined}
                data-on={i === active ? 'true' : undefined}
                data-done={i < active ? 'true' : undefined}
                onClick={() => {
                  sfx.tap()
                  en.el.scrollIntoView({
                    behavior: reduced ? 'auto' : 'smooth',
                    block: 'start',
                  })
                }}
              >
                <span className={styles.idxNo}>{en.no}</span>
                <span className={styles.idxLabel}>{en.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
