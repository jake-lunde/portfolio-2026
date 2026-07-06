'use client'

import { create } from 'zustand'

type Theme = 'light' | 'dark'

type SettingsState = {
  theme: Theme
  sound: boolean
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  toggleSound: () => void
  hydrate: () => void
}

export const useSettings = create<SettingsState>((set, get) => ({
  // SSR defaults; hydrate() reads the real values on mount
  theme: 'light',
  sound: true,

  hydrate: () => {
    try {
      const theme = (document.documentElement.dataset.theme as Theme) || 'light'
      const sound = localStorage.getItem('lunde-sound') !== 'off'
      set({ theme, sound })
    } catch {
      /* no-op */
    }
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
