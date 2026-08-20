'use client'

import { create } from 'zustand'
import type { HubMode } from './hubShipped'

/* The §03 ⇄ PROGRESS.VWR hand-off (s89). The mode tabs in the plate
   publish here; the rail listens. While `live`, the viewer sets its
   ladder aside and becomes the plate's monitor — the shipped screens
   for whichever mode is picked, cycling. The plate never has to know
   whether a rail exists: below the rail's 640px container threshold
   nothing consumes this and the plate shows its own toggle instead. */

type HubLinkState = {
  mode: HubMode
  live: boolean
  set: (patch: Partial<Pick<HubLinkState, 'mode' | 'live'>>) => void
}

export const useHubLink = create<HubLinkState>((set) => ({
  mode: 'ambient',
  live: false,
  set: (patch) => set(patch),
}))
