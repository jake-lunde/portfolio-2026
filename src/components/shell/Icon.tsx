export type IconName =
  | 'doc'
  | 'folder'
  | 'note'
  | 'reel'
  | 'wave'
  | 'book'
  | 'sliders'
  | 'rings'

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
