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
    id: 'flowers',
    no: '02',
    name: 'Flowers',
    source: 'Garden scan',
    status: 'live',
    icon: 'flower',
    component: wrap(() => import('./FlowerViz').then((m) => m.FlowerViz)),
    size: { w: 700, h: 560 },
  },
  {
    id: 'scrobbles',
    no: '03',
    name: 'Scrobbles',
    source: 'Last.fm',
    status: 'live',
    icon: 'disc',
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
  { id: 'louie', no: '07', name: 'Louie', source: 'Toy poodle', status: 'soon', icon: 'rings', size: { w: 700, h: 560 } },
]

export const getViz = (id: string): VizDef | undefined => VIZ.find((v) => v.id === id)
