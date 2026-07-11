'use client'

import { create } from 'zustand'

/* Clearance for the Projects wing — granted per session via the sphere. */

type GateState = {
  unlocked: boolean
  unlock: () => void
  hydrate: () => void
}

export const useGate = create<GateState>((set) => ({
  unlocked: false,
  unlock: () => {
    try {
      sessionStorage.setItem('lunde-gate', '1')
    } catch {}
    set({ unlocked: true })
  },
  hydrate: () => {
    try {
      if (sessionStorage.getItem('lunde-gate') === '1') set({ unlocked: true })
    } catch {}
  },
}))
