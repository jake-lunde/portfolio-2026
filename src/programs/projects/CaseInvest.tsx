import type { ReactElement, ReactNode } from 'react'
import Content from '@content/greenlight-invest.mdx'
import { CaseIndex } from '@/components/case/CaseIndex'
import { Plate } from '@/components/case/CaseComponents'
import { PinnedCase, type PlateShape } from '@/components/case/PinnedSection'
import { BeforeSheet } from '@/components/case/BeforeSheet'
import { LapFlow } from '@/components/case/LapFlow'
import { OverviewPage } from '@/components/case/OverviewPage'
import { DemoReel } from '@/components/case/DemoReel'
import { MoatPlate } from '@/components/case/MoatPlate'
import { GraphPlate } from '@/components/case/GraphPlate'
import { LevelsFilm } from '@/components/case/LevelsFilm'
import styles from '@/components/case/case.module.css'

/* WHICH VISUALS PIN, AND HOW (the pinned layout, PinnedSection.tsx).
   The one place this is decided for Invest. TALL pins beside the text at
   its own size: one phone, or one of Greenlight's phone-sized cards. WIDE
   needs the article's full measure, so it pins small with a chip that
   opens it full size. Anything not named here (Lead, StatRow, Metrics,
   PullQuote, the prose) stays in the text column. */
const SHAPES = new Map<unknown, PlateShape>([
  // 01: five phones side by side, a contact sheet
  [BeforeSheet, 'wide'],
  // 02: one phone and its tabs
  [LapFlow, 'tall'],
  // 03: the phone between two columns of callouts, as wide as the text
  [OverviewPage, 'wide'],
  // 05: Greenlight's bullseye card, 358 x 462
  [MoatPlate, 'tall'],
  // 06: Greenlight's performance card, 358 x 637
  [GraphPlate, 'tall'],
  // 07: the film at 1920/1278 and its scrubber
  [LevelsFilm, 'wide'],
])

/* 04 is a bare Plate in the MDX seating a phone reel (tall). 08 has no
   visual since s148: its outcome reads as a StatRow, like 04's. Any other
   bare Plate pins wide. */
function shapeOf(el: ReactElement): PlateShape | null {
  const shape = SHAPES.get(el.type)
  if (shape) return shape
  if (el.type !== Plate) return null
  const kids = (el.props as { children?: ReactNode }).children
  const phone = (Array.isArray(kids) ? kids : [kids]).some(
    (k) =>
      !!k &&
      typeof k === 'object' &&
      'type' in k &&
      k.type === DemoReel &&
      (k.props as { frame?: string }).frame === 'phone',
  )
  return phone ? 'tall' : 'wide'
}

export default function CaseInvest() {
  return (
    <article className={styles.case}>
      <CaseIndex />
      <PinnedCase className={styles.wrap} shapeOf={shapeOf}>
        <Content />
      </PinnedCase>
    </article>
  )
}
