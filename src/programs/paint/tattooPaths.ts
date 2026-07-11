/* Jake's tattoos as pixel-art stroke paths, hand-authored from the
   photos in ref/tattoo-photos (stylized silly, deliberately traceable).
   Coordinates in a 0–100 space; each tattoo = named strokes the player
   retraces with the tattoo gun. Artists credited on each flash card. */

export type Tattoo = {
  id: string
  name: string
  credit: string
  difficulty: 1 | 2 | 3
  strokes: number[][][] // strokes → points → [x, y]
}

export const TATTOOS: Tattoo[] = [
  {
    id: 'bed',
    name: 'The Bed',
    credit: 'JAKE ORIGINAL',
    difficulty: 1,
    strokes: [
      // canopy frame (isometric top)
      [[20, 26], [54, 14], [86, 26], [52, 38], [20, 26]],
      // posts
      [[20, 26], [20, 62]],
      [[54, 14], [54, 44]],
      [[86, 26], [86, 62]],
      [[52, 38], [52, 72]],
      // mattress slab
      [[20, 62], [52, 72], [86, 62], [54, 52], [20, 62]],
      // blanket band
      [[20, 46], [52, 56]],
    ],
  },
  {
    id: 'wolf',
    name: 'The Wolf',
    credit: 'JAKE ORIGINAL',
    difficulty: 2,
    strokes: [
      // faceted outline: ear, brow, ear, jaw to chin point
      [[22, 26], [34, 14], [47, 28], [62, 14], [76, 26], [79, 54], [52, 86], [21, 54], [22, 26]],
      // inner facets
      [[34, 14], [40, 46]],
      [[62, 14], [57, 46]],
      [[40, 46], [57, 46]],
      [[40, 46], [52, 86]],
      [[57, 46], [52, 86]],
      // snout
      [[45, 62], [52, 72], [58, 62]],
    ],
  },
  {
    id: 'heart',
    name: 'Taylor',
    credit: 'SLAVE TO THE NEEDLE',
    difficulty: 2,
    strokes: [
      // the heart
      [[50, 36], [43, 25], [31, 22], [22, 30], [20, 43], [28, 57], [50, 80], [72, 57], [80, 43], [78, 30], [67, 22], [57, 25], [50, 36]],
      // banner band
      [[14, 46], [50, 40], [86, 46], [84, 57], [50, 51], [16, 57], [14, 46]],
      // banner tails
      [[14, 46], [6, 54], [15, 58]],
      [[86, 46], [94, 54], [85, 58]],
    ],
  },
  {
    id: 'dice',
    name: 'The Dice',
    credit: 'PHIL ROLLI',
    difficulty: 1,
    strokes: [
      // upper die
      [[38, 16], [64, 22], [58, 48], [32, 42], [38, 16]],
      // lower die
      [[28, 52], [54, 58], [48, 84], [22, 78], [28, 52]],
      // pips: one · three
      [[47, 31], [49, 33]],
      [[31, 62], [33, 64]],
      [[37, 67], [39, 69]],
      [[43, 72], [45, 74]],
      // tumble ticks
      [[28, 10], [21, 5]],
      [[66, 54], [73, 59]],
    ],
  },
  {
    id: 'spongebob',
    name: 'Headless Bob',
    credit: 'PHIL ROLLI',
    difficulty: 3,
    strokes: [
      // sponge body (head removed, naturally)
      [[28, 36], [58, 30], [66, 60], [34, 68], [28, 36]],
      // big eyes
      [[36, 44], [41, 40], [46, 44], [41, 48], [36, 44]],
      [[47, 42], [52, 38], [57, 42], [52, 46], [47, 42]],
      // the grin
      [[36, 56], [44, 59], [52, 54]],
      // the held head (aloft, smiling, unbothered)
      [[62, 26], [68, 16], [78, 18], [80, 28], [72, 34], [63, 31], [62, 26]],
      [[67, 25], [73, 27]],
      // arms: one hoisting, one waving
      [[58, 34], [64, 29]],
      [[30, 50], [18, 58], [14, 54]],
      // little legs
      [[42, 68], [40, 82], [34, 84]],
      [[54, 65], [58, 78], [64, 80]],
    ],
  },
  {
    id: 'mickey',
    name: 'Spooky Mouse',
    credit: 'HALLOWEEN FLASH',
    difficulty: 3,
    strokes: [
      // ears
      [[30, 20], [34, 12], [42, 14], [43, 22], [36, 25], [30, 20]],
      [[53, 22], [55, 13], [63, 12], [67, 19], [61, 25], [53, 22]],
      // jack-o-lantern head
      [[36, 25], [48, 20], [61, 25], [63, 36], [48, 42], [34, 36], [36, 25]],
      // triangle eyes + jagged grin
      [[42, 28], [45, 33], [39, 33], [42, 28]],
      [[54, 28], [57, 33], [51, 33], [54, 28]],
      [[39, 37], [44, 35], [48, 38], [52, 35], [57, 37]],
      // shorts + fringe
      [[42, 46], [55, 46], [59, 60], [38, 60], [42, 46]],
      // arms raised
      [[43, 46], [34, 36]],
      [[55, 46], [64, 36]],
      // stick legs, big feet
      [[44, 60], [42, 74], [36, 76]],
      [[53, 60], [57, 72], [63, 74]],
      // the tail curl
      [[59, 54], [70, 50], [75, 42], [70, 37], [66, 41]],
    ],
  },
]
