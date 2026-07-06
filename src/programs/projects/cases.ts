import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

export type CaseDef = {
  slug: string
  no: string
  name: string
  org: string
  year: string
  status: 'live' | 'soon'
  component?: ComponentType
}

/* Case studies — window id is `case:<slug>`, deep link is /projects/<slug>. */

export const CASES: CaseDef[] = [
  {
    slug: 'greenlight-invest',
    no: '01',
    name: 'Greenlight Invest',
    org: 'Greenlight',
    year: '2024–25',
    status: 'live',
    component: dynamic(() => import('@/programs/projects/CaseInvest')),
  },
  { slug: 'family-hub', no: '02', name: 'Family Hub', org: 'Greenlight', year: '2025', status: 'soon' },
  { slug: 'tooling', no: '03', name: 'Tooling', org: 'Personal leverage', year: '2024–26', status: 'soon' },
  { slug: 'interview-pipeline', no: '04', name: 'Interview Pipeline', org: 'This site', year: '2026', status: 'soon' },
]

export function getCase(slug: string): CaseDef | undefined {
  return CASES.find((c) => c.slug === slug)
}
