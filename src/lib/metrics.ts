'use client'

import { track } from '@vercel/analytics'

/* Coarse interaction events → Vercel Web Analytics. Pageviews + geo work
   on every plan; these custom events only appear in the dashboard on
   Vercel Pro (they no-op silently on Hobby — wired so they light up the
   day the plan changes). Keep events coarse: what, never who. */

export function metric(name: string, props?: Record<string, string | number | boolean>) {
  try {
    track(name, props)
  } catch {
    /* analytics must never break the OS */
  }
}
