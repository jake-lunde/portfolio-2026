'use client'

import dynamic from 'next/dynamic'
import { useInspect } from '@/store/inspect'

/* The seam between the shell and the tool. Two jobs, both about cost:

   · the tool is a `dynamic()` import, so its chunk — panels, tree, the
     nudge library — does not load until somebody turns it on. The shell
     stays lean, which is the rule programs already follow (registry.tsx).
   · this component, not Desktop, is what subscribes to the flag. Desktop
     renders every window, every widget and an AnimatePresence tree; making
     IT re-render on a toggle would churn all of that for a boolean it
     never reads. The desktop's own compression is pure CSS, keyed off the
     body attribute the tool sets (shell.module.css). */

const InspectShell = dynamic(() => import('./InspectShell'), { ssr: false })

export function InspectMount() {
  const on = useInspect((s) => s.on)
  return on ? <InspectShell /> : null
}
