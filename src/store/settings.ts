'use client'

import { create } from 'zustand'
import { pickRandomWallpaper } from '@/components/shell/wallpapers'

type Theme = 'light' | 'dark'
export type Skin = 'classic' | 'medieval' | 'underwater'

/* Bound once per page (hydrate runs in >1 component). Guards against
   registering duplicate matchMedia listeners. */
let systemThemeBound = false

type SettingsState = {
  theme: Theme
  sound: boolean
  /** Saved preference: a pinned pattern id, or 'random' (default — see
      resolvedWallpaper). Drives which Settings swatch shows pressed. */
  wallpaper: string
  /** The pattern actually rendered by <Wallpaper>. Equals wallpaper unless
      wallpaper is 'random', in which case it's a fresh pick per hydrate. */
  resolvedWallpaper: string
  skin: Skin
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  toggleSound: () => void
  setWallpaper: (id: string) => void
  setSkin: (skin: Skin) => void
  hydrate: () => void
}

export const useSettings = create<SettingsState>((set, get) => ({
  // SSR defaults; hydrate() reads the real values on mount. wallpaper
  // defaults to 'random' (the resolved pick happens client-side in
  // hydrate(), never during render — resolvedWallpaper stays a fixed
  // fallback here so SSR and the first client paint match).
  theme: 'light',
  sound: true,
  wallpaper: 'random',
  resolvedWallpaper: 'waves',
  skin: 'classic',

  hydrate: () => {
    try {
      const theme = (document.documentElement.dataset.theme as Theme) || 'light'
      const sound = localStorage.getItem('lunde-sound') !== 'off'
      const wallpaper = localStorage.getItem('lunde-wallpaper') ?? 'random'
      const resolvedWallpaper = wallpaper === 'random' ? pickRandomWallpaper() : wallpaper
      const skin = (document.documentElement.dataset.skin as Skin) || 'classic'
      set({ theme, sound, wallpaper, resolvedWallpaper, skin })
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
    // Picking 'random' explicitly re-rolls immediately, so the swatch reads
    // as "give me one now", not just "opt back in for next visit".
    const resolvedWallpaper = wallpaper === 'random' ? pickRandomWallpaper() : wallpaper
    set({ wallpaper, resolvedWallpaper })
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
