import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import { VizShell } from './VizShell'

/* Registered visualizers — each opens in its own CRT window (id `viz:<id>`,
   deep link /visualizers/<id>) from the Visualizers folder.
   Adding one: build the component, add an entry here. */

export type VizDef = {
  id: string
  no: string
  name: string
  source: string
  status: 'live' | 'soon'
  component?: ComponentType
  size: { w: number; h: number }
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
    component: wrap(() => import('./RideViz').then((m) => m.RideViz)),
    size: { w: 720, h: 716 },
  },
  {
    id: 'flowers',
    no: '02',
    name: 'Flowers',
    source: 'Garden scan',
    status: 'live',
    component: wrap(() => import('./FlowerViz').then((m) => m.FlowerViz)),
    size: { w: 700, h: 560 },
  },
  {
    id: 'scrobbles',
    no: '03',
    name: 'Scrobbles',
    source: 'Last.fm',
    status: 'live',
    component: wrap(() => import('./ScrobblesViz').then((m) => m.ScrobblesViz)),
    size: { w: 720, h: 664 },
  },
  {
    id: 'flights',
    no: '04',
    name: 'Flights',
    source: 'Flighty',
    status: 'live',
    component: wrap(() => import('./FlightsViz').then((m) => m.FlightsViz)),
    size: { w: 720, h: 664 },
  },
  {
    id: 'slopes',
    no: '05',
    name: 'Slopes',
    source: 'Slopes',
    status: 'live',
    component: wrap(() => import('./SlopesViz').then((m) => m.SlopesViz)),
    size: { w: 720, h: 662 },
  },
  {
    id: 'daily',
    no: '06',
    name: 'Daily',
    source: 'Live systems',
    status: 'live',
    component: wrap(() => import('./DailyViz').then((m) => m.DailyViz)),
    size: { w: 540, h: 460 },
  },
  {
    id: 'taurus',
    no: '07',
    name: 'Taurus',
    source: 'The sky',
    status: 'live',
    component: wrap(() => import('./TaurusViz').then((m) => m.TaurusViz)),
    size: { w: 720, h: 660 },
  },
  { id: 'louie', no: '08', name: 'Louie', source: 'Toy poodle', status: 'soon', size: { w: 700, h: 560 } },
]

export const getViz = (id: string): VizDef | undefined => VIZ.find((v) => v.id === id)
