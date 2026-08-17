import { create } from 'zustand'
import { metric } from '@/lib/metrics'

export type OpenWindow = {
  id: string // one instance per program / case slug
  z: number
}

export type Size = { w: number; h: number }

type WindowsState = {
  windows: OpenWindow[]
  zTop: number
  focused: string | null
  sizes: Record<string, Size> // per-window resize, persisted for the session
  /* THE SIZE A PROGRAM BORROWED ITS WINDOW FROM (pass 11).
     A program may need the frame bigger than the frame it was given for as
     long as one of its states lasts — the shelf's licence check is the
     case: a letter sphere with a 300px minimum plus slots, hint and cancel
     does not fit in a window measured for one row of boxes. `requestSize`
     stashes whatever size the window had HERE and writes the borrowed one;
     `releaseSize` puts the stash back. `null` is a real value and means
     "it had no stored size at all" — the registry default was in force —
     so releasing deletes the key rather than pinning the default. That
     distinction is the whole reason this is a separate map: a reader who
     dragged the grip to their own size must get THAT size back, not the
     one the program shipped with. */
  holds: Record<string, Size | null>
  /* ZOOMED IS PER WINDOW AND IT LIVES HERE, not in Window.tsx where it
     started. A window can now be opened ALREADY maximised — PLAY hands
     the reader a case study and Jake's ruling is that a case arrives full
     screen (LaunchOverlay) — and the thing that opens a window is never
     the window. Same shape as `sizes`: absent means "as it opens". */
  zoomed: Record<string, boolean>
  open: (id: string) => void
  close: (id: string) => void
  focus: (id: string) => void
  setSize: (id: string, size: Size) => void
  setZoomed: (id: string, v: boolean) => void
  requestSize: (id: string, size: Size) => void
  releaseSize: (id: string) => void
  setInitial: (ids: string[]) => void
}

export const useWindows = create<WindowsState>((set, get) => ({
  windows: [],
  zTop: 10,
  focused: null,
  sizes: {},
  holds: {},
  zoomed: {},

  setInitial: (ids) =>
    set({
      windows: ids.map((id, i) => ({ id, z: 10 + i })),
      zTop: 10 + ids.length,
      focused: ids[ids.length - 1] ?? null,
    }),

  open: (id) => {
    metric('window_open', { id })
    const { windows, zTop } = get()
    const next = zTop + 1
    if (windows.some((w) => w.id === id)) {
      set({
        windows: windows.map((w) => (w.id === id ? { ...w, z: next } : w)),
        zTop: next,
        focused: id,
      })
    } else {
      set({
        windows: [...windows, { id, z: next }],
        zTop: next,
        focused: id,
      })
    }
  },

  close: (id) => {
    const { windows, focused, zoomed } = get()
    const rest = windows.filter((w) => w.id !== id)
    const top = rest.length ? rest.reduce((a, b) => (a.z > b.z ? a : b)).id : null
    // a closed window forgets it was maximised: the next open is a fresh
    // arrival, and only whoever opens it gets to say how it arrives
    const nextZoom = { ...zoomed }
    delete nextZoom[id]
    set({ windows: rest, focused: focused === id ? top : focused, zoomed: nextZoom })
  },

  focus: (id) => {
    const { windows, zTop, focused } = get()
    if (focused === id) return
    const next = zTop + 1
    set({
      windows: windows.map((w) => (w.id === id ? { ...w, z: next } : w)),
      zTop: next,
      focused: id,
    })
  },

  setSize: (id, size) => set((s) => ({ sizes: { ...s.sizes, [id]: size } })),

  setZoomed: (id, v) => set((s) => ({ zoomed: { ...s.zoomed, [id]: v } })),

  /* Borrow, then give back. The guard is load-bearing rather than tidy:
     React runs an effect twice on the same value under StrictMode, and a
     second request would stash the BORROWED size as the thing to restore —
     the window would then never come back. First request wins; every one
     after it is a no-op until the hold is released. */
  requestSize: (id, size) =>
    set((s) => {
      if (id in s.holds) return {}
      return {
        holds: { ...s.holds, [id]: s.sizes[id] ?? null },
        sizes: { ...s.sizes, [id]: size },
      }
    }),

  releaseSize: (id) =>
    set((s) => {
      if (!(id in s.holds)) return {}
      const prior = s.holds[id]
      const holds = { ...s.holds }
      delete holds[id]
      const sizes = { ...s.sizes }
      if (prior) sizes[id] = prior
      else delete sizes[id]
      return { holds, sizes }
    }),
}))
