/* Jake's actual tattoos as traceable pixel flash — hand-authored from the
   photos in ref/tattoo-photos (2026-07-11 fidelity pass: every piece
   redrawn against its photo, not from memory). Strokes are polylines in
   0–100 space; the game samples them into stencil dots. */

export type Tattoo = {
  id: string
  name: string
  credit: string
  difficulty: 1 | 2 | 3
  strokes: number[][][]
}

export const TATTOOS: Tattoo[] = [
  {
    // minimal four-poster canopy cube; dark band across the back wall,
    // mattress slab low in the frame, stubby feet
    id: 'bed',
    name: 'The Bed',
    credit: 'JAKE ORIGINAL',
    difficulty: 1,
    strokes: [
      // canopy top frame
      [[18, 26], [50, 14], [84, 24], [52, 38], [18, 26]],
      // posts
      [[18, 26], [18, 64]],
      [[84, 24], [84, 66]],
      [[52, 38], [52, 80]],
      [[50, 14], [50, 34]],
      // back-wall dark band (three hatch strokes)
      [[18, 46], [50, 36]],
      [[18, 52], [50, 42]],
      [[18, 58], [50, 48]],
      // mattress slab
      [[26, 58], [52, 48], [78, 58], [52, 70], [26, 58]],
      [[26, 58], [26, 64], [52, 76], [52, 70]],
      [[78, 58], [78, 64], [52, 76]],
      // feet
      [[18, 64], [18, 71]],
      [[84, 66], [84, 73]],
      [[52, 80], [52, 87]],
    ],
  },
  {
    // faceted low-poly wolf head: triangle ears, brow band, dotted
    // center seams, diamond snout, hatched cheek, crescent on the left edge
    id: 'wolf',
    name: 'The Wolf',
    credit: 'JAKE ORIGINAL',
    difficulty: 2,
    strokes: [
      // silhouette (ears → temples → cheeks → chin)
      [[20, 12], [14, 34], [18, 58], [38, 78], [50, 86], [62, 78], [82, 58], [86, 34], [80, 12], [64, 26], [50, 22], [36, 26], [20, 12]],
      // brow band
      [[14, 34], [50, 30], [86, 34]],
      // center seams (the dotted lines down the nose bridge)
      [[46, 30], [44, 56]],
      [[54, 30], [56, 56]],
      // snout diamond
      [[44, 56], [50, 52], [56, 56], [50, 70], [44, 56]],
      // cheek facets
      [[18, 58], [38, 56]],
      [[62, 56], [82, 58]],
      [[56, 56], [62, 78]],
      [[44, 56], [38, 78]],
      // lower-left cheek hatching
      [[22, 60], [34, 66]],
      [[24, 66], [34, 71]],
      [[26, 72], [36, 76]],
      // crescent detail, far left panel
      [[16, 42], [13, 47], [16, 52]],
    ],
  },
  {
    // traditional heart, banner sweeping across with TAYLOR, forked tail
    id: 'heart',
    name: 'Taylor',
    credit: 'SLAVE TO THE NEEDLE',
    difficulty: 2,
    strokes: [
      // heart outline
      [[50, 30], [42, 20], [30, 16], [20, 22], [14, 34], [16, 48], [26, 62], [38, 74], [50, 84], [62, 74], [74, 62], [84, 48], [86, 34], [80, 22], [70, 16], [58, 20], [50, 30]],
      // banner top + bottom edges
      [[10, 48], [24, 44], [40, 48], [60, 56], [78, 60], [90, 58]],
      [[10, 60], [24, 56], [40, 60], [60, 68], [78, 72], [90, 70]],
      // banner ends: curl left, fork right
      [[10, 48], [6, 54], [10, 60]],
      [[90, 58], [96, 61], [93, 64], [96, 67], [90, 70]],
      // T A Y L O R (simplified skeleton letters riding the banner)
      [[13, 48], [19, 48]],
      [[16, 48], [16, 56]],
      [[25, 56], [28, 48], [31, 56]],
      [[26, 53], [30, 53]],
      [[37, 50], [40, 54]],
      [[43, 50], [40, 54]],
      [[40, 54], [40, 58]],
      [[49, 54], [49, 62], [54, 62]],
      [[63, 56], [66, 57], [67, 60], [66, 63], [63, 64], [60, 63], [59, 60], [60, 57], [63, 56]],
      [[71, 58], [71, 66]],
      [[71, 58], [75, 59], [75, 61], [71, 62]],
      [[72, 62], [76, 66]],
    ],
  },
  {
    // two tumbling dice — one pip up top, three pips below, bounce marks
    id: 'dice',
    name: 'The Dice',
    credit: 'PHIL ROLLI',
    difficulty: 1,
    strokes: [
      // die A (top right, showing 1)
      [[48, 18], [78, 26], [72, 54], [42, 46], [48, 18]],
      [[60, 32], [63, 33.5], [64, 36], [63, 38.5], [60, 40], [57, 38.5], [56, 36], [57, 33.5], [60, 32]],
      // die B (lower left, showing 3)
      [[18, 48], [48, 42], [54, 68], [24, 76], [18, 48]],
      [[29, 54], [31, 56], [29, 58], [27, 56], [29, 54]],
      [[36, 57], [38, 59], [36, 61], [34, 59], [36, 57]],
      [[43, 60], [45, 62], [43, 64], [41, 62], [43, 60]],
      // impact marks (upper left of A, lower right of B)
      [[38, 12], [45, 16]],
      [[34, 19], [42, 22]],
      [[36, 27], [43, 28]],
      [[58, 73], [66, 77]],
      [[56, 80], [63, 84]],
    ],
  },
  {
    // SpongeBob's body — eyes and grin ON the body — holding a round
    // ball-head aloft; kicking shoe, open hand low left
    id: 'spongebob',
    name: 'Headless Bob',
    credit: 'PHIL ROLLI',
    difficulty: 3,
    strokes: [
      // body (tilted rounded bean)
      [[28, 38], [24, 48], [24, 62], [30, 74], [42, 80], [54, 78], [60, 70], [62, 58], [58, 44], [50, 36], [38, 34], [28, 38]],
      // stacked eyes + pupils
      [[36, 38], [40, 40], [41, 44], [40, 48], [36, 50], [32, 48], [31, 44], [32, 40], [36, 38]],
      [[36, 43], [37, 44], [36, 45], [35, 44], [36, 43]],
      [[34, 50], [38, 52], [39, 56], [38, 60], [34, 62], [30, 60], [29, 56], [30, 52], [34, 50]],
      [[34, 55], [35, 56], [34, 57], [33, 56], [34, 55]],
      // lashes
      [[32, 38], [30, 34]],
      [[37, 37], [36, 33]],
      [[31, 50], [28, 47]],
      // big open grin + tooth
      [[42, 60], [56, 56], [58, 64], [50, 70], [42, 66], [42, 60]],
      [[46, 59], [47, 64]],
      // arm up to the mitt
      [[56, 40], [64, 30], [66, 26]],
      [[64, 24], [68, 22], [71, 26], [67, 29], [64, 24]],
      // the ball-head held aloft
      [[76, 8], [82, 10], [86, 15], [86, 21], [82, 26], [76, 28], [70, 26], [66, 21], [66, 15], [70, 10], [76, 8]],
      [[73, 14], [74, 15], [73, 16], [72, 15], [73, 14]],
      [[79, 13], [81, 16], [79, 19]],
      [[72, 21], [76, 23], [80, 21]],
      // kicking leg + shoe
      [[58, 70], [66, 74], [69, 72]],
      [[69, 72], [76, 74], [74, 79], [67, 77], [69, 72]],
      // low arm + open fingers
      [[30, 74], [22, 82], [17, 86]],
      [[17, 86], [11, 84]],
      [[17, 86], [11, 88]],
      [[17, 86], [13, 91]],
      // little leg + foot
      [[46, 80], [46, 88]],
      [[46, 88], [52, 90]],
    ],
  },
  {
    // vintage mouse with a jack-o-lantern head: big shaded ears, triangle
    // eyes + nose, jagged grin, stick arms up, acorn body, curly tail
    id: 'mickey',
    name: 'Spooky Mouse',
    credit: 'HALLOWEEN FLASH',
    difficulty: 3,
    strokes: [
      // ears
      [[32, 6], [38, 8], [41, 13], [40, 19], [35, 23], [29, 22], [25, 17], [26, 10], [32, 6]],
      [[64, 5], [70, 7], [73, 12], [72, 18], [67, 21], [61, 20], [58, 14], [59, 8], [64, 5]],
      // pumpkin head
      [[48, 21], [58, 23], [64, 29], [64, 38], [58, 45], [48, 47], [38, 45], [32, 38], [32, 29], [38, 23], [48, 21]],
      // pumpkin ridges
      [[44, 22], [45, 27]],
      [[52, 22], [51, 27]],
      // triangle eyes + nose
      [[40, 30], [44, 30], [42, 34], [40, 30]],
      [[54, 29], [58, 29], [56, 33], [54, 29]],
      [[47, 36], [51, 36], [49, 39], [47, 36]],
      // jagged grin
      [[38, 40], [42, 44], [46, 41], [50, 45], [54, 41], [58, 44], [62, 39]],
      // stick arms, raised
      [[36, 44], [28, 42], [26, 36]],
      [[62, 42], [70, 40], [72, 34]],
      // acorn body + shorts line + buttons
      [[42, 48], [38, 58], [40, 66], [48, 70], [56, 66], [58, 56], [54, 48]],
      [[40, 62], [56, 62]],
      [[45, 65], [46, 66], [45, 67], [44, 66], [45, 65]],
      [[51, 65], [52, 66], [51, 67], [50, 66], [51, 65]],
      // curly tail
      [[40, 64], [30, 62], [24, 56], [20, 50], [22, 44], [26, 46], [24, 50]],
      // stick legs + ball feet
      [[44, 70], [42, 80], [38, 88]],
      [[38, 88], [34, 90]],
      [[52, 70], [56, 80], [54, 88]],
      [[54, 88], [58, 90]],
    ],
  },
]
