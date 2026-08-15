import { runs } from './pixelIcons'

/* Media sprites — the folder tier's second vocabulary. Desktop icons are
   objects on the desk; the things inside a folder are the media you load:
   MUSIC is a tape rack (each program a cassette, face out), FUN is a
   cartridge shelf (each program a cart, label up). The 32px pixel icon
   does not go away — it becomes the label art, overlaid by Folder.tsx in
   the label window whose origin each sprite declares, so the hover cycle
   keeps playing on the label. Same 1-bit ASCII authoring as pixelIcons.ts
   ('#' ink · 'o' interior · '.' outside), generated rather than
   hand-counted, compiled once into rect-run <path> data at module load.
   currentColor, no matte, like every other icon on the shell.

   A media kind is a shape, not a program: a folder picks its case in the
   registry (`case: 'rack' | 'shelf'`), and every entry inside inherits the
   matching media. Adding a program to a folder stays one registry line. */

export type MediaKind = 'tape' | 'cart'
export type MediaSprite = {
  w: number
  h: number
  /** where the 32×32 icon sits on the label */
  label: { x: number; y: number }
  ink: string
}

const GRIDS: Record<MediaKind, string[]> = {
  // cassette, 64×54 — chamfered shell, four screws, label paper across the
  // top, the reel window with two hubs and the tape run between them, and
  // the head trapezoid on the bottom band, which is what the rack's front
  // lip hides at rest — pull the tape and you see its bottom edge
  tape: [
    '..############################################################..',
    '.#oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo#.',
    '#oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo#',
    '#oo#oo####################################################oo#oo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo#oooooooooooooooooooooooooooooooooooooooooooooooooo#ooooo#',
    '#ooooo####################################################ooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo#',
    '#ooooooooooooo####################################ooooooooooooo#',
    '#ooooooooooooo#oooo###oooooooooooooooooooo###oooo#ooooooooooooo#',
    '#ooooooooooooo#ooo#ooo#oooooooooooooooooo#ooo#ooo#ooooooooooooo#',
    '#ooooooooooooo#oo#ooooo#oooooooooooooooo#ooooo#oo#ooooooooooooo#',
    '#ooooooooooooo#oo#oo#oo##################oo#oo#oo#ooooooooooooo#',
    '#ooooooooooooo#oo#ooooo#oooooooooooooooo#ooooo#oo#ooooooooooooo#',
    '#ooooooooooooo#ooo#ooo#oooooooooooooooooo#ooo#ooo#ooooooooooooo#',
    '#ooooooooooooo#oooo###oooooooooooooooooooo###oooo#ooooooooooooo#',
    '#ooooooooooooo####################################ooooooooooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo#',
    '#ooooooooooooooooooooooooo############ooooooooooooooooooooooooo#',
    '#oo#ooooooooooooooooooooo#oooooooooooo#ooooooooooooooooooooo#oo#',
    '#ooooooooooooooooooooooo#oooooooooooooo#ooooooooooooooooooooooo#',
    '.#ooooooooooooooooooooo#oooooooooooooooo#ooooooooooooooooooooo#.',
    '..############################################################..',
  ],
  // cartridge, 48×56 — Game Boy cut at the top-right corner, label paper,
  // three grip ridges, and the connector edge that only shows on eject
  cart: [
    '###########################################.....',
    '#oooooooooooooooooooooooooooooooooooooooooo#....',
    '#ooooooooooooooooooooooooooooooooooooooooooo#...',
    '#oooooooooooooooooooooooooooooooooooooooooooo#..',
    '#ooooooooooooooooooooooooooooooooooooooooooooo#.',
    '#oooooo##################################oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo#oooooooooooooooooooooooooooooooo#oooooo#',
    '#oooooo##################################oooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooo#',
    '#ooooo####################################ooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooo#',
    '#ooooo####################################ooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooo#',
    '#ooooo####################################ooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooo#',
    '#ooooooooooo########################ooooooooooo#',
    '#ooooooooooo########################ooooooooooo#',
    '#oooooooooooooooooooooooooooooooooooooooooooooo#',
    '################################################',
  ],
}

const LABEL: Record<MediaKind, { x: number; y: number }> = {
  tape: { x: 16, y: 4 },
  cart: { x: 8, y: 6 },
}

export const MEDIA: Record<MediaKind, MediaSprite> = Object.fromEntries(
  (Object.keys(GRIDS) as MediaKind[]).map((k) => {
    const rows = GRIDS[k]
    return [k, { w: rows[0].length, h: rows.length, label: LABEL[k], ink: runs(rows, (c) => c === '#') }]
  }),
) as Record<MediaKind, MediaSprite>
