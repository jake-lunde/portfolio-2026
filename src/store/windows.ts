import { create } from 'zustand'

export type OpenWindow = {
  id: string // one instance per program / case slug
  z: number
}

type WindowsState = {
  windows: OpenWindow[]
  zTop: number
  focused: string | null
  open: (id: string) => void
  close: (id: string) => void
  focus: (id: string) => void
  setInitial: (ids: string[]) => void
}

export const useWindows = create<WindowsState>((set, get) => ({
  windows: [],
  zTop: 10,
  focused: null,

  setInitial: (ids) =>
    set({
      windows: ids.map((id, i) => ({ id, z: 10 + i })),
      zTop: 10 + ids.length,
      focused: ids[ids.length - 1] ?? null,
    }),

  open: (id) => {
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
    const { windows, focused } = get()
    const rest = windows.filter((w) => w.id !== id)
    const top = rest.length ? rest.reduce((a, b) => (a.z > b.z ? a : b)).id : null
    set({ windows: rest, focused: focused === id ? top : focused })
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
}))
