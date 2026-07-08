/* Coloring pages — Jake's tattoos, redrawn as flash-style line art from
   the photos in ref/tattoo-photos (stylized, not photo-traces). Closed
   regions, ~5px strokes, so the flood fill has cells to pour into.
   Each page credits the original tattoo artist. */

export type ColoringPage = {
  id: string
  title: string
  credit: string
  svg: string
}

const W = 460
const H = 480

const wrap = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  <g fill="white" stroke="black" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
  <rect x="12" y="12" width="${W - 24}" height="${H - 24}"/>
  ${body}
  </g></svg>`

export const PAGES: ColoringPage[] = [
  {
    id: 'heart',
    title: 'Taylor',
    credit: 'HEART — SLAVE TO THE NEEDLE',
    svg: wrap(`
      <!-- sprig above -->
      <path d="M230 82 C 214 62 186 58 170 66 C 186 80 208 84 230 82 Z"/>
      <path d="M230 82 C 246 62 274 58 290 66 C 274 80 252 84 230 82 Z"/>
      <circle cx="230" cy="94" r="7"/>
      <!-- heart -->
      <path d="M230 172 C 230 128 168 108 136 140 C 104 172 116 226 158 268 L 230 344 L 302 268 C 344 226 356 172 324 140 C 292 108 230 128 230 172 Z"/>
      <!-- banner -->
      <path d="M96 226 C 160 210 300 210 364 226 L 358 270 C 296 254 164 254 102 270 Z"/>
      <path d="M96 226 L 62 258 L 96 262 L 102 270 Z"/>
      <path d="M364 226 L 398 258 L 364 262 L 358 270 Z"/>
      <text x="230" y="252" text-anchor="middle" font-family="Georgia, serif" font-size="36" letter-spacing="6" fill="black" stroke="none">TAYLOR</text>
    `),
  },
  {
    id: 'snake',
    title: 'Snake',
    credit: 'SNAKE — PHIL ROLLI',
    svg: wrap(`
      <!-- outer coil -->
      <ellipse cx="235" cy="235" rx="130" ry="100"/>
      <ellipse cx="235" cy="235" rx="86" ry="60"/>
      <!-- lower loop -->
      <path d="M150 300 C 120 360 200 400 265 386 C 330 372 350 320 320 292 C 300 322 260 348 216 344 C 184 340 158 324 150 300 Z"/>
      <!-- neck + head striking down-left -->
      <path d="M132 200 C 96 216 82 258 96 300 C 106 330 128 352 156 362 C 140 332 134 300 142 272 C 148 248 152 224 132 200 Z"/>
      <path d="M96 300 C 74 314 62 338 68 362 C 92 372 122 370 140 356 C 122 350 104 330 96 300 Z"/>
      <!-- head -->
      <path d="M68 362 C 46 372 36 396 46 416 C 66 428 94 424 108 408 C 100 386 88 370 68 362 Z"/>
      <circle cx="72" cy="392" r="6"/>
      <path d="M50 418 L 32 440 M 32 440 L 24 432 M 32 440 L 42 446" fill="none"/>
      <!-- tail crossing out of the coil -->
      <path d="M340 180 C 372 150 386 118 380 92 C 360 100 340 122 330 150 C 326 162 330 172 340 180 Z"/>
      <!-- belly ticks -->
      <path d="M180 152 L 172 170 M 220 140 L 216 158 M 264 140 L 264 158 M 306 152 L 312 170" fill="none"/>
    `),
  },
  {
    id: 'dice',
    title: 'Dice',
    credit: 'DICE — PHIL ROLLI',
    svg: wrap(`
      <!-- upper die (one pip) -->
      <rect x="212" y="112" width="140" height="140" rx="18" transform="rotate(12 282 182)"/>
      <circle cx="282" cy="182" r="17"/>
      <!-- lower die (three pips) -->
      <rect x="112" y="240" width="140" height="140" rx="18" transform="rotate(-12 182 310)"/>
      <circle cx="146" cy="336" r="12"/>
      <circle cx="182" cy="310" r="12"/>
      <circle cx="218" cy="284" r="12"/>
      <!-- motion strokes -->
      <path d="M196 96 L 172 76 M 182 122 L 152 108 M 330 292 L 358 308 M 316 316 L 344 336" fill="none"/>
    `),
  },
  {
    id: 'dove',
    title: 'Dove',
    credit: 'DOVE — JOEL GRAY',
    svg: wrap(`
      <!-- body diving down-left -->
      <path d="M120 330 C 92 352 78 376 80 398 C 116 396 152 380 178 354 C 216 316 240 270 246 224 C 200 244 148 288 120 330 Z"/>
      <!-- head + beak -->
      <path d="M120 330 C 100 320 84 322 74 334 C 84 350 100 356 116 352 Z"/>
      <path d="M74 334 L 46 330 L 68 346 Z"/>
      <circle cx="98" cy="334" r="5"/>
      <!-- near wing -->
      <path d="M246 224 C 250 168 268 116 296 84 C 306 128 300 180 278 224 C 268 242 256 240 246 224 Z"/>
      <path d="M278 224 C 296 180 322 148 354 132 C 352 176 332 220 300 252 C 288 262 278 244 278 224 Z" />
      <path d="M300 252 C 326 224 356 208 386 206 C 374 246 346 280 310 298 C 296 304 294 272 300 252 Z"/>
      <!-- far wing -->
      <path d="M180 250 C 168 210 170 168 186 136 C 204 166 210 210 200 250 C 196 266 186 264 180 250 Z"/>
      <!-- tail feathers -->
      <path d="M178 354 C 200 356 222 366 236 384 C 214 392 190 388 172 374 Z"/>
      <path d="M172 374 C 188 384 198 400 200 418 C 180 412 164 398 158 380 Z"/>
      <!-- wing feather ticks -->
      <path d="M262 190 C 268 172 276 156 286 142 M 296 218 C 308 198 322 182 338 170" fill="none"/>
    `),
  },
]
