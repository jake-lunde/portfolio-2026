'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { LouSprite, LOU_W, LOU_H } from './LouSprite'
import styles from './screensaver.module.css'

/* LOU.SYS — after 5 minutes idle, pixel Lou has the run of the house:
   the checkerboard floor from the hallway photo, a classic-Mac pinstripe
   frame, DVD-corner physics. Any input hands the machine back.
   Easter egg: triple-click the menu-bar clock to summon him early. */

const IDLE_MS = 5 * 60 * 1000
const GRACE_MS = 500
const PX = 5
const SPEED = 130 // px/s

export function Screensaver() {
  const [active, setActive] = useState(false)
  const activatedAt = useRef(0)
  const reduced = useReducedMotion()
  const louRef = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const vel = useRef({ x: SPEED, y: SPEED * 0.72 })
  const posRef = useRef({ x: 80, y: 80 })
  const facing = useRef(1)

  // idle detection + dismiss
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        activatedAt.current = Date.now()
        setActive(true)
      }, IDLE_MS)
    }
    const onInput = () => {
      if (activatedAt.current && Date.now() - activatedAt.current < GRACE_MS) return
      setActive((cur) => {
        if (cur) activatedAt.current = 0
        return false
      })
      arm()
    }
    const summon = () => {
      activatedAt.current = Date.now()
      setActive(true)
    }
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, onInput, { passive: true }))
    window.addEventListener('lunde:screensaver', summon)
    arm()
    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, onInput))
      window.removeEventListener('lunde:screensaver', summon)
    }
  }, [])

  // bounce loop
  useEffect(() => {
    if (!active || reduced) return
    const lou = louRef.current
    const area = areaRef.current
    if (!lou || !area) return
    let raf = 0
    let last = performance.now()
    const w = LOU_W * PX
    const h = LOU_H * PX

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const bounds = area.getBoundingClientRect()
      const p = posRef.current
      p.x += vel.current.x * dt
      p.y += vel.current.y * dt
      let bounced = false
      if (p.x <= 0) { p.x = 0; vel.current.x = Math.abs(vel.current.x); bounced = true }
      if (p.x >= bounds.width - w) { p.x = bounds.width - w; vel.current.x = -Math.abs(vel.current.x); bounced = true }
      if (p.y <= 0) { p.y = 0; vel.current.y = Math.abs(vel.current.y); bounced = true }
      if (p.y >= bounds.height - h) { p.y = bounds.height - h; vel.current.y = -Math.abs(vel.current.y); bounced = true }
      facing.current = vel.current.x >= 0 ? 1 : -1
      lou.style.transform = `translate(${p.x}px, ${p.y}px) scaleX(${facing.current})`
      if (bounced) {
        lou.style.transition = 'none'
        lou.animate(
          [{ scale: '1 1' }, { scale: '1.12 0.88' }, { scale: '1 1' }],
          { duration: 220, easing: 'ease-out' }
        )
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, reduced])

  if (!active) return null

  return (
    <div className={styles.saver} role="presentation" aria-label="Screensaver — move the mouse to return">
      <div className={styles.frame}>
        <div className={styles.titleBar}>
          <span className={styles.titleStripes} aria-hidden="true" />
          <span className={styles.titleText}>LOU.SYS · SCREEN SAVER</span>
          <span className={styles.titleStripes} aria-hidden="true" />
        </div>
        <div ref={areaRef} className={styles.stage}>
          <div className={styles.sky} />
          <div className={styles.floor} aria-hidden="true" />
          <div
            ref={louRef}
            className={styles.lou}
            style={reduced ? { left: '50%', top: '55%', transform: 'translate(-50%,-50%)' } : undefined}
          >
            <LouSprite px={PX} />
          </div>
          <p className={styles.wake}>ANY INPUT WAKES THE MACHINE</p>
        </div>
      </div>
    </div>
  )
}
