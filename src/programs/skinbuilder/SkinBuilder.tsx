'use client'

import { useEffect, useState } from 'react'
import { CopyText as Copy } from '@/content/CopyText'
import { t } from '@/content/copy'
import {
  clear as clearBuild,
  PALETTE,
  pick as pickAccent,
  readPicks,
  type Picks,
  type Role,
} from '@/lib/buildASkin'
/* gateSfx carries the shared refuse/undo blips (its descending pair is the
   system's "no"); the accept is the ordinary tap */
import { gateSfx, sfx } from '@/lib/sound'
import { useSettings } from '@/store/settings'
import styles from './skinbuilder.module.css'

/* SKIN BUILDER — section 02 of SPEC.SHEET, pulled out into its own window
   (session 38). The sheet DOCUMENTS the system; this window lets a visitor
   re-cast its two accent roles and watch the law hold: every pick is
   measured before it is allowed through, and the expressive one is
   demoted to marks-only wherever it fails AA as text.

   It opens from the sheet's title row (SpecSheet.tsx) and nowhere else —
   no desktop icon. Side by side with the sheet, a pick here re-skins the
   OS live and the sheet's own chip table re-derives on the same tick (it
   observes the <html> style attribute these overrides are written to).

   Gates + overrides: src/lib/buildASkin.ts. WCAG math: src/lib/contrast.ts.
   Copy keys stay in the `spec-sheet.build.*` namespace they shipped under —
   EDIT.MODE addresses copy BY KEY, so renaming them would orphan the
   sheet's existing entries for no reader-visible gain. */

const ROLES: Array<{ id: Role; labelKey: string; hintKey: string }> = [
  {
    id: 'accent',
    labelKey: 'spec-sheet.build.roleSystem',
    hintKey: 'spec-sheet.build.roleSystemHint',
  },
  {
    id: 'expressive',
    labelKey: 'spec-sheet.build.roleExpressive',
    hintKey: 'spec-sheet.build.roleExpressiveHint',
  },
]

/* The last thing the machine did, reported in one line. Static words are
   copy keys; only the candidate name and the computed ratio are data. */
type Status =
  | { kind: 'reset' }
  | {
      kind: 'verdict'
      ok: boolean
      name: string
      ratio: number
      against: 'paper' | 'ink'
      reasonKey: string
    }
  | null

export default function SkinBuilder() {
  const [picks, setPicks] = useState<Picks>({})
  const [status, setStatus] = useState<Status>(null)
  const skin = useSettings((s) => s.skin)
  const theme = useSettings((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    const read = () => setPicks(readPicks())
    read()
    /* the rings must never claim a pick the tokens no longer carry:
       revalidate() drops picks that fail the gate after a skin or theme
       flip, and it drops them by rewriting these same four properties */
    const obs = new MutationObserver(read)
    obs.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-skin', 'style'],
    })
    return () => obs.disconnect()
  }, [])

  // a flip re-grounds every gate, so the last verdict no longer describes
  // anything true — clear the line rather than let it lie
  useEffect(() => {
    setStatus(null)
  }, [skin, theme])

  const choose = (role: Role, candidate: (typeof PALETTE)[number]) => {
    const v = pickAccent(role, candidate.hex)
    setPicks(readPicks())
    if (v.ok) sfx.tap()
    else gateSfx.fail()
    setStatus({
      kind: 'verdict',
      ok: v.ok,
      name: candidate.name,
      ratio: v.ratio,
      /* the gate quotes the ground it actually judged by — for a mark that
         is whichever of paper/ink it separates from further */
      against: v.against,
      reasonKey: !v.ok
        ? role === 'accent'
          ? 'spec-sheet.build.reason.system'
          : 'spec-sheet.build.reason.marks'
        : role === 'accent'
          ? 'spec-sheet.build.reason.systemLive'
          : v.textRights
            ? 'spec-sheet.build.reason.textRights'
            : 'spec-sheet.build.reason.demoted',
    })
  }

  const reset = () => {
    clearBuild()
    setPicks({})
    setStatus({ kind: 'reset' })
    gateSfx.remove()
  }

  return (
    <div className={styles.builder}>
      <Copy k="spec-sheet.build.intro" as="p" className={styles.buildIntro} />
      <div className={styles.build}>
        {ROLES.map((r) => (
          <div key={r.id} className={styles.buildRow}>
            <span className={styles.buildRole}>
              <Copy k={r.labelKey} as="span" className={styles.buildRoleName} />
              <Copy k={r.hintKey} as="span" className={styles.buildRoleHint} />
            </span>
            <div
              className={styles.buildSwatches}
              role="group"
              aria-label={t(r.labelKey, skin)}
            >
              {PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className={styles.buildSwatch}
                  /* the only hardcoded hexes in the picker — see PALETTE */
                  style={{ background: c.hex }}
                  aria-pressed={picks[r.id] === c.hex}
                  aria-label={`${c.name} ${c.hex}`}
                  onClick={() => choose(r.id, c)}
                />
              ))}
            </div>
          </div>
        ))}
        <div className={styles.buildFoot}>
          <button
            type="button"
            className={styles.buildReset}
            onClick={reset}
            disabled={!picks.accent && !picks.expressive}
          >
            <Copy k="spec-sheet.build.reset" as="span" />
          </button>
          <p className={styles.buildStatus} aria-live="polite">
            {status === null ? (
              <Copy k="spec-sheet.build.idle" as="span" />
            ) : status.kind === 'reset' ? (
              <>
                <Copy
                  k="spec-sheet.build.reset"
                  as="span"
                  className={styles.verdictOk}
                />
                {' — '}
                <Copy k="spec-sheet.build.reason.reset" as="span" />
              </>
            ) : (
              <>
                <Copy
                  k={
                    status.ok
                      ? 'spec-sheet.build.applied'
                      : 'spec-sheet.build.refused'
                  }
                  as="span"
                  className={status.ok ? styles.verdictOk : styles.verdictNo}
                />
                {' — '}
                <span className={styles.statusName}>{status.name}</span>{' '}
                <span className={styles.statusRatio}>
                  {status.ratio.toFixed(1)}:1
                </span>{' '}
                <Copy
                  k={
                    status.against === 'paper'
                      ? 'spec-sheet.build.againstPaper'
                      : 'spec-sheet.build.againstInk'
                  }
                  as="span"
                />
                {' · '}
                <Copy k={status.reasonKey} as="span" />
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
