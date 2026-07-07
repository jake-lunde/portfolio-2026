'use client'

import { create } from 'zustand'

type Theme = 'light' | 'dark'

type SettingsState = {
  theme: Theme
  sound: boolean
  wallpaper: string
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  toggleSound: () => void
  setWallpaper: (id: string) => void
  hydrate: () => void
}

export const useSettings = create<SettingsState>((set, get) => ({
  // SSR defaults; hydrate() reads the real values on mount
  theme: 'light',
  sound: true,
  wallpaper: 'waves',

  hydrate: () => {
    try {
      const theme = (document.documentElement.dataset.theme as Theme) || 'light'
      const sound = localStorage.getItem('lunde-sound') !== 'off'
      const wallpaper = localStorage.getItem('lunde-wallpaper') ?? 'waves'
      set({ theme, sound, wallpaper })
    } catch {
      /* no-op */
    }
  },

  setWallpaper: (wallpaper) => {
    try {
      localStorage.setItem('lunde-wallpaper', wallpaper)
    } catch {}
    set({ wallpaper })
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
