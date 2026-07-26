'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useStudio } from '@/lib/studioPlayer'
import { Stamp } from '@/components/primitives/Stamp'
import { SPRINGS } from '@/lib/motion'
import { sfx } from '@/lib/sound'
import ClickWheel from './ClickWheel'
import Visualizer, { type VizMode } from './Visualizer'
import styles from './studio.module.css'

/* Studio — Jake's own recordings, played on an iPod video built out of
   LUNDE OS tokens. Three screens on one linear stack:
       Songs  ←MENU—  Now Playing  —SELECT→  Visualizer
   MENU walks back down it, SELECT walks up (and, from Songs, plays the
   highlighted track). The click wheel turns: volume on Now Playing and
   Visualizer, selection on Songs. Playback persists when the window
   closes — the engine lives in lib/studioPlayer. */

type Screen = 'songs' | 'now' | 'viz'

const TITLES: Record<Screen, string> = {
  songs: 'Songs',
  now: 'Now Playing',
  viz: 'Visualizer',
}

const MODES: VizMode[] = ['bars', 'scope', 'rings']

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

/* Manifest titles read "Song - Artist (jaique remix)". Split them into the
   three lines the Now Playing screen wants; fall back to the raw string the
   moment the pattern doesn't hold, so a plainly-named file still reads. */
const plural = (s: string) => (/remix$/i.test(s) ? `${s}es` : s)
function parseTitle(raw?: string) {
  if (!raw) return { song: '—', artist: '', album: '' }
  const full = raw.match(/^(.+?)\s+-\s+(.+?)\s*\(([^()]+)\)\s*$/)
  if (full) return { song: full[1].trim(), artist: full[2].trim(), album: plural(full[3].trim()) }
  const pair = raw.match(/^(.+?)\s+-\s+(.+)$/)
  if (pair) return { song: pair[1].trim(), artist: pair[2].trim(), album: '' }
  return { song: raw, artist: '', album: '' }
}

export default function Studio() {
  const tracks = useStudio((s) => s.tracks)
  const loaded = useStudio((s) => s.loaded)
  const index = useStudio((s) => s.index)
  const playing = useStudio((s) => s.playing)
  const time = useStudio((s) => s.time)
  const duration = useStudio((s) => s.duration)
  const volume = useStudio((s) => s.volume)
  const load = useStudio((s) => s.load)
  const play = useStudio((s) => s.play)
  const toggle = useStudio((s) => s.toggle)
  const next = useStudio((s) => s.next)
  const prev = useStudio((s) => s.prev)
  const setVolume = useStudio((s) => s.setVolume)

  const [screen, setScreen] = useState<Screen>('now')
  const [sel, setSel] = useState(0)
  const [mode, setMode] = useState<VizMode>('bars')
  const [volCue, setVolCue] = useState(false)

  const reduced = useReducedMotion()
  const listRef = useRef<HTMLDivElement>(null)
  const turnFrom = useRef(volume)
  const cueTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    void load()
  }, [load])

  useEffect(
    () => () => {
      if (cueTimer.current) clearTimeout(cueTimer.current)
    },
    []
  )

  // the wheel's own scroll — never scrollIntoView, which would drag the
  // desktop around behind the window
  useEffect(() => {
    if (screen !== 'songs') return
    const list = listRef.current
    const row = list?.children[sel] as HTMLElement | undefined
    if (!list || !row) return
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight
    }
  }, [sel, screen])

  const showVolume = () => {
    setVolCue(true)
    if (cueTimer.current) clearTimeout(cueTimer.current)
    cueTimer.current = setTimeout(() => setVolCue(false), 1400)
  }

  /* ---- wheel semantics -------------------------------------------------- */

  const onMenu = () => {
    if (screen === 'viz') setScreen('now')
    else if (screen === 'now') {
      setSel(index)
      setScreen('songs')
    } else setSel(index) // already at the root — snap back to what's playing
  }

  const onSelect = () => {
    if (screen === 'songs') {
      play(sel)
      setScreen('now')
    } else if (screen === 'now') setScreen('viz')
    else setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length])
  }

  const onDetent = (dir: 1 | -1) => {
    if (screen === 'songs') {
      if (!tracks.length) return
      setSel((s) => Math.max(0, Math.min(tracks.length - 1, s + dir)))
    } else {
      setVolume(volume + dir * 0.05)
      showVolume()
    }
  }

  const onTurn = (frac: number, phase: 'start' | 'move') => {
    if (phase === 'start') {
      turnFrom.current = volume
      return
    }
    setVolume(turnFrom.current + frac)
    showVolume()
  }

  /* ---- empty state ------------------------------------------------------ */

  if (loaded && tracks.length === 0) {
    return (
      <div className={styles.studio}>
        <div className={styles.await}>
          <Stamp>Awaiting masters</Stamp>
          <p className={styles.awaitNote}>
            The player is wired — Jake&rsquo;s recordings are being transferred from the vault.
          </p>
        </div>
      </div>
    )
  }

  /* ---- device ----------------------------------------------------------- */

  const current = tracks[index]
  const meta = parseTitle(current?.title)
  const pct = duration > 0 ? Math.min(1, Math.max(0, time / duration)) : 0
  const counter = `${tracks.length ? index + 1 : 0} of ${tracks.length}`

  const pane = {
    initial: reduced ? false : { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0 },
    exit: reduced ? { opacity: 0 } : { opacity: 0, x: -10 },
    transition: SPRINGS.deck,
  }

  return (
    <div className={styles.studio}>
      <div className={styles.pod}>
        <div className={styles.bezel}>
          <div className={styles.screen}>
            <div className={styles.statusBar}>
              <span className={styles.statusGlyph} aria-hidden="true">
                {playing ? '▶' : '❚❚'}
              </span>
              <span className={styles.statusTitle} aria-live="polite">
                {TITLES[screen]}
              </span>
              <span className={styles.battery} aria-hidden="true" />
            </div>

            <div className={styles.screenBody}>
              <AnimatePresence initial={false}>
                {screen === 'now' && (
                  <motion.div key="now" className={`${styles.pane} ${styles.nowPane}`} {...pane}>
                    <p className={styles.counter}>{counter}</p>
                    <div className={styles.npMain}>
                      {current?.art ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={current.art} alt="" className={styles.npArt} aria-hidden="true" />
                      ) : (
                        <span className={styles.npArt} aria-hidden="true" />
                      )}
                      <span className={styles.npMeta}>
                        <span className={styles.npSong}>{meta.song}</span>
                        <span className={styles.npArtist}>{meta.artist || '—'}</span>
                        <span className={styles.npAlbum}>{meta.album}</span>
                      </span>
                    </div>

                    <div className={styles.npFoot}>
                      {volCue ? (
                        <>
                          <div className={styles.track} aria-hidden="true">
                            <span
                              className={styles.fill}
                              style={{ transform: `scaleX(${volume})` }}
                            />
                          </div>
                          <div className={styles.times} role="status">
                            <span>VOL</span>
                            <span>{Math.round(volume * 100)}%</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className={styles.track}
                            role="progressbar"
                            aria-label="Track position"
                            aria-valuemin={0}
                            aria-valuemax={Math.round(duration) || 0}
                            aria-valuenow={Math.round(time) || 0}
                            aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
                          >
                            <span className={styles.fill} style={{ transform: `scaleX(${pct})` }} />
                          </div>
                          <div className={styles.times}>
                            <span>{fmt(time)}</span>
                            <span>-{fmt(Math.max(0, duration - time))}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}

                {screen === 'songs' && (
                  <motion.div key="songs" className={styles.pane} {...pane}>
                    <div className={styles.songs} ref={listRef} role="list" aria-label="Tracks">
                      {tracks.map((t, i) => {
                        const p = parseTitle(t.title)
                        return (
                          <div key={t.file} role="listitem" className={styles.songItem}>
                            <button
                              type="button"
                              className={styles.songRow}
                              data-sel={i === sel || undefined}
                              aria-current={i === index ? 'true' : undefined}
                              onClick={() => {
                                sfx.tap()
                                setSel(i)
                                play(i)
                                setScreen('now')
                              }}
                            >
                              <span className={styles.songNo}>{String(i + 1).padStart(2, '0')}</span>
                              <span className={styles.songName}>{p.song}</span>
                              {i === index && (
                                <span className={styles.songMark} aria-hidden="true">
                                  {playing ? '▶' : '❚❚'}
                                </span>
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {screen === 'viz' && (
                  <motion.div key="viz" className={`${styles.pane} ${styles.vizPane}`} {...pane}>
                    <Visualizer mode={mode} />
                    <span className={styles.vizTag}>{mode.toUpperCase()}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <ClickWheel
          rotary={screen === 'songs' ? 'detent' : 'continuous'}
          onDetent={onDetent}
          onTurn={onTurn}
          onMenu={onMenu}
          onSelect={onSelect}
          onPrev={prev}
          onNext={next}
          onPlayPause={toggle}
          playing={playing}
        />
      </div>
    </div>
  )
}
