'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Plate } from './CaseComponents'
import styles from './case.module.css'

/* "Grows with You": the concept film for the version we didn't ship, a
   family story where a son grows in independence and unlocks a richer
   app. The film plays once and rests on its last frame (no loop); the
   captions are burned in and there is no audio track.

   It follows DemoReel: muted, playsInline, preload="none" behind the
   film's own first frame, and an IntersectionObserver plays it at ~40%
   in view and pauses it on the way out. Reduced motion gets the still
   frame and no autoplay; an explicit play (the film, the chip, a
   chapter) still plays. A pause the reader asked for sticks: the
   observer won't restart it, and it won't restart a film that ended.

   Under the film, the chapter scrubber: one track cut into Jake's five
   chapters, each segment as wide as its span. The cap row's readout
   names the chapter on show, the tag counts m:ss. Hover a segment for
   its title above the track (touch shows the current one); click one to
   jump to its start and play; press and drag to scrub, seeking live.
   The track is a slider for the keyboard (Left/Right 5s, PageUp/
   PageDown a chapter, Home/End), and the five chapters are also a
   visually hidden list of buttons; focusing one shows its label and
   rings its segment, so the focus is never invisible.

   60fps: React state only changes once a second (the tag) or once a
   chapter (the readout). The playhead and the played fills are written
   straight to the DOM as transforms, from timeupdate plus a rAF loop
   that runs only while the film plays. */

const DIR = '/case/greenlight-invest/levels'

/* the film's own length, and the chapter starts in seconds (Jake). A
   segment runs from its start to the next one's; the half-second gaps
   in Jake's list are just the boundaries. */
const D = 82.6
const CHAPTERS: Array<[start: number, title: string]> = [
  [0, 'New Investing Milestone'],
  [15.5, 'Levels of Investing'],
  [28.5, 'Rewards and Incentives'],
  [45.5, 'Next Milestone'],
  [60, 'Level 2 Unlocked'],
]
const endOf = (i: number) => (i + 1 < CHAPTERS.length ? CHAPTERS[i + 1][0] : D)

const chapterAt = (t: number) => {
  let c = 0
  for (let i = 0; i < CHAPTERS.length; i++) if (CHAPTERS[i][0] <= t) c = i
  return c
}

const clock = (t: number) => {
  const s = Math.max(0, Math.floor(t))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/* a pointer has to travel this far before a press becomes a scrub; under
   it, the release is a click on the segment */
const DRAG_PX = 4

export function LevelsFilm() {
  const reduced = useReducedMotion()
  const vid = useRef<HTMLVideoElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLSpanElement>(null)
  const fills = useRef<Array<HTMLSpanElement | null>>([])

  const [sec, setSec] = useState(0)
  const [ch, setCh] = useState(0)
  const [playing, setPlaying] = useState(false)
  /* the label above the track: the hovered or focused chapter */
  const [peek, setPeek] = useState<number | null>(null)
  /* no hover on this device (or a touch press happened): the label
     follows the current chapter instead */
  const [touch, setTouch] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)
  /* the chapter whose hidden button holds keyboard focus: its segment
     wears the focus ring */
  const [ring, setRing] = useState<number | null>(null)

  /* the reader paused on purpose: the observer leaves it alone */
  const held = useRef(false)
  const press = useRef<{ x: number; id: number; was: boolean } | null>(null)
  const dragged = useRef(false)

  /* everything the time touches, in one place */
  const paint = useCallback((t: number) => {
    const p = Math.min(1, Math.max(0, t / D))
    if (head.current) head.current.style.transform = `translateX(${p * 100}%)`
    CHAPTERS.forEach(([s], i) => {
      const f = fills.current[i]
      if (!f) return
      const local = Math.min(1, Math.max(0, (t - s) / (endOf(i) - s)))
      f.style.transform = `scaleX(${local})`
    })
    setSec(Math.floor(t))
    setCh(chapterAt(t))
  }, [])

  const seek = useCallback(
    (t: number) => {
      const el = vid.current
      if (!el) return
      const to = Math.min(Number.isFinite(el.duration) ? el.duration : D, Math.max(0, t))
      if (el.preload !== 'auto') el.preload = 'auto'
      el.currentTime = to
      paint(to)
    },
    [paint],
  )

  const play = useCallback(() => {
    const el = vid.current
    if (!el) return
    held.current = false
    el.play().catch(() => {})
  }, [])

  const toggle = useCallback(() => {
    const el = vid.current
    if (!el) return
    if (el.paused || el.ended) play()
    else {
      held.current = true
      el.pause()
    }
  }, [play])

  /* the film's own events keep the UI honest, whoever moved it (the
     reader, the observer, a probe setting currentTime) */
  useEffect(() => {
    const el = vid.current
    if (!el) return
    let raf = 0
    const loop = () => {
      paint(el.currentTime)
      raf = requestAnimationFrame(loop)
    }
    const onPlay = () => {
      setPlaying(true)
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(loop)
    }
    const onStop = () => {
      setPlaying(false)
      cancelAnimationFrame(raf)
      paint(el.currentTime)
    }
    const onTime = () => paint(el.currentTime)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onStop)
    el.addEventListener('ended', onStop)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('seeking', onTime)
    el.addEventListener('seeked', onTime)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onStop)
      el.removeEventListener('ended', onStop)
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('seeking', onTime)
      el.removeEventListener('seeked', onTime)
    }
  }, [paint])

  /* DemoReel's observer, at 40% in view */
  useEffect(() => {
    const el = vid.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!reduced && !held.current && !el.ended) el.play().catch(() => {})
        } else if (!el.paused) el.pause()
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  useEffect(() => {
    setTouch(window.matchMedia('(hover: none)').matches)
  }, [])

  /* the time under a pointer: the segments sit at their spans' own
     percentages, so the track maps straight across */
  const timeAt = (clientX: number) => {
    const r = track.current?.getBoundingClientRect()
    if (!r || !r.width) return 0
    return (Math.min(r.width, Math.max(0, clientX - r.left)) / r.width) * D
  }

  const jump = (i: number) => {
    seek(CHAPTERS[i][0])
    play()
  }

  const label = peek ?? (touch || scrubbing ? ch : null)
  const align = label === 0 ? 'start' : label === CHAPTERS.length - 1 ? 'end' : 'center'
  /* the label hangs from its segment: centred over it, but flush with
     the track's ends for the first and last so it never leaves the plate */
  const labelAt =
    label === null ? 0
    : align === 'start' ? 0
    : align === 'end' ? 100
    : ((CHAPTERS[label][0] + endOf(label)) / 2 / D) * 100

  return (
    <Plate
      cap="Grows with You"
      readout={<span className={`${styles.plateCount} ${styles.levelsReadout}`}>{CHAPTERS[ch][1]}</span>}
      tag={clock(sec)}
      chip={
        <button
          type="button"
          className={`${styles.fidChipSeg} ${styles.levelsPlay}`}
          data-playing={playing || undefined}
          aria-label={playing ? 'Pause film' : 'Play film'}
          onClick={toggle}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      }
    >
      <video
        ref={vid}
        className={styles.levelsFilm}
        poster={`${DIR}/poster.webp`}
        muted
        playsInline
        preload="none"
        aria-label="Grows with You concept film, about 80 seconds, captions burned in, no sound: a father follows his son's investing milestones, and the app grows with the son until he unlocks level 2."
        onClick={toggle}
      >
        <source src={`${DIR}/levels.mp4`} type="video/mp4" />
        <source src={`${DIR}/levels.webm`} type="video/webm" />
      </video>

      <div className={styles.levelsScrub}>
        <span
          className={styles.levelsLabel}
          data-align={align}
          data-on={label !== null || undefined}
          style={{ left: `${labelAt}%` }}
          aria-hidden="true"
        >
          {label !== null ? CHAPTERS[label][1] : ''}
        </span>
        <div
          ref={track}
          className={styles.levelsTrack}
          role="slider"
          tabIndex={0}
          aria-label="Film position"
          aria-valuemin={0}
          aria-valuemax={Math.round(D)}
          aria-valuenow={sec}
          aria-valuetext={`${CHAPTERS[ch][1]}, ${clock(sec)} of ${clock(D)}`}
          data-scrubbing={scrubbing || undefined}
          onKeyDown={(e) => {
            const t = vid.current?.currentTime ?? 0
            const to =
              e.key === 'ArrowRight' || e.key === 'ArrowUp' ? t + 5
              : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? t - 5
              : e.key === 'PageDown' ? CHAPTERS[Math.min(CHAPTERS.length - 1, ch + 1)][0]
              : e.key === 'PageUp' ? CHAPTERS[t - CHAPTERS[ch][0] > 2 ? ch : Math.max(0, ch - 1)][0]
              : e.key === 'Home' ? 0
              : e.key === 'End' ? D
              : null
            if (to === null) return
            e.preventDefault()
            seek(to)
          }}
          onPointerDown={(e) => {
            if (e.button !== 0) return
            if (e.pointerType !== 'mouse') setTouch(true)
            dragged.current = false
            press.current = { x: e.clientX, id: e.pointerId, was: !(vid.current?.paused ?? true) }
          }}
          onPointerMove={(e) => {
            const p = press.current
            if (p && p.id === e.pointerId) {
              if (!dragged.current && Math.abs(e.clientX - p.x) >= DRAG_PX) {
                /* the press became a scrub: hold the film still and
                   follow the pointer, even off the track */
                dragged.current = true
                setScrubbing(true)
                setPeek(null)
                e.currentTarget.setPointerCapture(e.pointerId)
                vid.current?.pause()
              }
              if (dragged.current) seek(timeAt(e.clientX))
              return
            }
            if (e.pointerType === 'mouse') setPeek(chapterAt(timeAt(e.clientX)))
          }}
          onPointerUp={(e) => {
            const p = press.current
            if (!p || p.id !== e.pointerId) return
            press.current = null
            if (!dragged.current) return
            setScrubbing(false)
            if (p.was) play()
          }}
          onPointerCancel={() => {
            press.current = null
            dragged.current = false
            setScrubbing(false)
          }}
          onPointerLeave={() => {
            if (!press.current) setPeek(null)
          }}
        >
          {CHAPTERS.map(([s, title], i) => (
            <span
              key={title}
              className={styles.levelsSeg}
              data-current={i === ch || undefined}
              data-peek={i === peek || undefined}
              data-ring={i === ring || undefined}
              style={{ left: `${(s / D) * 100}%`, width: `${((endOf(i) - s) / D) * 100}%` }}
              onClick={() => {
                /* a scrub's release is not a click on whatever segment
                   it ended over */
                if (dragged.current) {
                  dragged.current = false
                  return
                }
                jump(i)
              }}
            >
              <span className={styles.levelsBar}>
                <span
                  ref={(el) => {
                    fills.current[i] = el
                  }}
                  className={styles.levelsFill}
                />
              </span>
            </span>
          ))}
          <span ref={head} className={styles.levelsHead} aria-hidden="true">
            <span />
          </span>
        </div>
        <ul className={styles.levelsChapters} aria-label="Chapters">
          {CHAPTERS.map(([, title], i) => (
            <li key={title}>
              <button
                type="button"
                aria-label={`Jump to ${title}`}
                onFocus={() => (setPeek(i), setRing(i))}
                onBlur={() => (setPeek(null), setRing(null))}
                onClick={() => jump(i)}
              >
                {title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Plate>
  )
}
