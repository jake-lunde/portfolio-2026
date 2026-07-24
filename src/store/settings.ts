'use client'

import { create } from 'zustand'

type Theme = 'light' | 'dark'
export type Skin = 'classic' | 'medieval' | 'underwater'

/* Bound once per page (hydrate runs in >1 component). Guards against
   registering duplicate matchMedia listeners. */
let systemThemeBound = false

type SettingsState = {
  theme: Theme
  sound: boolean
  wallpaper: string
  skin: Skin
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  toggleSound: () => void
  setWallpaper: (id: string) => void
  setSkin: (skin: Skin) => void
  hydrate: () => void
}

export const useSettings = create<SettingsState>((set, get) => ({
  // SSR defaults; hydrate() reads the real values on mount
  theme: 'light',
  sound: true,
  wallpaper: 'waves',
  skin: 'classic',

  hydrate: () => {
    try {
      const theme = (document.documentElement.dataset.theme as Theme) || 'light'
      const sound = localStorage.getItem('lunde-sound') !== 'off'
      const wallpaper = localStorage.getItem('lunde-wallpaper') ?? 'waves'
      const skin = (document.documentElement.dataset.skin as Skin) || 'classic'
      set({ theme, sound, wallpaper, skin })
    } catch {
      /* no-op */
    }

    // Follow the OS appearance live. The pre-paint script (layout.tsx) seeds
    // the theme on load — localStorage pin wins, else prefers-color-scheme.
    // Here we keep tracking: when the OS flips (e.g. sunset), the site follows
    // and the manual override is cleared, so the system stays authoritative.
    // A manual toggle (setTheme) still overrides until the next OS change.
    if (systemThemeBound || typeof window === 'undefined' || !window.matchMedia) return
    systemThemeBound = true
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => {
      const theme: Theme = e.matches ? 'dark' : 'light'
      document.documentElement.dataset.theme = theme
      try {
        localStorage.removeItem('lunde-theme')
      } catch {}
      set({ theme })
    }
    mq.addEventListener('change', onChange)
  },

  setWallpaper: (wallpaper) => {
    try {
      localStorage.setItem('lunde-wallpaper', wallpaper)
    } catch {}
    set({ wallpaper })
  },

  setSkin: (skin) => {
    document.documentElement.dataset.skin = skin
    try {
      localStorage.setItem('lunde-skin', skin)
    } catch {}
    set({ skin })
  },

  setTheme: (theme) => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('lunde-theme', theme)
    } catch {}
    set({ theme })
  },

  toggleTheme: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),

  toggleSound: () => {
    const sound = !get().sound
    try {
      localStorage.setItem('lunde-sound', sound ? 'on' : 'off')
    } catch {}
    set({ sound })
  },
}))
