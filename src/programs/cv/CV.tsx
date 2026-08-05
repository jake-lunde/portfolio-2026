'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/primitives/Button'
import { t } from '@/content/copy'
import { cvSfx, sfx } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import { buildPasses } from './passes'
import { PrintDialog } from './PrintDialog'
import styles from './cv.module.css'

/* CV.EXE — the resume as a document, delivered the way 1992 delivered
 * documents: through the print dialog (PrintDialog.tsx).
 *
 * The window shows the full typeset resume from first paint — no reveal
 * theater, the document just IS (screen readers and reduced-motion get
 * everything for free). The page is a RENDER of src/content/resume.ts;
 * what PRINT hands over is public/jake-lunde-resume.pdf, built from the
 * same file by scripts/build-cv.mjs, so the two can't drift.
 *
 * The sheet keeps its tractor-feed rails — the stock remembers what kind
 * of printer this OS owns. The physical machine itself retires to the
 * future desk scene (Notion: "The Desk").
 *
 * data-no-translate on the sheet is load-bearing: KnightSpeakLayer rewrites
 * untranslated DOM text under the medieval skin, and a CV is fact, not
 * costume. The chrome around it (toolbar, dialog) translates via copy keys.
 *
 * No useId (programs are dynamic imports; generated ids mismatch at SSR
 * handover — see memory). Constant ids only. */

const PDF = '/jake-lunde-resume.pdf'
const PRINT_BTN_ID = 'cv-print-btn'

export default function CV() {
  const skin = useSettings((s) => s.skin)
  const passes = useMemo(buildPasses, [])

  const [dialogOpen, setDialogOpen] = useState(false)
  const linkRef = useRef<HTMLAnchorElement>(null)

  const openDialog = useCallback(() => {
    sfx.open()
    setDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    // hand focus back to the control that opened the dialog
    document.getElementById(PRINT_BTN_ID)?.focus()
  }, [])

  const deliver = useCallback(() => {
    cvSfx.tear()
    linkRef.current?.click()
  }, [])

  return (
    <div className={styles.cv}>
      <div className={styles.toolbar}>
        <Button id={PRINT_BTN_ID} size="md" tone="expressive" onClick={openDialog}>
          {t('cv.print', skin)}
        </Button>
        {/* the artifact without the ritual, for anyone in a hurry —
            and next in tab order for keyboard users */}
        <a className={styles.quietLink} href={PDF} download>
          {t('cv.download', skin)}
        </a>
      </div>

      <div className={styles.feed}>
        <div className={styles.paper} data-no-translate="">
          <span className={styles.sprocket} aria-hidden="true" />
          <div className={styles.sheet}>{passes}</div>
          <span className={styles.sprocket} aria-hidden="true" />
        </div>
      </div>

      <PrintDialog open={dialogOpen} onClose={closeDialog} onDeliver={deliver} />

      {/* the actual artifact; the dialog just clicks it */}
      <a ref={linkRef} href={PDF} download hidden aria-hidden="true" tabIndex={-1}>
        {t('cv.download', skin)}
      </a>
    </div>
  )
}
