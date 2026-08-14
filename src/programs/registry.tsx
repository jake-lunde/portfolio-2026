import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { IconName } from '@/components/shell/Icon'

const FolderWindow = dynamic(() => import('@/programs/folder/Folder'))

export type ProgramDef = {
  id: string
  name: string // desktop label + window title
  /** overrides the desktop icon label only (window title stays `name`) */
  desktopLabel?: string
  meta: string // mono doc-id in the titlebar, e.g. "SPEC-01"
  /** copy key for a "what is this" explainer. Set it and the titlebar's
      meta slot becomes a button that reveals the text instead of printing
      the doc-id — a program explains itself in chrome, not in its body. */
  explainer?: string
  icon: IconName
  component: ComponentType
  /** default window geometry (desktop; mobile goes full-bleed) */
  size: { w: number; h: number }
  pos: { x: number; y: number } // offsets from desktop top-left, deterministic for SSR
  /** `bare` = no titlebar, no resize grip: the program IS the chrome (see the iPod) */
  chrome?: 'paper' | 'crt' | 'bare'
  /** Opt out of the unfocused-window recede.

      The recede is `filter: opacity()` on the window's children, and
      `filter` is a GROUPING property: it forces `transform-style` to
      `flat` on everything beneath it. A program that builds real 3D — the
      shelf's cuboid boxes (src/programs/shelf/Box3D.tsx) — would go flat
      the instant the window lost focus, and pop back on hover. There is no
      way to have both, so the program declares which it needs.

      `bare` chrome opts out for a different reason (an appliance on the
      desk shouldn't dim); this is the same escape hatch, different cause.
      Set it only when a program owns a 3D context. */
  noRecede?: true
  /** show an icon on the desktop */
  onDesktop?: boolean
  /** a drawer: window ids (program id or `viz:<id>`) this folder holds.
      Read by src/programs/folder/Folder.tsx via the window's own id. */
  folder?: string[]
  /** route path that deep-links to this window */
  path?: string
}

/* ------------------------------------------------------------------
   Register programs here. One entry = icon + window + deep link.
   Case studies register themselves via src/programs/projects/cases.ts

   The desktop is CONSOLIDATED (session 25): only top-level things get an
   icon. Everything else lives one storey down in a folder (MUSIC · FUN ·
   FEEDBACK — see the `folder` field), behind the case-studies gate, or in a
   floating widget (COMMAND.CTR, the iPod). `onDesktop: false` here does
   not mean unreachable — the deep link and the folder still open it.
   ------------------------------------------------------------------ */

export const PROGRAMS: ProgramDef[] = [
  {
    id: 'readme',
    name: 'README',
    meta: 'DOC-00',
    icon: 'doc',
    component: dynamic(() => import('@/programs/about/About')),
    size: { w: 520, h: 700 },
    pos: { x: 120, y: 60 },
    onDesktop: true,
    path: '/readme',
  },
  {
    // Second on the desktop by design: a hiring manager reads README, then
    // wants something to forward. Open it and the page prints itself
    // (nobody 2026 wants to PRINT a resume; they want to watch it arrive,
    // then download it). The physical printer OBJECT waits for the desk
    // scene; see the Notion project "The Desk". id stays 'cv' — it names
    // the code, the copy keys and the window store, not the user-facing
    // program.
    id: 'cv',
    name: 'RESUME.EXE',
    meta: 'DOC-01',
    explainer: 'cv.explainer',
    icon: 'resume',
    component: dynamic(() => import('@/programs/cv/CV')),
    size: { w: 520, h: 640 },
    pos: { x: 172, y: 96 },
    chrome: 'paper',
    onDesktop: true,
    path: '/resume',
  },
  {
    // the flat index, kept for the /projects deep link. The desktop route
    // in is CASE STUDIES (`progress`), which keeps the gate a layer down.
    id: 'projects',
    name: 'Projects',
    meta: 'IDX-01',
    icon: 'folder',
    component: dynamic(() => import('@/programs/projects/Projects')),
    size: { w: 640, h: 480 },
    pos: { x: 200, y: 110 },
    onDesktop: false,
    path: '/projects',
  },
  {
    // SHIPPED.SW — the shelf of boxed case studies. The id stays `progress`
    // (it names the copy keys, the window store and the deep link, not the
    // program) and so does the name: `program.progress.name` drives BOTH
    // the dock tile and the titlebar, so the split lives inside — the
    // window is "Work" (Jake's refresh pass; "Case Studies" retired with
    // the desktop grid), the masthead in it is SHIPPED.SW.
    id: 'progress',
    name: 'Work',
    meta: 'IDX-16',
    icon: 'work',
    component: dynamic(() => import('@/programs/shelf/Shelf')),
    // the boxes are real cuboids (preserve-3d) — the unfocused-window
    // recede is a `filter`, and filter flattens 3D. See `noRecede` above.
    noRecede: true,
    // measured, one row deep: 760 leaves 676px of shelf after the 40px
    // gutters — two 246px boxes, a 32px gap and 160px of the third, cut by
    // the right edge on purpose. 459 = 426 row + 33 of window chrome
    // (32 titlebar + the border), measured on the live window rather than
    // added up. The row is 34 above + 328 box + 22 gap + 22 flip tag + 20
    // below = 426 (the last 64 of which is the painted shelf plank the
    // boxes stand on). Pass 4 moved the tag BELOW the box and DELETED the
    // 54px SHIPPED.SW masthead (−56 against pass 3's 552); pass 7 struck
    // the 40px foot under the row, so the window is exactly the shelf and
    // nothing else — no band above the boxes, no strip below them.
    //
    // PASS 9 GREW IT BY THE CLEARANCE, NOT BY TASTE. A hovered box pops
    // 38px toward a 980px camera, lifts 6 and tilts ±10, and the row clips
    // at its own padding edge — so the shipped 18/20 gutters were cutting
    // the top corner by 5.31px and box one's left edge by 15.61px
    // (projected over every vertex, tilt pair and scroll stop; the working
    // is in shelf.module.css on `.row`). 34/40 clears both with 11.33 and
    // 4.39 to spare, and the window follows: +16 tall, +40 wide. The extra
    // width is spent entirely on the two gutters, which is why the shelf
    // still shows two whole boxes and a cut third — 160px of it, against
    // the 156 the 720px window showed.
    size: { w: 760, h: 459 },
    pos: { x: 250, y: 48 },
    onDesktop: true,
    path: '/cases',
  },
  {
    /* THE PLAYER — Family Hub's film loop standing open on the desk at
       boot (resolve.ts BOOT_WINDOWS), poolsuite-style: screen, file
       strip, overview, PLAY. A teaser for `case:family-hub`, so no icon
       and no deep link — the desk sets it out, PLAY opens the real thing.
       Squarish and a notch under README's 520 by design (Jake: "closer
       to a square... a little smaller than the ReadMe"). */
    id: 'hub-player',
    name: 'Family Hub',
    meta: 'REEL-02',
    icon: 'folder',
    component: dynamic(() => import('@/programs/projects/HubPlayer')),
    /* 520 + y56 + ~33 chrome bottoms out at ~609 — clear of the dock rail
       (~87px on the floor) on a 720 viewport, the shortest desk we set */
    size: { w: 460, h: 520 },
    pos: { x: 600, y: 56 },
    onDesktop: false,
  },
  {
    id: 'now-playing',
    name: 'Now Playing',
    meta: 'AUX-02',
    icon: 'note',
    component: dynamic(() => import('@/programs/stubs/NowPlaying')),
    size: { w: 420, h: 320 },
    pos: { x: 300, y: 160 },
    chrome: 'crt',
    // off the desktop — the Now Playing state lives in the top-right widget
    onDesktop: false,
  },
  {
    // the iPod. `bare` chrome: no titlebar — the device is the window, it
    // floats free and closes from the [x] in its own status bar.
    id: 'studio',
    name: 'Remixes',
    meta: 'AUX-03',
    icon: 'ipod',
    component: dynamic(() => import('@/programs/studio/Studio')),
    // measured: the device is ~484px tall incl. padding. Bare chrome has no
    // visible frame, so any surplus here is invisible window that silently
    // eats clicks meant for the desktop — keep it hugging.
    size: { w: 320, h: 484 },
    pos: { x: 640, y: 60 },
    chrome: 'bare',
    onDesktop: false,
    path: '/studio',
  },
  {
    id: 'visualizers',
    name: 'Visualizers',
    meta: 'IDX-04',
    icon: 'wave',
    component: dynamic(() => import('@/programs/visualizers/Visualizers')),
    size: { w: 520, h: 420 },
    pos: { x: 240, y: 80 },
    onDesktop: false,
    path: '/visualizers',
  },
  {
    id: 'guestbook',
    name: 'Guestbook',
    meta: 'LOG-05',
    icon: 'book',
    component: dynamic(() => import('@/programs/guestbook/Guestbook')),
    size: { w: 460, h: 560 },
    pos: { x: 380, y: 80 },
    onDesktop: true,
    path: '/guestbook',
  },
  {
    id: 'suggest',
    name: 'Suggestion Box',
    meta: 'BOX-86',
    icon: 'suggest',
    component: dynamic(() => import('@/programs/suggest/SuggestBox')),
    // 560 tall, up from 468: the box is a chat feed now (session 44), and
    // a full round is DOPPLER's greeting, a jab or two, the idea, and the
    // three bubbles of the judgment. 560 shows a whole verdict — greeting
    // through receipt — without a scroll; the width stays 430 because the
    // composer is one field and the roast lines are capped at 44 chars.
    size: { w: 430, h: 560 },
    pos: { x: 402, y: 92 },
    onDesktop: true,
    path: '/suggest',
  },
  {
    id: 'booth',
    name: 'Photo Booth',
    meta: 'CAM-07',
    icon: 'camera',
    component: dynamic(() => import('@/programs/booth/PhotoBooth')),
    size: { w: 540, h: 640 },
    pos: { x: 300, y: 50 },
    chrome: 'crt',
    onDesktop: false,
    path: '/booth',
  },
  {
    id: 'puzzle',
    name: 'Puzzles',
    meta: 'TOY-08',
    icon: 'puzzle',
    component: dynamic(() => import('@/programs/puzzle/Puzzle')),
    size: { w: 660, h: 728 },
    pos: { x: 260, y: 40 },
    onDesktop: false,
    path: '/puzzle',
  },
  {
    id: 'paint',
    name: 'Tattoo Me',
    meta: 'TOY-09',
    icon: 'brush',
    component: dynamic(() => import('@/programs/paint/Paint')),
    size: { w: 520, h: 640 },
    pos: { x: 340, y: 30 },
    onDesktop: false,
    path: '/paint',
  },
  {
    id: 'sequencer',
    name: 'Beat Machine',
    meta: 'SND-12',
    icon: 'steps',
    component: dynamic(() => import('@/programs/sequencer/Sequencer')),
    size: { w: 640, h: 470 },
    pos: { x: 310, y: 120 },
    chrome: 'crt',
    onDesktop: false,
    path: '/seq',
  },
  {
    id: 'music',
    name: 'Music',
    meta: 'SND-17',
    icon: 'music',
    component: FolderWindow,
    folder: ['studio', 'viz:scrobbles', 'sequencer'],
    // drawers hug: 88px icon tracks + 8px gaps + 22px inset either side, so
    // the contents sit on ONE row and never wrap to a lopsided orphan
    size: { w: 356, h: 214 },
    pos: { x: 250, y: 96 },
    onDesktop: true,
    path: '/music',
  },
  {
    id: 'fun',
    name: 'Fun',
    meta: 'TOY-18',
    icon: 'smiley',
    component: FolderWindow,
    folder: ['booth', 'puzzle', 'paint', 'visualizers'],
    size: { w: 444, h: 214 },
    pos: { x: 290, y: 128 },
    onDesktop: true,
    path: '/fun',
  },
  {
    // off the desktop for now (Jake, s44) — deep link stays live, flip
    // onDesktop back to restore the icon (its ORDER slot is kept)
    id: 'feedback',
    name: 'Feedback',
    meta: 'LOG-19',
    icon: 'bubble',
    component: dynamic(() => import('@/programs/feedback/Feedback')),
    size: { w: 560, h: 520 },
    pos: { x: 210, y: 62 },
    onDesktop: false,
    path: '/feedback',
  },
  {
    // COMMAND.CTR lives in the floating deck chip (CommandWidget); the
    // full program opens from it, not from a desktop icon.
    id: 'command',
    name: 'Command Center',
    meta: 'CTR-11',
    explainer: 'command.explainer',
    icon: 'nodes',
    component: dynamic(() => import('@/programs/command/CommandCenter')),
    // sized to the deck with its transmission log CLOSED — that is the
    // default state, and a window should fit what it opens showing.
    // Wide enough to clear the deck's 700px container query, so the log
    // opens as the right-hand rail rather than a bottom drawer.
    size: { w: 880, h: 600 },
    pos: { x: 250, y: 26 },
    chrome: 'crt',
    onDesktop: false,
    path: '/command',
  },
  {
    // sealed AND off the desktop — kept registered so the work isn't lost.
    // Swap back to 'Field Notes' + FieldNotes.tsx when Jake clears it.
    id: 'field-notes',
    name: '???',
    meta: 'RES-13',
    icon: 'mystery',
    component: dynamic(() => import('@/programs/fieldnotes/Sealed')),
    size: { w: 430, h: 380 },
    pos: { x: 220, y: 44 },
    onDesktop: false,
    path: '/field-notes',
  },
  {
    id: 'spec-sheet',
    name: 'Design System',
    meta: 'SYS-14',
    icon: 'swatch',
    component: dynamic(() => import('@/programs/specsheet/SpecSheet')),
    size: { w: 600, h: 700 },
    pos: { x: 290, y: 56 },
    onDesktop: true,
    path: '/spec',
  },
  /* INSPECT.MODE (SYS-21) is deliberately NOT here. It stopped being a
     program: it is a tool mode summoned from the menubar that docks two
     panels and turns the whole desktop into its canvas — a window would
     have to cover the thing it inspects. See src/components/inspect/ and
     src/store/inspect.ts. The /inspect path still resolves (resolve.ts). */
  {
    // SPEC.SHEET's playable half, in its own window. No desktop icon and no
    // deep link by design: it opens from the sheet's title row (the sheet
    // is what explains the two-accent law it lets you break).
    id: 'skinbuilder',
    name: 'Skin Builder',
    meta: 'SYS-15',
    icon: 'swatch',
    component: dynamic(() => import('@/programs/skinbuilder/SkinBuilder')),
    // measured, not chosen: at 584 the 12 swatches stay on ONE row per role
    // (the row needs 367px of track and gets 372), and 309 = the picker's
    // own 274px + 35px of chrome — the window ends under the status line
    // with no dead paper below it, in every verdict state
    size: { w: 584, h: 309 },
    // offset down-right of the sheet's own (290, 56) so it lands ON the
    // sheet without covering the chip table it re-prints
    pos: { x: 330, y: 300 },
    onDesktop: false,
  },
  {
    // ASK MY AI. ABOUT THIS MACHINE and its essay window both retired here
    // (session 41): one identity door — README — and the machine that
    // helped build the site answers questions at the bottom of it. Five
    // authored cards stream locally; the composer is a live wire to
    // /api/ai-chat. No desktop icon: it opens from README's CTA, and /ai
    // (the essay's old deep link) still lands on it.
    id: 'ai-chat',
    name: 'Ask My AI',
    meta: 'SYS-20',
    icon: 'chip',
    component: dynamic(() => import('@/programs/ai/AiChat')),
    size: { w: 560, h: 680 },
    pos: { x: 330, y: 44 },
    onDesktop: false,
    path: '/ai',
  },
  {
    id: 'trash',
    name: 'Trash',
    meta: 'BIN-99',
    icon: 'trash',
    component: dynamic(() => import('@/programs/trash/Trash')),
    // sized for the disposal records: wide enough for a 46ch memo measure,
    // tall enough to show TAG-01 whole plus the start of TAG-02 (scrolls)
    size: { w: 480, h: 560 },
    pos: { x: 440, y: 60 },
    onDesktop: true,
    path: '/trash',
  },
  {
    id: 'settings',
    name: 'Settings',
    meta: 'SYS-06',
    icon: 'sliders',
    component: dynamic(() => import('@/programs/settings/Settings')),
    size: { w: 430, h: 560 },
    pos: { x: 420, y: 170 },
    onDesktop: true,
  },
  /* EDIT.MODE (SYS-99) was registered here as a hidden program at /edit.
     It is INSPECT.MODE's third tool now, so it is not a program at all:
     /edit opens the same desktop /inspect does and puts the copy editor in
     the hand (see programs/resolve.ts + components/inspect). */
]

export function getProgram(id: string): ProgramDef | undefined {
  return PROGRAMS.find((p) => p.id === id)
}
