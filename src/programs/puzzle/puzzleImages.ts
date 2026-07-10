/* Puzzle image generators — every puzzle is cut from something on the
   site, drawn on-device (no image assets): the rings poster, the Louie
   model, the agent crew, the Invest Moat, and pixel Lou. All 480×360. */

import louieModel from '@/programs/visualizers/louie-model.json'

export const IMG_W = 480
export const IMG_H = 360

export type PuzzleDef = {
  id: string
  name: string
  hint: string
  draw: (g: CanvasRenderingContext2D) => Promise<void> | void
}

const PLATE = '#131811'
const CREAM = '#E7E1D2'
const PINK = '#F2A6C2'
const BLUE = '#5C7CFF'

function base(g: CanvasRenderingContext2D) {
  g.fillStyle = PLATE
  g.fillRect(0, 0, IMG_W, IMG_H)
}

/* 01 — the doppler rings poster (the original) */
function drawRings(g: CanvasRenderingContext2D) {
  base(g)
  g.strokeStyle = PINK
  for (let r = 8; r < 300; r += 14) {
    g.lineWidth = 3 + r * 0.02
    g.beginPath()
    g.arc(140, IMG_H / 2 + 20, r, 0, Math.PI * 2)
    g.stroke()
  }
  g.fillStyle = 'rgba(19,24,17,0.55)'
  g.fillRect(0, 0, IMG_W, IMG_H)
  g.fillStyle = CREAM
  g.font = 'bold 54px monospace'
  g.fillText('LUNDE', 250, 150)
  g.fillText('OS', 250, 208)
  g.fillStyle = BLUE
  g.font = '16px monospace'
  g.fillText('JIG-01 · 1992', 250, 250)
  g.fillStyle = PINK
  g.fillRect(250, 264, 96, 8)
}

/* 02 — louie, flat-shaded from the model JSON (fixed pose) */
function drawLouie(g: CanvasRenderingContext2D) {
  base(g)
  const verts = louieModel.verts as [number, number, number][]
  const faces = louieModel.faces as [number, number, number][]
  const yaw = 0.85
  const pitch = 0.18
  const cy = Math.cos(yaw), sy = Math.sin(yaw)
  const cp = Math.cos(pitch), sp = Math.sin(pitch)
  const scale = Math.min(IMG_W, IMG_H) * 0.44
  const proj = verts.map(([x, y, z]) => {
    const x1 = x * cy + z * sy
    const z1 = -x * sy + z * cy
    const y2 = y * cp - z1 * sp
    const z2 = y * sp + z1 * cp
    return [IMG_W / 2 + x1 * scale, IMG_H / 2 - y2 * scale, z2] as const
  })
  const order = faces
    .map((f, i) => [i, (proj[f[0]][2] + proj[f[1]][2] + proj[f[2]][2]) / 3] as const)
    .sort((a, b) => a[1] - b[1])
  const light = [0.4, -0.7, 0.6]
  const lightLen = Math.hypot(...light)
  for (const [fi] of order) {
    const [a, b, c] = faces[fi]
    const [ax, ay, az] = proj[a]
    const [bx, by, bz] = proj[b]
    const [cx, cyv, cz] = proj[c]
    const ux = bx - ax, uy = by - ay, uz = bz - az
    const vx = cx - ax, vy = cyv - ay, vz = cz - az
    const nx = uy * vz - uz * vy
    const ny = uz * vx - ux * vz
    const nz = ux * vy - uy * vx
    const nLen = Math.hypot(nx, ny, nz) || 1
    const lam = Math.abs((nx * light[0] + ny * light[1] + nz * light[2]) / (nLen * lightLen))
    g.beginPath()
    g.moveTo(ax, ay)
    g.lineTo(bx, by)
    g.lineTo(cx, cyv)
    g.closePath()
    g.fillStyle = `rgba(231,225,210,${(0.14 + lam * 0.8).toFixed(3)})`
    g.fill()
    g.strokeStyle = 'rgba(9,12,10,0.5)'
    g.lineWidth = 0.4
    g.stroke()
  }
  g.fillStyle = PINK
  g.font = '14px monospace'
  g.fillText('LOUIE · FROM MEMORY', 18, IMG_H - 18)
}

/* 03 — the crew (avatar shapes loaded from public/cc) */
async function drawCrew(g: CanvasRenderingContext2D) {
  base(g)
  const crew = [
    ['FABLE', '/cc/avatars/shape-101.svg'],
    ['HERTZ', '/cc/avatars/shape-12.svg'],
    ['NYQUIST', '/cc/avatars/shape-27.svg'],
    ['FOURIER', '/cc/avatars/shape-46.svg'],
    ['DOPPLER', '/cc/avatars/shape-17.svg'],
  ] as const
  g.strokeStyle = 'rgba(231,225,210,0.2)'
  g.lineWidth = 0.7
  g.beginPath()
  g.moveTo(40, 300)
  g.lineTo(440, 60)
  g.moveTo(40, 60)
  g.lineTo(440, 300)
  g.stroke()
  const imgs = await Promise.all(
    crew.map(
      ([, src]) =>
        new Promise<HTMLImageElement>((res, rej) => {
          const im = new Image()
          im.onload = () => res(im)
          im.onerror = rej
          im.src = src
        })
    )
  )
  crew.forEach(([name], i) => {
    const x = 30 + i * 88
    const y = i % 2 === 0 ? 90 : 170
    // shapes are black; draw then invert to cream via composite
    const off = document.createElement('canvas')
    off.width = 74
    off.height = 74
    const og = off.getContext('2d')!
    og.drawImage(imgs[i], 0, 0, 74, 74)
    og.globalCompositeOperation = 'source-in'
    og.fillStyle = i === 0 ? PINK : CREAM
    og.fillRect(0, 0, 74, 74)
    g.drawImage(off, x, y)
    g.fillStyle = i === 0 ? PINK : CREAM
    g.font = '11px monospace'
    g.fillText(name, x + 6, y + 92)
  })
  g.fillStyle = BLUE
  g.font = '13px monospace'
  g.fillText('THE CREW · COMMAND.CTR', 18, IMG_H - 20)
}

/* 04 — the economic moat (Invest's signature component) */
function drawMoat(g: CanvasRenderingContext2D) {
  base(g)
  const cx = 200
  const cy = IMG_H / 2
  ;[46, 88, 128].forEach((r, i) => {
    g.strokeStyle = CREAM
    g.globalAlpha = 0.35 - i * 0.06
    g.setLineDash(i > 0 ? [2, 4] : [])
    g.lineWidth = 1
    g.beginPath()
    g.arc(cx, cy, r, 0, Math.PI * 2)
    g.stroke()
  })
  g.setLineDash([])
  g.globalAlpha = 1
  g.fillStyle = PINK
  g.beginPath()
  g.arc(cx, cy, 27, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = PLATE
  g.font = 'bold 12px monospace'
  g.fillText('NFLX', cx - 14, cy + 4)
  g.fillStyle = CREAM
  g.font = '10px monospace'
  const nodes: Array<[string, number, number]> = [
    ['DISNEY', cx, cy - 48],
    ['AMAZON', cx + 48, cy],
    ['APPLE', cx - 64, cy + 48],
    ['GOOGLE', cx - 20, cy - 106],
    ['COMCAST', cx + 96, cy + 84],
  ]
  nodes.forEach(([n, x, y]) => {
    g.beginPath()
    g.arc(x, y, 3.5, 0, Math.PI * 2)
    g.fill()
    g.fillText(n, x + 7, y + 3)
  })
  g.fillStyle = BLUE
  g.font = '11px monospace'
  g.fillText('— CLOSEST RIVALS', 352, 130)
  g.fillText('— COMPETITORS', 352, 154)
  g.fillText('— DISTANT THREATS', 352, 178)
  g.fillStyle = PINK
  g.font = '13px monospace'
  g.fillText('ECONOMIC MOAT · FIG. B', 18, IMG_H - 20)
}

/* 05 — pixel lou, big */
function drawPixelLou(g: CanvasRenderingContext2D) {
  // checker floor from LOU.SYS
  g.fillStyle = PLATE
  g.fillRect(0, 0, IMG_W, IMG_H / 2)
  const sq = 40
  for (let y = IMG_H / 2; y < IMG_H; y += sq) {
    for (let x = 0; x < IMG_W; x += sq) {
      g.fillStyle = ((x + y) / sq) % 2 === 0 ? '#B5A183' : CREAM
      g.fillRect(x, y, sq, sq)
    }
  }
  const MAP = [
    '.................ccccc....',
    '................ccccccc...',
    '...............scccccccc..',
    '...............ccccccccc..',
    '.....ccc.......cccccccccc.',
    '....ccccc......cckccccnnn.',
    '.....ccc.......sccccccnnn.',
    '......c...cccccssccccccp..',
    '.........ccccccccsscccc...',
    '......ccccccccccccsscc....',
    '.....cccccccccccccccc.....',
    '....scccccccccccccccc.....',
    '....ccccccccccccccccc.....',
    '....cccccccccccccccc......',
    '.....ccs..ccs...ccs.......',
    '.....ccc..ccc...ccc.......',
    '.....ccc..ccc...ccc.......',
    '.....ccc..ccc...ccc.......',
    '....sccc..sccc..sccc......',
  ]
  const COLORS: Record<string, string> = {
    c: '#F3ECDA',
    s: '#D9C7A4',
    k: '#17150D',
    n: '#17150D',
    p: PINK,
  }
  const px = 11
  const ox = (IMG_W - 26 * px) / 2
  const oy = 40
  MAP.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = COLORS[row[x]]
      if (!col) continue
      g.fillStyle = col
      g.fillRect(ox + x * px, oy + y * px, px, px)
    }
  })
  g.fillStyle = PLATE
  g.font = 'bold 13px monospace'
  g.fillText('LOU.SYS', 18, IMG_H - 16)
}

export const PUZZLES: PuzzleDef[] = [
  { id: 'rings', name: 'Rings', hint: 'the poster', draw: drawRings },
  { id: 'louie', name: 'Louie 3D', hint: 'the model shelf', draw: drawLouie },
  { id: 'crew', name: 'The Crew', hint: 'command.ctr', draw: drawCrew },
  { id: 'moat', name: 'The Moat', hint: 'invest, fig. b', draw: drawMoat },
  { id: 'pixellou', name: 'Pixel Lou', hint: 'lou.sys', draw: drawPixelLou },
]
