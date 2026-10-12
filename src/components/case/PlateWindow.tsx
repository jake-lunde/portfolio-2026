'use client'

/* THE FULL-SIZE WINDOW for a wide visual in the pinned layout
   (PinnedSection.tsx). The pinned column shows a wide visual small; its
   chip opens this, a LUNDE OS window inside the case's own window with
   the visual at full size. Out of the s146 prototype on branch
   proto/plate-windows (option C's floating panel, option A's width).

   It wears the shell's window and titlebar classes, so it reads as one
   more window on the machine, and it drags by its titlebar on the same
   Motion recipe Window.tsx uses, held inside the case window. The drag
   offset lives in motion values on this component, so the window stays
   where the reader put it for as long as it is open and every new open
   arrives at the top right.

   Keyboard: focus lands on the close button when it opens, Escape shuts
   it (and stops there, so the case window behind it, which closes on
   Escape too, stays open), and PinnedSection hands focus back to the
   chip. It is a non-modal dialog: the article behind stays readable. */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from 'motion/react'
import { SPRINGS } from '@/lib/motion'
import shell from '@/components/shell/shell.module.css'
import styles from './case.module.css'

/* room between the case's titlebar and this window's top, and under it */
const GAP = 16

export function PlateWindow({
  id,
  host,
  title,
  label,
  closeLabel,
  onClose,
  children,
}: {
  id: string
  /** the case window element; this portals into it and drags inside it */
  host: HTMLElement
  /** the plate's own name, in the titlebar */
  title: string
  /** the dialog's accessible name, ahead of the title */
  label: string
  closeLabel: string
  onClose: () => void
  children: ReactNode
}) {
  const reduced = useReducedMotion()
  const dragControls = useDragControls()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const hostRef = useRef<HTMLElement>(host)
  hostRef.current = host
  const closeRef = useRef<HTMLButtonElement>(null)
  const [geom, setGeom] = useState({ top: 56, maxH: 480 })

  // tucked under the case's titlebar, no taller than the window leaves
  useLayoutEffect(() => {
    const fit = () => {
      const bar = host.querySelector<HTMLElement>('[data-part="titlebar"]')
      const top = (bar?.offsetHeight ?? 40) + GAP
      setGeom({ top, maxH: Math.max(200, host.clientHeight - top - GAP) })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(host)
    return () => ro.disconnect()
  }, [host])

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <motion.div
      id={id}
      role="dialog"
      aria-label={`${label}: ${title}`}
      className={`${shell.window} ${shell.windowActive} ${styles.plateWindow}`}
      style={{ top: geom.top, maxHeight: geom.maxH, x, y }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
      transition={SPRINGS.widget}
      data-spring="widget"
      drag
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={hostRef}
      dragElastic={0.12}
      dragMomentum={false}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        e.stopPropagation()
        onClose()
      }}
    >
      <div className={shell.titlebar} onPointerDown={(e) => dragControls.start(e)}>
        <div className={shell.titleControls}>
          <button
            ref={closeRef}
            type="button"
            className={shell.ctrl}
            aria-label={closeLabel}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <span className={shell.title}>{title}</span>
        {/* the right slot, empty: keeps the title centred on the bar */}
        <span className={styles.plateWindowBalance} aria-hidden="true" />
      </div>
      <div className={styles.plateWindowBody}>{children}</div>
    </motion.div>
  )
}
