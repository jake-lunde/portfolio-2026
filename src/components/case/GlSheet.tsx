'use client'

import { motion } from 'motion/react'
import styles from './moat.module.css'

/* Greenlight's fly-up sheet, shared by the competitors bullseye
   (MoatPlate) and the performance graph (GraphPlate). It rises from the
   card's bottom edge (the card is its containing block: position set,
   overflow hidden, the --gl-* palette defined); the caller owns the
   scrim, inert-behind and focus in/back. Styles live in moat.module.css,
   where the sheet was first built. */

const ASSET = '/case/greenlight-invest/moat/'

/* the sheet's shell: rises from the card's bottom edge, Escape closes */
export function SheetShell({
  titleId,
  title,
  onClose,
  transition,
  className,
  closeRef,
  children,
}: {
  titleId: string
  title: React.ReactNode
  onClose: () => void
  transition: object
  className?: string
  closeRef?: React.Ref<HTMLButtonElement>
  children: React.ReactNode
}) {
  return (
    <motion.div
      className={className ? `${styles.sheet} ${className}` : styles.sheet}
      role="dialog"
      aria-labelledby={titleId}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={transition}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onClose()
        }
      }}
    >
      <div className={styles.sheetHead}>
        <h3 id={titleId} className={styles.sheetTitle}>
          {title}
        </h3>
        <button ref={closeRef} type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          <img src={`${ASSET}icon-close.svg`} alt="" width={24} height={24} />
        </button>
      </div>
      {children}
    </motion.div>
  )
}
