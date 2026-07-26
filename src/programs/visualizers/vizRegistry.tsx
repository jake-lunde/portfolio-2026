import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { IconName } from '@/components/shell/Icon'
import { VizShell } from './VizShell'

/* Registered visualizers — each opens in its own CRT window (id `viz:<id>`,
   deep link /visualizers/<id>) directly from a desktop icon.
   Adding one: build the component, add an entry here. */

export type VizDef = {
  id: string
  no: string
  name: string
  source: string
  status: 'live' | 'soon'
  icon: IconName
  component?: ComponentType
  size: { w: number; h: number }
  /** Kept out of the Visualizers index, still fully resolvable as a
      window. For a viz that has been rehomed into another drawer: it must
      not appear in two places at once, but its id is the address of the
      window, its deep link and its folder entry, so it stays registered
      here rather than moving. See `scrobbles` → MUSIC / HISTORY. */
  hidden?: boolean
}

const wrap = (loader: () => Promise<ComponentType>) =>
  dynamic(() =>
    loader().then((C) => {
      const Wrapped = () => (
        <VizShell>
          <C />
        </VizShell>
      )
      return Wrapped
    })
  )

export const VIZ: VizDef[] = [
  {
    id: 'ride',
    no: '01',
    name: 'Ride',
    source: 'Strava',
    status: 'live',
    icon: 'bike',
    component: wrap(() => import('./RideViz').then((m) => m.RideViz)),
    size: { w: 720, h: 716 },
  },
  {
    id: 'models',
    no: '02',
    name: 'Models',
    source: 'Low-poly shelf',
    status: 'live',
    icon: 'flower',
    component: wrap(() => import('./ModelsViz').then((m) => m.ModelsViz)),
    size: { w: 700, h: 560 },
  },
  {
    // Rehomed: shows up as HISTORY inside the MUSIC drawer, not in the
    // Visualizers index. `id` stays `scrobbles` — /visualizers/scrobbles,
    // the `viz:scrobbles` window id and MUSIC's folder entry all address
    // it by that, and VIZ-03 is its number in the series either way.
    id: 'scrobbles',
    no: '03',
    name: 'History',
    source: 'Last.fm',
    status: 'live',
    icon: 'disc',
    hidden: true,
    component: wrap(() => import('./ScrobblesViz').then((m) => m.ScrobblesViz)),
    size: { w: 720, h: 664 },
  },
  {
    id: 'flights',
    no: '04',
    name: 'Flights',
    source: 'Flighty',
    status: 'live',
    icon: 'plane',
    component: wrap(() => import('./FlightsViz').then((m) => m.FlightsViz)),
    size: { w: 720, h: 664 },
  },
  {
    id: 'slopes',
    no: '05',
    name: 'Slopes',
    source: 'Slopes',
    status: 'live',
    icon: 'mountain',
    component: wrap(() => import('./SlopesViz').then((m) => m.SlopesViz)),
    size: { w: 720, h: 662 },
  },
  {
    id: 'taurus',
    no: '06',
    name: 'Taurus',
    source: 'The sky',
    status: 'live',
    icon: 'star',
    component: wrap(() => import('./TaurusViz').then((m) => m.TaurusViz)),
    size: { w: 720, h: 660 },
  },
]

export const getViz = (id: string): VizDef | undefined => VIZ.find((v) => v.id === id)

/** What the Visualizers index lists. Resolution (getViz / deep links /
    ALL_PATHS) deliberately does NOT use this — a hidden viz is a real,
    linkable window, it just isn't advertised twice. */
export const VIZ_LISTED: VizDef[] = VIZ.filter((v) => !v.hidden)
