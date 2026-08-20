'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import { useSettings } from '@/store/settings'
import styles from './trash.module.css'

/* The recovered device — the Assistants concept still running on the phone
   it was filmed on, kept with the record like the rest of the evidence.
   The housing is built out of tokens the same way Studio's iPod is:
   --surface-inverse body, borders mixed from --content-inverse, everything
   sized off one --ph-w. The island and side keys are chrome, aria-hidden.

   Recording: ref/videos/trash-assistants.mov, baked to 640w 30fps mp4+webm
   in public/trash/ (no audio track — the capture had none). Tapping the
   screen pauses it; reduced motion starts it paused on the poster. */

export default function RecoveredPhone() {
  const reduced = useReducedMotion()
  const skin = useSettings((s) => s.skin)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  // autoplay is the muted-loop default; reduced motion holds the poster
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (reduced) v.pause()
    else void v.play().catch(() => {})
  }, [reduced])

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) void v.play().catch(() => {})
    else v.pause()
  }

  return (
    <figure className={styles.deviceWell}>
      <div className={styles.phone}>
        <button
          type="button"
          className={styles.phoneScreen}
          onClick={toggle}
          aria-label={t(playing ? 'trash.device.pause' : 'trash.device.play', skin)}
        >
          <video
            ref={videoRef}
            poster="/trash/assistants-poster.webp"
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
            {/* h264 for the world, vp9 for open-codec builds */}
            <source src="/trash/assistants.mp4" type="video/mp4" />
            <source src="/trash/assistants.webm" type="video/webm" />
          </video>
          {!playing && (
            <span className={styles.playCue} aria-hidden="true">
              ▶
            </span>
          )}
        </button>
        <span className={styles.phoneIsland} aria-hidden="true" />
        <span className={`${styles.phoneKey} ${styles.keyPower}`} aria-hidden="true" />
        <span className={`${styles.phoneKey} ${styles.keyVolUp}`} aria-hidden="true" />
        <span className={`${styles.phoneKey} ${styles.keyVolDown}`} aria-hidden="true" />
      </div>
      <figcaption>
        <Copy k="trash.device" as="span" className={styles.deviceTag} />
      </figcaption>
    </figure>
  )
}
