'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import type { RefObject } from 'react'
import type { ResolvedWindow } from '@/programs/resolve'
import { useWindows } from '@/store/windows'
import { useSettings } from '@/store/settings'
import { programName } from '@/lib/skinVocab'
import { useGate } from '@/store/gate'
import { GateSphere } from '@/components/gate/GateSphere'
import { WindowChromeProvider } from './windowChrome'
import { CopyText } from '@/content/CopyText'
import { sfx } from '@/lib/sound'
import styles from './shell.module.css'

type Props = {
  def: ResolvedWindow
  z: number
  active: boolean
  desktopRef: RefObject<HTMLDivElement | null>
}

export function Window({ def, z, active, desktopRef }: Props) {
  const close = useWindows((s) => s.close)
  const focus = useWindows((s) => s.focus)
  const unlocked = useGate((s) => s.unlocked)
  const storedSize = useWindows((s) => s.sizes[def.id])
  const setSize = useWindows((s) => s.setSize)
  const dragControls = useDragControls()
  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  const ref = useRef<HTMLElement>(null)
  const [zoomed, setZoomed] = useState(false)
  const [explaining, setExplaining] = useState(false)

  // window title + a11y labels follow the active skin's vocabulary
  const title = programName(def.id, def.name, skin)
  const bare = def.chrome === 'bare'

  // constant id, not useId: programs are dynamic imports in a tree that
  // reshapes at the SSR handover, and useId mismatches across it
  const explainerId = `window-explainer-${def.id}`

  // move keyboard focus into a newly opened window
  useEffect(() => {
    if (active) ref.current?.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Recede-when-inactive lives in CSS (`.window:not(.windowActive)`), not
     here: Motion owns this element's inline `opacity` for the open/close
     transition, and an inline style always beats a stylesheet. See
     shell.module.css — it dims with `filter` so the two multiply. */

  const size = storedSize ?? def.size

  // drag the bottom-right grip to resize; top-left stays anchored.
  // raw pointer capture so it never fights motion's controlled window drag.
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault()
    focus(def.id)
    const startX = e.clientX
    const startY = e.clientY
    const startW = size.w
    const startH = size.h
    const maxW = window.innerWidth - 24
    const maxH = window.innerHeight - 46 // leave the menu bar clear
    try {
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* pointer already released — window listeners still cover the drag */
    }
    const onMove = (ev: PointerEvent) => {
      const w = Math.max(300, Math.min(maxW, startW + (ev.clientX - startX)))
      const h = Math.max(200, Math.min(maxH, startH + (ev.clientY - startY)))
      setSize(def.id, { w, h })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      sfx.tap()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const Body = def.component

  const chromeApi = useMemo(
    () => ({
      id: def.id,
      startDrag: (e: React.PointerEvent) => {
        // free-floating drag is a desktop affordance only
        if (window.innerWidth > 720) dragControls.start(e)
      },
      close: () => {
        sfx.close()
        close(def.id)
      },
    }),
    [def.id, dragControls, close],
  )

  return (
    <motion.section
      ref={ref}
      tabIndex={-1}
      aria-label={title}
      data-window-id={def.id}
      className={`${styles.window} ${active ? styles.windowActive : ''} ${zoomed ? styles.windowZoomed : ''} ${bare ? styles.windowBare : ''} ${def.noRecede ? styles.windowNoRecede : ''}`}
      style={{
        left: def.pos.x,
        top: def.pos.y,
        width: size.w,
        height: size.h,
        zIndex: z,
      }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.14 } }}
      transition={SPRINGS.window}
      drag={!zoomed}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={desktopRef}
      dragElastic={0.12}
      dragMomentum={false}
      onPointerDown={() => focus(def.id)}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        // an open explainer eats the first Escape — dismiss the chrome and
        // keep the window. Sequenced here rather than on the button so it
        // holds wherever focus sits inside the window.
        if (explaining) {
          e.stopPropagation()
          setExplaining(false)
          return
        }
        sfx.close()
        close(def.id)
      }}
    >
      {/* bare chrome: the program draws its own frame, its own drag handle
          and its own close control (see windowChrome.tsx). */}
      {bare ? null : (
        <div
          className={styles.titlebar}
          onPointerDown={(e) => {
            // free-floating drag is a desktop affordance only
            if (window.innerWidth > 720) dragControls.start(e)
          }}
          onDoubleClick={() => setZoomed((v) => !v)}
        >
          <div className={styles.titleControls}>
            <button
              className={styles.ctrl}
              aria-label={`Close ${title}`}
              onClick={() => {
                sfx.close()
                close(def.id)
              }}
            >
              ×
            </button>
            <button
              className={styles.ctrl}
              aria-label={zoomed ? `Restore ${title}` : `Zoom ${title}`}
              onClick={() => setZoomed((v) => !v)}
            >
              +
            </button>
          </div>
          <span className={styles.title} data-copy-id={`program.${def.id}.name`}>
            {title}
          </span>
          {/* the right slot: a doc-id, or — if the program registered an
              explainer key — a button that summons what this window is.
              WAI-ARIA tooltip pattern (describedby + role=tooltip): it is
              shown on hover AND focus and dismissed with Escape, which is
              exactly that pattern; click stays wired for touch, where
              there is no hover to open it with. */}
          {def.explainer ? (
            <div
              className={styles.explainer}
              onPointerEnter={(e) => {
                // hover is a mouse affordance: on touch, pointerenter fires
                // with the tap and would cancel the click toggle out
                if (e.pointerType === 'mouse') setExplaining(true)
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === 'mouse') setExplaining(false)
              }}
              // the titlebar drags and double-click zooms; this slot does neither
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={styles.explainerBtn}
                data-open={explaining ? 'true' : undefined}
                aria-describedby={explaining ? explainerId : undefined}
                onFocus={(e) => {
                  // keyboard focus reveals it; a pointer press must not, or
                  // focus and click would open and close in the same gesture
                  if (e.target.matches(':focus-visible')) setExplaining(true)
                }}
                onBlur={() => setExplaining(false)}
                onClick={() => setExplaining((v) => !v)}
              >
                <CopyText k="shell.explainer.label" />
              </button>
              <AnimatePresence>
                {explaining && (
                  <motion.div
                    id={explainerId}
                    role="tooltip"
                    className={styles.explainerPanel}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    transition={SPRINGS.widget}
                  >
                    <CopyText k={def.explainer} as="p" className={styles.explainerText} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <span className={styles.titleMeta} aria-hidden="true">
              {def.meta}
            </span>
          )}
        </div>
      )}
      <WindowChromeProvider value={chromeApi}>
        <div className={`${styles.windowBody} ${def.chrome === 'crt' ? `${styles.crt} crt` : ''}`}>
          {def.gated && !unlocked ? <GateSphere /> : Body ? <Body /> : null}
        </div>
      </WindowChromeProvider>
      {!zoomed && !bare && (
        <div
          className={styles.resizeGrip}
          onPointerDown={startResize}
          role="button"
          aria-label={`Resize ${title}`}
        />
      )}
    </motion.section>
  )
}
