'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { DURATIONS } from '@/lib/motion'
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
   its title above the track (touch, a scrub, or the film playing shows
   the current one, so a reader watching sees the thing to scrub is down
   there); click one to jump to its start and play; press and drag to
   scrub, seeking live.
   The track is a slider for the keyboard (Left/Right 5s, PageUp/
   PageDown a chapter, Home/End), and the five chapters are also a
   visually hidden list of buttons; focusing one shows its label and
   rings its segment, so the focus is never invisible.

   The cap row's readout is just the chapter's title: the arrows that
   once flanked it to step a chapter back or on are gone (Jake, Oct 12);
   the track, its segments and PageUp/PageDown do that work.

   Toggling the film (a click on it, the chip, Space/Enter on the film)
   flashes the new state's glyph over the film's centre, the way video
   players do: a pop, then a fade, keyed on a counter so a rapid second
   toggle restarts it. It never takes the pointer. Reduced motion holds
   it still for the same span, then drops it.

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

/* the flash lives as long as its fade: the slow duration token, which
   the CSS splits into the pop (fade token) and the fade out (the rest) */
const FLASH_MS = parseFloat(DURATIONS.slow) * 1000

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
  /* the play/pause flash over the film: n keys it so a rapid toggle
     restarts the animation */
  const [flash, setFlash] = useState<{ n: number; kind: 'play' | 'pause' } | null>(null)

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
    const starting = el.paused || el.ended
    setFlash((f) => ({ n: (f?.n ?? 0) + 1, kind: starting ? 'play' : 'pause' }))
    if (starting) play()
    else {
      held.current = true
      el.pause()
    }
  }, [play])

  /* the flash unmounts itself once its fade is done; a newer flash
     resets the clock */
  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), FLASH_MS)
    return () => window.clearTimeout(t)
  }, [flash])

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

  /* the label: the hovered or focused chapter first; failing that, the
     current one whenever there's no hover to ask (touch), a scrub is
     under way, or the film is playing, so the reader watching it sees
     the chapter tick over on the track and knows that's what to scrub.
     Mid-play it hops to the next segment at a chapter's boundary: its
     left isn't animated (only its opacity), so it lands, never slides. */
  const label = peek ?? (touch || scrubbing || playing ? ch : null)
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
      <div className={styles.levelsStage}>
        <video
          ref={vid}
          className={styles.levelsFilm}
          poster={`${DIR}/poster.webp`}
          muted
          playsInline
          preload="none"
          tabIndex={0}
          aria-label="Grows with You concept film, about 80 seconds, captions burned in, no sound: a father follows his son's investing milestones, and the app grows with the son until he unlocks level 2. Space or Enter plays and pauses."
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key !== ' ' && e.key !== 'Enter') return
            e.preventDefault()
            toggle()
          }}
        >
          <source src={`${DIR}/levels.mp4`} type="video/mp4" />
          <source src={`${DIR}/levels.webm`} type="video/webm" />
        </video>
        {flash && (
          <span key={flash.n} className={styles.levelsFlash} data-kind={flash.kind} aria-hidden="true">
            <span>
              <svg viewBox="0 0 24 24" width="26" height="26" focusable="false">
                {flash.kind === 'play' ?
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                : <path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor" />}
              </svg>
            </span>
          </span>
        )}
      </div>

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
