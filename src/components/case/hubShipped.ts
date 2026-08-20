/* The Family Hub shipped screens, one home (s89) — consumed by the §03
   plate (HubModes) below the rail threshold, and by PROGRESS.VWR when
   the hand-off lends it out as the plate's monitor. Exports from the
   Figma "Plate 4" frame (201346-2778), 1086×610 WebP. */

export type HubMode = 'ambient' | 'active' | 'auth'

export const HUB_MODE_LABELS: Record<HubMode, string> = {
  ambient: 'Ambient',
  active: 'Active',
  auth: 'Authenticated',
}

export const HUB_SHOT_DIR = '/case/family-hub/shipped'

/** how long each shipped screen holds before the cycle advances */
export const HUB_SHOT_MS = 3000

export const HUB_SHOTS: Record<HubMode, Array<{ file: string; alt: string }>> = {
  ambient: [
    { file: 'ambient-1', alt: 'Shipped ambient screen: a painting fills the wall edge to edge, the temperature tucked into one corner.' },
    { file: 'ambient-2', alt: 'Shipped ambient screen: a photo card on a warm ground, the time top left, two chores due today bottom right.' },
    { file: 'ambient-3', alt: 'Shipped ambient screen: a kid’s crayon drawing hung on a cream mat like a framed picture.' },
    { file: 'ambient-4', alt: 'Shipped ambient screen: the clock alone, 06:45 PM, split across two deep green panels.' },
  ],
  active: [
    { file: 'active-1', alt: 'Shipped active screen: the July month calendar with the whole household blocked onto one grid.' },
    { file: 'active-2', alt: 'Shipped active screen: the chores board, a column per day, each kid’s tasks stacked under it.' },
    { file: 'active-3', alt: 'Shipped active screen: the safety map, family activity down the side, two kids pinned on the street grid.' },
    { file: 'active-4', alt: 'Shipped active screen: editing a chore, on-screen keyboard up, allowance and repeat settings above it.' },
    { file: 'active-5', alt: 'Shipped active screen: settings, laid out as two columns of plain labelled rows.' },
  ],
  auth: [
    { file: 'auth-1', alt: 'Shipped authenticated screen: the lock screen, a parent’s avatar beside a grid of icons used as the passcode.' },
    { file: 'auth-2', alt: 'Shipped authenticated screen: Guardian Mode active, banner across the top, a kid’s investing portfolio underneath.' },
    { file: 'auth-3', alt: 'Shipped authenticated screen: Parent mode active, the account balances and wallet unlocked behind the banner.' },
  ],
}
