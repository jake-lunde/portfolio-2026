'use client'

import { useEffect, useState } from 'react'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import styles from './inspectShell.module.css'

/* The note that explains a section, moved off the panel and onto the bar.

   Jake's round-3 note: "the little notes like SOURCE's 'pointers to search
   for' should appear on hover. I'll move this experience toward hover over
   time so start now." The sort behind it, and it is the rule the panel
   follows now: prose that explains the TOOL goes to hover, readings that
   describe the PICK stay inline where they can be seen at a glance. A
   warning about a core primitive is a finding. "The tool cannot resolve a
   path from the browser" is a footnote about the instrument.

   Renders as a fragment on purpose. The tip must NOT sit inside the
   section's h3: a heading takes its accessible name from its contents, so
   a paragraph parked in there would be read out as part of the heading.
   The bar is the positioning context (.bar is relative), the h3 holds only
   the label, and these two are its siblings.

   The tip is mounted whether it is showing or not, and the button points
   at it with aria-describedby, so a screen reader hears the note on focus
   without anything having to open. Closed it is a zero-height clipped box
   rather than display:none or visibility:hidden: both of those would take
   the sentence back off the button, and an absolutely positioned box left
   at full height would add phantom scroll to the bottom of the dock. */

export function InfoTip({ k }: { k: string }) {
  const skin = useSettings((s) => s.skin)
  const [open, setOpen] = useState(false)

  /* Derived from the key, never useId: this panel mounts inside a tree
     that reshapes at the SSR handover and a generated id mismatches across
     it (see InspectorPanel). One tip per note key, so the id is unique by
     construction. */
  const id = `inspect-tip-${k.replace(/\./g, '-')}`

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      /* Escape has to close the tip and nothing else. The tool's own
         ladder listens on `document` in the capture phase (InspectShell),
         where the next rung down would deselect the pick. Capture runs
         from the outside in, so a listener on `window` is reached first
         and stopping it there is what keeps the ladder in order. */
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  return (
    <>
      <button
        type="button"
        className={styles.tipBtn}
        aria-label={t('inspect.info', skin)}
        aria-describedby={id}
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((was) => !was)}
      >
        <span aria-hidden="true">?</span>
      </button>
      <span
        id={id}
        role="tooltip"
        className={styles.tip}
        data-open={open || undefined}
        /* the pointer can travel from the button down into the note
           without it closing underneath them */
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={() => setOpen(false)}
      >
        {t(k, skin)}
      </span>
    </>
  )
}
