import styles from './Icon.module.css'

export type IconName =
  | 'doc'
  | 'folder'
  | 'note'
  | 'reel'
  | 'wave'
  | 'book'
  | 'sliders'
  | 'rings'
  | 'camera'
  | 'puzzle'
  | 'brush'
  | 'chip'
  | 'trash'
  | 'bike'
  | 'flower'
  | 'disc'
  | 'plane'
  | 'mountain'
  | 'star'
  | 'nodes'
  | 'steps'
  | 'clipboard'
  | 'swatch'
  | 'mystery'

/* 1.5px line-art icons, 32×32 — drawn to read like figures in an old
   technical manual. currentColor so they follow ink/theme. */

const PATHS: Record<IconName, React.ReactNode> = {
  doc: (
    <>
      <path d="M8 4h11l5 5v19H8z" />
      <path d="M19 4v5h5" />
      <path d="M12 14h8M12 18h8M12 22h5" />
    </>
  ),
  folder: (
    <>
      <path d="M4 8h9l3 3h12v14H4z" />
      <path d="M4 13h24" />
    </>
  ),
  note: (
    <>
      <circle cx="11" cy="23" r="4" />
      <circle cx="23" cy="20" r="4" />
      <path d="M15 23V8l12-3v15" />
    </>
  ),
  reel: (
    <>
      <circle cx="16" cy="16" r="11" />
      <circle cx="16" cy="16" r="2" />
      <circle cx="16" cy="9.5" r="1.8" />
      <circle cx="10" cy="19" r="1.8" />
      <circle cx="22" cy="19" r="1.8" />
    </>
  ),
  wave: (
    <>
      <path d="M4 16h3M25 16h3" />
      <path d="M8 16v-6M12 16v6M16 16V6M20 16v8M24 16v-4" />
      <path d="M8 16v6M12 16v-4M16 16v10M20 16v-6M24 16v4" opacity=".45" />
    </>
  ),
  book: (
    <>
      <path d="M16 7c-3-2-7-2-11-1v19c4-1 8-1 11 1 3-2 7-2 11-1V6c-4-1-8-1-11 1z" />
      <path d="M16 7v19" />
    </>
  ),
  sliders: (
    <>
      <path d="M6 10h20M6 16h20M6 22h20" />
      <circle cx="12" cy="10" r="2.5" fill="var(--surface)" />
      <circle cx="21" cy="16" r="2.5" fill="var(--surface)" />
      <circle cx="10" cy="22" r="2.5" fill="var(--surface)" />
    </>
  ),
  rings: (
    <>
      <circle cx="16" cy="16" r="4" />
      <circle cx="16" cy="16" r="8" opacity=".7" />
      <circle cx="16" cy="16" r="12" opacity=".4" />
    </>
  ),
  camera: (
    <>
      <path d="M5 10h6l2-3h6l2 3h6v15H5z" />
      <circle cx="16" cy="17" r="5" />
      <circle cx="16" cy="17" r="1.5" />
    </>
  ),
  puzzle: (
    <>
      <path d="M6 10h6c-2-4 6-4 4 0h6v6c4-2 4 6 0 4v6h-6c2 4-6 4-4 0H6v-6c4 2 4-6 0-4z" />
    </>
  ),
  brush: (
    <>
      <path d="M25 5l-11 11 2 2L27 7z" />
      <path d="M14 16c-3 0-4 2-4 4 0 3-2 4-4 4 6 3 11 0 10-6z" />
    </>
  ),
  chip: (
    <>
      <rect x="9" y="9" width="14" height="14" />
      <rect x="13" y="13" width="6" height="6" />
      <path d="M12 9V4M16 9V4M20 9V4M12 28v-5M16 28v-5M20 28v-5M9 12H4M9 16H4M9 20H4M28 12h-5M28 16h-5M28 20h-5" />
    </>
  ),
  trash: (
    <>
      <path d="M9 11h14l-1.5 17h-11z" />
      <path d="M7 8h18M13 8V5h6v3" />
      <path d="M13 14v10M19 14v10" />
    </>
  ),
  bike: (
    <>
      <circle cx="8" cy="22" r="5" />
      <circle cx="24" cy="22" r="5" />
      <path d="M8 22l6-10h6M14 12l5 10M20 12h4M11 12h6" />
    </>
  ),
  flower: (
    <>
      <circle cx="16" cy="12" r="3.5" />
      <ellipse cx="16" cy="6" rx="2.6" ry="4" />
      <ellipse cx="16" cy="18" rx="2.6" ry="4" />
      <ellipse cx="10" cy="12" rx="4" ry="2.6" />
      <ellipse cx="22" cy="12" rx="4" ry="2.6" />
      <path d="M16 18v10M16 24c-3 0-5-1-6-3" />
    </>
  ),
  disc: (
    <>
      <circle cx="16" cy="16" r="12" />
      <circle cx="16" cy="16" r="3" />
      <path d="M16 4a12 12 0 0 1 10 6" opacity=".5" />
    </>
  ),
  plane: (
    <path d="M16 3v9l11 6v3l-11-3v7l4 3v2l-6-2-6 2v-2l4-3v-7L1 21v-3l11-6V3a2 2 0 0 1 4 0z" transform="translate(0 1)" />
  ),
  mountain: (
    <>
      <path d="M3 25l8-14 5 8 3-5 8 11z" />
      <path d="M9 15l2 3 2-2" opacity=".5" />
    </>
  ),
  star: (
    <path d="M16 3l3.2 8.6L28 12l-6.8 5.4L23.5 26 16 21l-7.5 5 2.3-8.6L4 12l8.8-.4z" />
  ),
  nodes: (
    <>
      <rect x="12" y="4" width="8" height="7" />
      <rect x="3" y="21" width="8" height="7" />
      <rect x="21" y="21" width="8" height="7" />
      <path d="M16 11v5M16 16l-9 5M16 16l9 5" />
    </>
  ),
  steps: (
    <>
      <rect x="4" y="18" width="5" height="10" />
      <rect x="11" y="12" width="5" height="16" />
      <rect x="18" y="20" width="5" height="8" />
      <rect x="25" y="8" width="5" height="20" />
      <path d="M4 4h5M11 4h5M18 4h5M25 4h5" opacity=".5" />
    </>
  ),
  clipboard: (
    <>
      <path d="M7 6h4a2 2 0 0 1 10 0h4v22H7z" />
      <path d="M12 6a2 2 0 0 1 8 0" fill="var(--surface)" />
      <path d="M11 15h10M11 19h10M11 23h6" />
    </>
  ),
  swatch: (
    // a paint-chip card (Pantone-style): solid color block up top,
    // spec lines below; a second chip peeks out behind
    <>
      <path d="M6 6l-3 20 5 1" opacity=".5" />
      <rect x="9" y="3" width="17" height="26" />
      <rect x="12" y="6" width="11" height="11" fill="currentColor" stroke="none" />
      <path d="M12 21.5h11M12 25h7" />
    </>
  ),
  mystery: (
    // sealed / classified — a stamped question over a dashed frame
    <>
      <rect x="6" y="6" width="20" height="20" rx="2" strokeDasharray="3 2.5" />
      <path d="M12 13a4 4 0 1 1 5.2 3.8c-1 .4-1.2 1-1.2 2v.6" />
      <path d="M16 23h.02" />
    </>
  ),
}

/* Medieval variants — the same objects re-cut as woodcut/heraldic figures
   from a parallel 1392. Same 32×32 grid + 1.5px stroke so they sit in the
   grid identically; only the ones a program shows on the desktop are drawn,
   the rest fall back to the classic glyph. See skinVocab.ts for the words
   that ride alongside these (doc→INCIPIT, folder→WORKS, …). */
const MEDIEVAL_PATHS: Partial<Record<IconName, React.ReactNode>> = {
  // README → INCIPIT: a rolled manuscript on two rods
  doc: (
    <>
      <path d="M8 8h16M8 24h16" />
      <path d="M10 8v16M22 8v16" />
      <path d="M8 8a1.6 1.6 0 0 0 0 3.2M24 24a1.6 1.6 0 0 1 0-3.2" opacity=".55" />
      <path d="M13 13h6M13 17h6M13 20.5h4" />
    </>
  ),
  // PROJECTS → WORKS: a clasped codex
  folder: (
    <>
      <path d="M9 6h12a2 2 0 0 1 2 2v18H11a2 2 0 0 1-2-2z" />
      <path d="M9 24h12" />
      <path d="M20 13h4v3.2l-2-1.3-2 1.3z" fill="currentColor" stroke="none" />
    </>
  ),
  // STUDIO → WORKSHOP: a spoked cartwheel
  reel: (
    <>
      <circle cx="16" cy="16" r="10" />
      <circle cx="16" cy="16" r="2.2" />
      <path d="M16 6.4v6.4M16 19.2v6.4M6.4 16h6.4M19.2 16h6.4M9.6 9.6l3.2 3.2M19.2 19.2l3.2 3.2M22.4 9.6l-3.2 3.2M9.6 22.4l3.2-3.2" />
    </>
  ),
  // VISUALIZERS → SCRYING: a crystal orb on a stand, with rays
  wave: (
    <>
      <circle cx="16" cy="14" r="7" />
      <path d="M11 23h10l-1.6 3h-6.8z" />
      <path d="M13 12a3.4 3.4 0 0 1 3-2" opacity=".7" />
      <path d="M16 4v2.4M25.5 14h-2.4M9.4 14H7M22.7 7.3l-1.7 1.7M11 9L9.3 7.3" opacity=".55" />
    </>
  ),
  // GUESTBOOK → THE LEDGER: an open codex, ruled, with a ribbon
  book: (
    <>
      <path d="M16 8c-3-2-7-2-11-1v16c4-1 8-1 11 1 3-2 7-2 11-1V7c-4-1-8-1-11 1z" />
      <path d="M16 8v17" />
      <path d="M8 12h4M8 15h4M20 12h4M20 15h4" opacity=".5" />
      <path d="M16 8l1.6 5-1.6-1.1-1.6 1.1z" fill="currentColor" stroke="none" />
    </>
  ),
  // PHOTO BOOTH → PORTRAITURE: a painter's easel + canvas
  camera: (
    <>
      <path d="M8 7h13v12H8z" />
      <path d="M11 15l3-3 2 2 3-4" opacity=".6" />
      <path d="M9 19l-2 8M20 19l2 8M10 24h9" />
    </>
  ),
  // JIGSAW → LABYRINTH: a square-spiral maze
  puzzle: (
    <>
      <rect x="5" y="5" width="22" height="22" opacity=".5" />
      <path d="M16 16h3v-3h-6v6h9v-9h-12v12h15" />
    </>
  ),
  // TATTOO GUN → ILLUMINATOR: a feather quill
  brush: (
    <>
      <path d="M25 6c-7 2-13 9-15 17l3.2-.8c1.2-6.4 6-11.6 11.8-16.2z" />
      <path d="M20 10c-3 2.2-5.2 5-6.4 8.4" opacity=".5" />
      <path d="M12.5 22.5L9 27" />
    </>
  ),
  // SEQ-16 → PSALTERY: graduated organ pipes on a base
  steps: (
    <>
      <path d="M7 26V13.5a1.5 1.5 0 0 1 3 0V26" />
      <path d="M12 26V9.5a1.5 1.5 0 0 1 3 0V26" />
      <path d="M17 26V15.5a1.5 1.5 0 0 1 3 0V26" />
      <path d="M22 26V11.5a1.5 1.5 0 0 1 3 0V26" />
      <path d="M6 26h20" />
    </>
  ),
  // COMMAND CENTER → THE KEEP: a battlemented tower with a pennant
  nodes: (
    <>
      <path d="M10 26V12h12v14" />
      <path d="M10 12V9h2v2h2V9h2v2h2V9h2v3" />
      <path d="M16 9V5h5l-2 1.6L21 8h-5" fill="currentColor" stroke="none" />
      <path d="M16 5v4" />
      <path d="M13.5 26v-5h5v5" />
    </>
  ),
  // FIELD-NOTES → ??? : a wax seal with ribbon tails (still sealed)
  mystery: (
    <>
      <circle cx="16" cy="14" r="7" />
      <path d="M12.5 20l-2 7 5.5-3.2 5.5 3.2-2-7" />
      <path d="M16 10.5v7M12.5 14h7" opacity=".55" />
    </>
  ),
  // SPEC SHEET → COLOPHON: a heraldic shield with a charged chief
  swatch: (
    <>
      <path d="M8 7h16v9c0 6-5.2 9-8 11-2.8-2-8-5-8-11z" />
      <path d="M8 7h16v6H8z" fill="currentColor" stroke="none" />
      <path d="M16 16v7" opacity=".5" />
    </>
  ),
  // ABOUT THIS MACHINE → THE ENGINE: a clockwork cog
  chip: (
    <>
      <circle cx="16" cy="16" r="6" />
      <circle cx="16" cy="16" r="2" />
      <path d="M16 6v3.2M16 22.8V26M6 16h3.2M22.8 16H26M9.6 9.6l2.2 2.2M20.2 20.2l2.2 2.2M22.4 9.6l-2.2 2.2M9.6 22.4l2.2-2.2" />
    </>
  ),
  // TRASH → OUBLIETTE: a footed brazier with flame (to be forgotten)
  trash: (
    <>
      <path d="M9 15h14l-2.2 8H11.2z" />
      <path d="M12 23l-1.4 4M20 23l1.4 4M14 27h4" />
      <path d="M13.5 15c-.5-3 2-3.5 1-6.5 2.2 1 3.5 3.2 2.4 6.5M18.5 15c1-1.8.3-3.6-.8-4.8" opacity=".7" />
    </>
  ),
  // SETTINGS → THE WORKINGS: a balance scale
  sliders: (
    <>
      <path d="M16 8v13M10 11h12" />
      <path d="M16 6.4a1.4 1.4 0 1 0 .01 0" fill="currentColor" stroke="none" />
      <path d="M10 11l-3.2 6a3.2 3.2 0 0 0 6.4 0z" />
      <path d="M22 11l-3.2 6a3.2 3.2 0 0 0 6.4 0z" />
      <path d="M12 23h8" />
    </>
  ),
}

export function Icon({ name, size = 32 }: { name: IconName; size?: number }) {
  const medieval = MEDIEVAL_PATHS[name]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={medieval ? styles.hasMedieval : undefined}
    >
      <g className={styles.glyphClassic}>{PATHS[name]}</g>
      {medieval && <g className={styles.glyphMedieval}>{medieval}</g>}
    </svg>
  )
}
