'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import styles from './shell.module.css'

/* A brief boot line on the first visit of the session. ~900ms, skippable,
   skipped entirely under reduced motion. */

export function Boot() {
  const [show, setShow] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    try {
      if (sessionStorage.getItem('lunde-booted')) return
      sessionStorage.setItem('lunde-booted', '1')
    } catch {}
    setShow(true)
    const t = setTimeout(() => setShow(false), 950)
    return () => clearTimeout(t)
  }, [reduced])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.boot}
          role="status"
          aria-label="LUNDE OS starting"
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          onClick={() => setShow(false)}
        >
          <div className={styles.bootInner}>
            <p className={styles.bootLine}>
              LUNDE OS <em>v0.1</em>
            </p>
            <p className={styles.bootLine} aria-hidden="true">
              1984年アメリカ製 · MEM OK · CALLING…
            </p>
            <div className={styles.bootBar}>
              <div className={styles.bootFill} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
