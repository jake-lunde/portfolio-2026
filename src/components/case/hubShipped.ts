/* The Family Hub §03 mode screens, one home (s89; reframed s132) —
   consumed by the HubModes plate. Both faces of the case's fidelity
   switch live here: `draft` is the first hi-fi pass, `shipped` is the
   launch product. Exports from the Figma "Section 3" frame
   (201346-2851), grouped there lo-fi/shipped × mode; lo-fi at 1440×800,
   shipped at 1920×1080 scaled to 1440. */

export type HubMode = 'ambient' | 'active' | 'auth'
export type HubFace = 'draft' | 'shipped'

export const HUB_MODE_LABELS: Record<HubMode, string> = {
  ambient: 'Ambient',
  active: 'Active',
  auth: 'Authenticated',
}

export const HUB_SCREEN_DIR = '/case/family-hub/modes'

/** how long each screen holds before the cycle advances */
export const HUB_SCREEN_MS = 3000

export const HUB_SCREENS: Record<HubFace, Record<HubMode, Array<{ file: string; alt: string }>>> = {
  draft: {
    ambient: [
      { file: 'draft-ambient-1', alt: 'First-pass ambient screen: the clock alone, 8:32 in huge digits across two deep green panels.' },
      { file: 'draft-ambient-2', alt: 'First-pass ambient screen: a family photo fills the wall edge to edge, Grandma & Chi Chi, 1974.' },
      { file: 'draft-ambient-3', alt: 'First-pass ambient screen: the bulletin board, carpool pickup with its route map, a recycle-day card beside it.' },
    ],
    active: [
      { file: 'draft-active-1', alt: 'First-pass active screen: the good-morning dashboard. Calendar, chores, and family finances in dark green columns.' },
      { file: 'draft-active-2', alt: 'First-pass active screen: the assistant turning “remind Olivia to walk the dog” into a chore card.' },
      { file: 'draft-active-3', alt: 'First-pass active screen: the family month calendar on a bright green grid.' },
    ],
    auth: [
      { file: 'draft-auth-1', alt: 'First-pass authenticated screen: the lock screen, a parent’s avatar beside the grid of icons used as the passcode.' },
      { file: 'draft-auth-2', alt: 'First-pass authenticated screen: Guardian Mode active, a kid’s investing portfolio open under the banner.' },
      { file: 'draft-auth-3', alt: 'First-pass authenticated screen: Parent mode active, the account balances and wallet unlocked.' },
    ],
  },
  shipped: {
    ambient: [
      { file: 'shipped-ambient-1', alt: 'Shipped ambient screen: the night clock, 03:58 in dim gray digits, 42° and the date in one corner.' },
      { file: 'shipped-ambient-2', alt: 'Shipped ambient screen: a family photo takeover, the time over the street scene, up-next events stacked below.' },
      { file: 'shipped-ambient-3', alt: 'Shipped ambient screen: the daytime clock on deep green, 72°, the up-next rail down the left.' },
    ],
    active: [
      { file: 'shipped-active-1', alt: 'Shipped active screen: the home dashboard. Calendar, chores, and groceries side by side under “It’s currently 72°.”' },
      { file: 'shipped-active-2', alt: 'Shipped active screen: the day’s agenda with the assistant panel open, suggesting a free evening for game night.' },
      { file: 'shipped-active-3', alt: 'Shipped active screen: the week calendar, everyone’s events blocked across the grid.' },
    ],
    auth: [
      { file: 'shipped-auth-1', alt: 'Shipped authenticated screen: the PIN pad up over a photo-picking session. Enter your PIN to continue.' },
      { file: 'shipped-auth-2', alt: 'Shipped authenticated screen: a secure session, Katherine’s accounts open, the balance ring at $502.88.' },
      { file: 'shipped-auth-3', alt: 'Shipped authenticated screen: the lockout, admin mode unavailable for 15 minutes after too many PIN attempts.' },
    ],
  },
}
