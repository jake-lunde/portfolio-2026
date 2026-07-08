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
      <circle cx="12" cy="10" r="2.5" fill="var(--paper)" />
      <circle cx="21" cy="16" r="2.5" fill="var(--paper)" />
      <circle cx="10" cy="22" r="2.5" fill="var(--paper)" />
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
    <path d="M28 5c-1.4-1.4-4 0-4 0l-6 6-11-3-2 2 8 6-4 4-4-1-1.5 1.5 5 3 3 5L20 39l-1-4 4-4 6 8 2-2-3-11 6-6s1.4-2.6 0-4z" transform="scale(0.72) translate(4 -1)" />
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
}

export function Icon({ name, size = 32 }: { name: IconName; size?: number }) {
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
    >
      {PATHS[name]}
    </svg>
  )
}
