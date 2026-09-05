'use client'

import { create } from 'zustand'

/* The case-wide fidelity mode (s94). One global switch, Jake's call: a
   consistent control, fixed in place, beats a toggle repeated on every
   plate. Draft is the resting state; shipped is the reader's to flip
   on. Every paired plate (FidelityFrame), and §03's rail hand-off,
   listens here. Labels are per-plate: each pair names its own two
   rungs of the ladder, so the binary mode stays honest about what its
   two sides actually are (v0.4 vs v0.6, BUILD vs FIX).

   THE RULE, for every surface that listens here (s140): a fidelity-aware
   surface keeps the same height on both faces. Flipping is a switch, not
   a reload — if a face changes the height, everything below it moves
   under the reader's thumb. Chrome's scroll anchoring hides that; Safari
   has none, so on an iPhone the page visibly jumps. Scroll anchoring is
   not the fix; matching heights is. Paired plates get it free from
   FidelityFrame's shared frame; a surface that swaps its own tree (the
   hero art) has to declare a stage with a fixed ratio and render both
   faces into it. */

export type Fidelity = 'draft' | 'shipped'

type FidelityState = {
  mode: Fidelity
  set: (mode: Fidelity) => void
}

export const useFidelity = create<FidelityState>((set) => ({
  mode: 'draft',
  set: (mode) => set({ mode }),
}))
