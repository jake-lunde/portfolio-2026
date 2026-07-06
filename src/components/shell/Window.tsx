'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useDragControls, useReducedMotion } from 'motion/react'
import type { RefObject } from 'react'
import type { ResolvedWindow } from '@/programs/resolve'
import { useWindows } from '@/store/windows'
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
  const dragControls = useDragControls()
  const reduced = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const [zoomed, setZoomed] = useState(false)

  // move keyboard focus into a newly opened window
  useEffect(() => {
    if (active) ref.current?.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const Body = def.component

  return (
    <motion.section
      ref={ref}
      tabIndex={-1}
      aria-label={def.name}
      className={`${styles.window} ${active ? styles.windowActive : ''} ${zoomed ? styles.windowZoomed : ''}`}
      style={{
        left: def.pos.x,
        top: def.pos.y,
        width: def.size.w,
        height: def.size.h,
        zIndex: z,
      }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 480, damping: 34, mass: 0.7 }}
      drag={!zoomed}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={desktopRef}
      dragElastic={0.12}
      dragMomentum={false}
      onPointerDown={() => focus(def.id)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          sfx.close()
          close(def.id)
        }
      }}
    >
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
            aria-label={`Close ${def.name}`}
            onClick={() => {
              sfx.close()
              close(def.id)
            }}
          >
            ×
          </button>
          <button
            className={styles.ctrl}
            aria-label={zoomed ? `Restore ${def.name}` : `Zoom ${def.name}`}
            onClick={() => setZoomed((v) => !v)}
          >
            +
          </button>
        </div>
        <span className={styles.title}>{def.name}</span>
        <span className={styles.titleMeta} aria-hidden="true">
          {def.meta}
        </span>
      </div>
      <div className={`${styles.windowBody} ${def.chrome === 'crt' ? `${styles.crt} crt` : ''}`}>
        {Body ? <Body /> : null}
      </div>
    </motion.section>
  )
}
