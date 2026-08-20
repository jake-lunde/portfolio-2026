'use client'

import { create } from 'zustand'

/* The case-wide fidelity mode (s94). One global switch, Jake's call: a
   consistent control, fixed in place, beats a toggle repeated on every
   plate. Draft is the resting state; shipped is the reader's to flip
   on. Every paired plate (FidelityFrame), and §03's rail hand-off,
   listens here. Labels are per-plate: each pair names its own two
   rungs of the ladder, so the binary mode stays honest about what its
   two sides actually are (v0.4 vs v0.6, BUILD vs FIX). */

export type Fidelity = 'draft' | 'shipped'

type FidelityState = {
  mode: Fidelity
  set: (mode: Fidelity) => void
}

export const useFidelity = create<FidelityState>((set) => ({
  mode: 'draft',
  set: (mode) => set({ mode }),
}))
