'use client'

import { runs } from '@/components/shell/pixelIcons'
import styles from './case.module.css'

/* §06 live-audit centerpiece: the desk the loop ran on, drawn lo-fi.
   Laptop with DevTools open on the staging mirror, the hub beside it,
   Jake between them in his beanie, the cat asleep on the hub. Rain,
   steam, and a tick across the screens run as a three-beat ambient
   cycle. The fidelity pair flips the build (events colliding on both
   drawn screens, collisions marked pink) to the fix (rows stacked
   clean, the edited declaration lit), and Jake's head turns to the
   screen each mode is about. Scene art is decorative; the mono
   readout under it carries the change.
   Palette letters: '#' cream ink (currentColor, the plate sets it),
   '+' cream at .35, 'B'/'b'/'S' accent blue at 1/.35/.15, 'P' pink.
   The plate ground is theme-fixed (--surface-inverse), so the two
   accents hardcode from the classic-dark hexes that hold on it:
   --accent #5c7cff, --accent-expressive #f2a6c2 (as puzzleImages.ts). */

const ACCENT = '#5c7cff'
const EXPRESSIVE = '#f2a6c2'

/* 128x64, authored in the scratch pixel loop (ASCII grid, generated
   ellipses and dithers). Head, events, and ambient beats land below. */
const BASE = [
  '................................................................................................................................',
  '................................................................................................................................',
  '................................................................................................................................',
  '........+++++++++++++++++++++++.................................................................................................',
  '........+..........+..........+.................................................................................................',
  '........+..........+..........+........................................................................++.......................',
  '........+..........+..........+...................................+++++++++.........................##.++...++.........#........',
  '........+..........+..........+...................................+.......+...++++++................##.++.B.++........#.#.......',
  '........+..........+..........+...................................+...b...+...+....+................##.++.B.++.......+...+......',
  '........+..........+..........+...................................+..b.b..+...+.P..+..............+++++++++++++++++++++++++++...',
  '........+..........+..........+...................................+.......+...+....+................................+.....+.....',
  '........+++++++++++++++++++++++...................................+.......+...+....+............................................',
  '........+..........+..........+...................................+++++++++...++++++............................................',
  '........+..........+..........+.................................................................................................',
  '........+..........+..........+.................................................................................................',
  '........+..........+..........+.................................................................................................',
  '........+..........+..........+.................................................................................................',
  '........+..........+..........+.................................................................................................',
  '........+..........+..........+.................................................................................................',
  '........+++++++++++++++++++++++................................................b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b........',
  '.......+++++++++++++++++++++++++..............................................b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.........',
  '................................................................................######################################..........',
  '................................................................................######################################..........',
  '...............b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b................................######################################..........',
  '..............b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b...............................###SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..........',
  '................###############################.................................###SbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbS###..........',
  '................#SSSSSSSSSSSSSSSSbSSSSSSSSSSSS#.................................###SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..........',
  '................#SSSSSSSSSSSSSSSSbSSSSSSSSSSSS#.................................###SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..........',
  '................#SSSSSSSSSSSSSSSSbSbbbbbbbbbSS#.................................###SbbSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..........',
  '................#SSSSSSSSSSSSSSSSbSSSSSSSSSSSS#.................................###SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..........',
  '................#SSSSSSSSSSSSSSSSbSbbbbbbbbbSS#............+++++++++............###SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..........',
  '................#SSSSSSSSSSSSSSSSbSSSSSSSSSSSS#........####++++++++++####.......###SbbSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..........',
  '................#SSSSSSSSSSSSSSSSbSbbbbbbbbbSS#........+++++++++++++++++........###SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..........',
  '................#SSSSSSSSSSSSSSSSbSSSSSSSSSSSS#.......+++++++++++++++++++.......###SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..........',
  '................#SSSSSSSSSSSSSSSSbSbbbbbbbbbSS#.......+++++++++++++++++++.......###SbbSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..........',
  '................#SSSSSSSSSSSSSSSSbSSSSSSSSSSSS#.......+++++++++++++++++++.......###SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..........',
  '................#SSSSSSSSSSSSSSSSbSbbbbbbbbbSS#.......+++++++++++++++++++.......###SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..........',
  '................#SSSSSSSSSSSSSSSSbSSSSSSSSSSSS#........+++++++++++++++++........###SbbSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###....+.....',
  '................#SSSSSSSSSSSSSSSSbSbbbbbbbbbSS#........+++++++++++++++++........###SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..+++++...',
  '................#SSSSSSSSSSSSSSSSbSSSSSSSSSSSS#......+.+++++++++++++++++..+.....###SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..+++++...',
  '..........++++++#SSSSSSSSSSSSSSSSbSbbbbbbbbbSS#.....++.+++++++++++++++++..++....###SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS###..+++++...',
  '..........+.bbb.#SSSSSSSSSSSSSSSSbSSSSSSSSSSSS#.....++.+++++++++++++++++..++....######################################..+++++...',
  '.....++++++++...###############################.....++.+++++++++++++++++..++##########################################..........',
  '.....+.bbb++++++###############################.....++.+++++++++++++++++..++##########################################..#####...',
  '.....+.bbb..+..+++++++++++++++++++++++++++++++++....++.+++++++++++++++++..++####................++++++..................#####...',
  '.....++++++++.+++++++++++++++++++++++++++++++++++...++.+++++++++++++++++..++####................++++++..................#####...',
  '..##################################################++#+++++++++++++++++##++###################################################.',
  '..+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++.',
  '......++...b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.+..++.++++++++++++++++++.++...b.b.b.b.b.b.b.b.b.b.+.b.b.b.b.b.b.b.b.b..++......',
  '......++..b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b.b+b.++.++++++++++++++++++.++..b.b.b.b.b.b.b.b.b.b.b+b.b.b.b.b.b.b.b.b.b.++......',
  '......++.........................................+.....++++++++++++++++++..........................+....................++......',
  '......++.........................................+.............++..................................+....................++......',
  '......++.........................................+.............++.................................+.....................++......',
  '......++..........................................+............++................................+......................++......',
  '......++...........................................+...........++.......................................................++......',
  '......++............................................+..........++.......................+++++++++++++++++...............++......',
  '......++.............................................+++++++++++++++++++++++++++++++++++++B++++++++++++++...............++......',
  '......++.................................................++++++++++++++.................+++++++++++++++++...............++......',
  '......++................................................................................................................++......',
  '......++................................................................................................................++......',
  '......++................................................................................................................++......',
  '................................................................................................................................',
  '................................................................................................................................',
  '................................................................................................................................',
]

/* The head, from behind, turned toward the screen the mode is about:
   build looks at the DevTools laptop, fix looks at the hub. The
   palette has two accents and no orange, so the red curls under the
   beanie take the expressive pink. Blitted at x=50, y=15. */
const HEAD_BUILD = [
  '............................',
  '.........+++++..............',
  '.......b+bbbbbb+............',
  '.......+bbbbbbbb+...........',
  '......bbbbbbbbbbb...........',
  '.......bbbbbbbbb............',
  '.......bbbbbbbbb............',
  '.......Pb+++++bbP...........',
  '......PP+++++++.PP..........',
  '......###+++++++............',
  '.......+++++++++............',
  '........+++++++.............',
  '.........+++++..............',
  '..........P+P+P+............',
  '..........++++++............',
  '..........++++++............',
]
const HEAD_FIX = [
  '............................',
  '.............+++++..........',
  '...........b+bbbbbb+........',
  '...........+bbbbbbbb+.......',
  '..........bbbbbbbbbbb.......',
  '...........bbbbbbbbb........',
  '...........bbbbbbbbb........',
  '...........Pb+++++bbP.......',
  '..........PP+++++++.PP......',
  '...........++++++++###......',
  '...........+++++++++........',
  '............+++++++.........',
  '.............+++++..........',
  '............++P+P+P.........',
  '............++++++..........',
  '............++++++..........',
]

/* One event bar, laptop bars 1px tall, hub bars 2px. Writing B over B
   turns the cell P: the collision itself is what the build marks pink. */
type Bar = [x0: number, y: number, x1: number, h?: number]

const HUB_BUILD: Bar[] = [
  [90, 27, 101], [96, 28, 107],
  [89, 31, 100], [94, 32, 105],
  [99, 35, 110], [92, 36, 103],
]
const HUB_FIX: Bar[] = [
  [89, 27, 100], [89, 30, 104], [89, 33, 98], [89, 36, 106], [89, 39, 101, 1],
]
const LAPTOP_BUILD: Bar[] = [
  [19, 28, 26, 1], [22, 28, 30, 1],
  [19, 31, 27, 1], [24, 31, 31, 1],
  [20, 34, 28, 1], [25, 34, 30, 1],
]
const LAPTOP_FIX: Bar[] = [
  [19, 28, 26, 1], [19, 30, 29, 1], [19, 32, 25, 1], [19, 34, 28, 1], [19, 36, 30, 1],
]

function compile(mode: 'build' | 'fix') {
  const g = [...BASE]
  const set = (x: number, y: number, ch: string) => {
    g[y] = g[y].slice(0, x) + ch + g[y].slice(x + 1)
  }
  const sprite = mode === 'build' ? HEAD_BUILD : HEAD_FIX
  sprite.forEach((row, j) => {
    ;[...row].forEach((ch, i) => { if (ch !== '.') set(50 + i, 15 + j, ch) })
  })
  const bars = mode === 'build' ? [...HUB_BUILD, ...LAPTOP_BUILD] : [...HUB_FIX, ...LAPTOP_FIX]
  for (const [x0, y, x1, h = 2] of bars)
    for (let yy = y; yy < y + h; yy++)
      for (let x = x0; x <= x1; x++) set(x, yy, g[yy][x] === 'B' ? 'P' : 'B')
  /* the fix lights the edited declaration in the DevTools pane */
  if (mode === 'fix') for (let x = 35; x <= 41; x++) set(x, 32, 'P')
  return {
    ink: runs(g, (c) => c === '#'),
    dim: runs(g, (c) => c === '+'),
    wash: runs(g, (c) => c === 'S'),
    dimBlue: runs(g, (c) => c === 'b'),
    blue: runs(g, (c) => c === 'B'),
    pink: runs(g, (c) => c === 'P'),
  }
}

const MODES = { build: compile('build'), fix: compile('fix') }

/* Ambient beats, a cycle of three: rain crossing the window panes,
   steam off the mug, a tick walking the screens. Pre-compiled path
   data from the scratch loop; the css shows one beat at a time and
   reduced motion holds the first. */
const BEATS = [
  {
    dim: 'M78 38h1v1h-1zM77 40h1v1h-1z',
    dimBlue: 'M13 4h2v1h-2zM23 4h2v1h-2zM12 5h2v1h-2zM22 5h2v1h-2zM25 5h1v1h-1zM11 6h1v1h-1zM24 6h1v1h-1zM17 7h1v1h-1zM20 7h1v1h-1zM16 8h1v1h-1zM18 8h1v1h-1zM21 8h1v1h-1zM15 9h3v1h-3zM20 9h1v1h-1zM22 9h1v1h-1zM28 9h1v1h-1zM14 10h2v1h-2zM21 10h1v1h-1zM27 10h1v1h-1zM14 12h2v1h-2zM17 12h2v1h-2zM20 12h2v1h-2zM13 13h2v1h-2zM16 13h2v1h-2zM20 13h1v1h-1zM29 13h1v1h-1zM28 14h1v1h-1zM24 15h1v1h-1zM23 16h1v1h-1zM25 16h1v1h-1zM10 17h1v1h-1zM13 17h1v1h-1zM22 17h3v1h-3zM9 18h1v1h-1zM12 18h1v1h-1zM21 18h2v1h-2z',
    blue: 'M88 25h2v1h-2zM44 30h1v1h-1z',
  },
  {
    dim: 'M78 36h1v1h-1zM77 38h1v1h-1zM78 40h1v1h-1z',
    dimBlue: 'M14 4h2v1h-2zM21 4h1v1h-1zM27 4h1v1h-1zM13 5h2v1h-2zM20 5h1v1h-1zM26 5h1v1h-1zM12 6h2v1h-2zM22 6h2v1h-2zM11 7h2v1h-2zM21 7h2v1h-2zM24 7h1v1h-1zM10 8h1v1h-1zM23 8h1v1h-1zM16 9h1v1h-1zM29 9h1v1h-1zM15 10h1v1h-1zM17 10h1v1h-1zM20 10h1v1h-1zM28 10h1v1h-1zM9 12h1v1h-1zM12 12h1v1h-1zM21 12h2v1h-2zM11 13h1v1h-1zM20 13h2v1h-2zM13 14h2v1h-2zM16 14h2v1h-2zM20 14h1v1h-1zM29 14h1v1h-1zM12 15h2v1h-2zM15 15h2v1h-2zM28 15h1v1h-1zM27 16h1v1h-1zM23 17h1v1h-1zM22 18h1v1h-1zM24 18h1v1h-1z',
    blue: 'M97 25h2v1h-2zM44 34h1v1h-1z',
  },
  {
    dim: 'M77 35h1v1h-1zM78 37h1v1h-1zM77 39h1v1h-1z',
    dimBlue: 'M15 4h1v1h-1zM28 4h1v1h-1zM14 5h1v1h-1zM16 5h1v1h-1zM27 5h1v1h-1zM29 5h1v1h-1zM13 6h3v1h-3zM20 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM12 7h2v1h-2zM25 7h1v1h-1zM11 8h2v1h-2zM21 8h2v1h-2zM10 9h2v1h-2zM20 9h2v1h-2zM23 9h1v1h-1zM9 10h1v1h-1zM22 10h1v1h-1zM22 12h1v1h-1zM21 13h1v1h-1zM23 13h1v1h-1zM11 14h1v1h-1zM18 14h1v1h-1zM20 14h3v1h-3zM10 15h1v1h-1zM17 15h1v1h-1zM20 15h1v1h-1zM12 16h2v1h-2zM15 16h2v1h-2zM28 16h2v1h-2zM11 17h2v1h-2zM14 17h2v1h-2zM27 17h2v1h-2zM26 18h1v1h-1z',
    blue: 'M106 25h2v1h-2zM44 38h1v1h-1z',
  },
]
const BEAT_CLASSES = [styles.auditBeat1, styles.auditBeat2, styles.auditBeat3]

/* ⚠ placeholder-shaped values: the real ticket numbers are Jake's */
const READOUT = {
  build: 'EVENT.TOP · 84px · 84px · COLLIDES',
  fix: 'EVENT.TOP · var(--timeline-row) · STACKS',
}

export function LiveAudit({ mode }: { mode: 'build' | 'fix' }) {
  const p = MODES[mode]
  return (
    <div className={styles.audit}>
      <svg viewBox="0 0 128 64" aria-hidden="true">
        <g shapeRendering="crispEdges" fill="currentColor">
          <path d={p.ink} />
          <path d={p.dim} opacity={0.35} />
          <path d={p.wash} fill={ACCENT} opacity={0.15} />
          <path d={p.dimBlue} fill={ACCENT} opacity={0.35} />
          <path d={p.blue} fill={ACCENT} />
          <path d={p.pink} fill={EXPRESSIVE} />
          {BEATS.map((f, i) => (
            <g key={i} className={BEAT_CLASSES[i]}>
              <path d={f.dim} opacity={0.35} />
              <path d={f.dimBlue} fill={ACCENT} opacity={0.35} />
              <path d={f.blue} fill={ACCENT} />
            </g>
          ))}
        </g>
      </svg>
      <p className={styles.auditReadout}>
        <span className={styles.auditTick} aria-hidden="true">▸ </span>
        {READOUT[mode]}
      </p>
    </div>
  )
}
