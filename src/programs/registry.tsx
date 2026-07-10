import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { IconName } from '@/components/shell/Icon'

export type ProgramDef = {
  id: string
  name: string // desktop label + window title
  meta: string // mono doc-id in the titlebar, e.g. "SPEC-01"
  icon: IconName
  component: ComponentType
  /** default window geometry (desktop; mobile goes full-bleed) */
  size: { w: number; h: number }
  pos: { x: number; y: number } // offsets from desktop top-left, deterministic for SSR
  chrome?: 'paper' | 'crt'
  /** show an icon on the desktop */
  onDesktop?: boolean
  /** route path that deep-links to this window */
  path?: string
}

/* ------------------------------------------------------------------
   Register programs here. One entry = icon + window + deep link.
   Case studies register themselves via src/programs/projects/cases.ts
   ------------------------------------------------------------------ */

export const PROGRAMS: ProgramDef[] = [
  {
    id: 'readme',
    name: 'README',
    meta: 'DOC-00',
    icon: 'doc',
    component: dynamic(() => import('@/programs/about/About')),
    size: { w: 520, h: 590 },
    pos: { x: 120, y: 60 },
    onDesktop: true,
    path: '/readme',
  },
  {
    id: 'projects',
    name: 'Projects',
    meta: 'IDX-01',
    icon: 'folder',
    component: dynamic(() => import('@/programs/projects/Projects')),
    size: { w: 640, h: 480 },
    pos: { x: 200, y: 110 },
    onDesktop: true,
    path: '/projects',
  },
  {
    id: 'now-playing',
    name: 'Now Playing',
    meta: 'AUX-02',
    icon: 'note',
    component: dynamic(() => import('@/programs/stubs/NowPlaying')),
    size: { w: 420, h: 320 },
    pos: { x: 300, y: 160 },
    chrome: 'crt',
    onDesktop: true,
  },
  {
    id: 'studio',
    name: 'Studio',
    meta: 'AUX-03',
    icon: 'reel',
    component: dynamic(() => import('@/programs/studio/Studio')),
    size: { w: 560, h: 560 },
    pos: { x: 340, y: 70 },
    chrome: 'crt',
    onDesktop: true,
    path: '/studio',
  },
  {
    id: 'visualizers',
    name: 'Visualizers',
    meta: 'IDX-04',
    icon: 'wave',
    component: dynamic(() => import('@/programs/visualizers/Visualizers')),
    size: { w: 520, h: 420 },
    pos: { x: 240, y: 80 },
    onDesktop: true,
    path: '/visualizers',
  },
  {
    id: 'guestbook',
    name: 'Guestbook',
    meta: 'LOG-05',
    icon: 'book',
    component: dynamic(() => import('@/programs/guestbook/Guestbook')),
    size: { w: 460, h: 560 },
    pos: { x: 380, y: 80 },
    onDesktop: true,
    path: '/guestbook',
  },
  {
    id: 'booth',
    name: 'Photo Booth',
    meta: 'CAM-07',
    icon: 'camera',
    component: dynamic(() => import('@/programs/booth/PhotoBooth')),
    size: { w: 540, h: 640 },
    pos: { x: 300, y: 50 },
    chrome: 'crt',
    onDesktop: true,
    path: '/booth',
  },
  {
    id: 'puzzle',
    name: 'Jigsaw',
    meta: 'TOY-08',
    icon: 'puzzle',
    component: dynamic(() => import('@/programs/puzzle/Puzzle')),
    size: { w: 660, h: 728 },
    pos: { x: 260, y: 40 },
    onDesktop: true,
    path: '/puzzle',
  },
  {
    id: 'paint',
    name: 'Coloring',
    meta: 'TOY-09',
    icon: 'brush',
    component: dynamic(() => import('@/programs/paint/Paint')),
    size: { w: 520, h: 680 },
    pos: { x: 340, y: 30 },
    onDesktop: true,
    path: '/paint',
  },
  {
    id: 'command',
    name: 'Command Center',
    meta: 'CTR-11',
    icon: 'nodes',
    component: dynamic(() => import('@/programs/command/CommandCenter')),
    size: { w: 780, h: 700 },
    pos: { x: 250, y: 26 },
    chrome: 'crt',
    onDesktop: true,
    path: '/command',
  },
  {
    id: 'machine',
    name: 'About This Machine',
    meta: 'SYS-10',
    icon: 'chip',
    component: dynamic(() => import('@/programs/machine/AboutMachine')),
    size: { w: 600, h: 720 },
    pos: { x: 280, y: 30 },
    onDesktop: true,
    path: '/machine',
  },
  {
    id: 'trash',
    name: 'Trash',
    meta: 'BIN-99',
    icon: 'trash',
    component: dynamic(() => import('@/programs/trash/Trash')),
    size: { w: 380, h: 340 },
    pos: { x: 440, y: 180 },
    onDesktop: true,
  },
  {
    id: 'settings',
    name: 'Settings',
    meta: 'SYS-06',
    icon: 'sliders',
    component: dynamic(() => import('@/programs/settings/Settings')),
    size: { w: 430, h: 560 },
    pos: { x: 420, y: 170 },
    onDesktop: true,
  },
]

export function getProgram(id: string): ProgramDef | undefined {
  return PROGRAMS.find((p) => p.id === id)
}
