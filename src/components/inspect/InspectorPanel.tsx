'use client'

import { useState } from 'react'
import { useSettings } from '@/store/settings'
import { t } from '@/content/copy'
import { CopyText } from '@/content/CopyText'
import type { Inspection } from '@/lib/inspect'
import { CANDIDATES, isNudged, nudge, overrides, reset, resetAll, wouldGrade } from '@/lib/tune'
import styles from './inspectShell.module.css'

/* INSPECTOR — the right dock. Everything the window version reported,
   minus the two things the mode itself replaced: the LAYERS chain (the
   left panel is a real tree now) and the SCAN button (the mode IS the
   scanner — there is nothing to arm).

   One thing is new, and it is the first time this program writes anything:
   a semantic COLOR role can be re-cast to a core primitive and previewed
   live across the whole desktop. The claim the site keeps making —
   one token source, everything downstream follows — is finally something
   a visitor can pull on rather than read about. The write is inline
   custom properties on <html>, it is never saved, it never survives the
   mode, and a banner says so the whole time (src/lib/tune.ts).

   The AA gate is deliberately NOT a refusal. SKIN BUILDER refuses, because
   there the visitor is publishing a skin into the shipped system. Here
   they are looking, so a failing pick previews and the candidate wears its
   own failing grade. Driver's seat, with the instrument lit red. */

export function InspectorPanel({
  report,
  openVar,
  setOpenVar,
  onRefresh,
}: {
  report: Inspection | null
  /** which candidate palette is open, keyed `property|--var` */
  openVar: string | null
  setOpenVar: (v: string | null) => void
  onRefresh: () => void
}) {
  const skin = useSettings((s) => s.skin)
  // tune.ts is module state, not a store — this is what re-reads it
  const [, bump] = useState(0)
  const live = overrides()
  const anyLive = Object.keys(live).length > 0

  const springKey = report?.spring ? `inspect.spring.${report.spring.name}` : null

  const after = () => {
    bump((n) => n + 1)
    onRefresh()
  }

  return (
    <>
      <h2 className={styles.panelHead}>
        <CopyText k="inspect.panel.inspector" />
      </h2>

      <div className={styles.panelBody}>
        {anyLive && (
          <div className={styles.preview} role="status">
            <CopyText k="inspect.preview" className={styles.previewText} />
            <button
              type="button"
              className={styles.resetAll}
              onClick={() => {
                resetAll()
                setOpenVar(null)
                after()
              }}
            >
              <CopyText k="inspect.resetall" />
            </button>
          </div>
        )}

        {!report ? (
          <div className={styles.emptyState}>
            <p className={styles.empty}>
              <CopyText k="inspect.empty" />
            </p>
            <CopyText k="inspect.hint" as="p" className={styles.hint} />
          </div>
        ) : (
          <div role="region" aria-label={t('inspect.region', skin)}>
            <div className={styles.ident}>
              <span className={styles.identLabel}>
                <CopyText k="inspect.ident" />
              </span>
              <span className={styles.identName}>{report.label}</span>
            </div>
            {report.reskinned && (
              <p className={styles.reskin}>
                <CopyText k="inspect.reskinned" />
              </p>
            )}

            {/* ---- TOKENS ---- */}
            <section className={styles.section}>
              <h3 className={styles.head}>
                <CopyText k="inspect.section.tokens" />
              </h3>
              {report.tokens.length === 0 ? (
                <p className={styles.note}>
                  <CopyText k="inspect.inherited" />
                </p>
              ) : (
                <ul className={styles.rows}>
                  {report.tokens.map((row) => (
                    <li key={row.property} className={styles.tokenRow}>
                      <span className={styles.prop}>{row.property}</span>
                      <ul className={styles.vars}>
                        {row.resolved.map((r) => {
                          // springs are core BY DESIGN — motion has no
                          // semantic tier, so they are not a violation
                          const rawCore = r.tier === 'core' && !r.varName.startsWith('--spring-')
                          // a semantic role that resolves to a colour is
                          // the one thing here that can be re-cast
                          const tunable = r.tier === 'semantic' && !!r.rgb
                          const key = `${row.property}|${r.varName}`
                          const open = openVar === key
                          const held = isNudged(r.varName)
                          return (
                            <li
                              key={r.varName}
                              className={styles.var}
                              data-warn={rawCore || undefined}
                              data-held={held || undefined}
                            >
                              <span className={styles.varName}>{r.varName}</span>
                              <span className={styles.tier} data-tier={r.tier}>
                                {r.tier.toUpperCase()}
                              </span>
                              {r.hex &&
                                (tunable ? (
                                  <button
                                    type="button"
                                    className={styles.swatchBtn}
                                    style={{ background: r.hex }}
                                    aria-expanded={open}
                                    aria-label={`${t('inspect.nudge', skin)} ${r.varName}`}
                                    onClick={() => setOpenVar(open ? null : key)}
                                  />
                                ) : (
                                  <span
                                    className={styles.swatch}
                                    style={{ background: r.hex }}
                                    aria-hidden="true"
                                  />
                                ))}
                              <span className={styles.value}>{r.value || '—'}</span>
                              {rawCore && (
                                <span className={styles.warnText}>
                                  <CopyText k="inspect.corewarn" />
                                </span>
                              )}

                              {open && (
                                <div
                                  className={styles.palette}
                                  role="group"
                                  aria-label={`${t('inspect.nudge', skin)} ${r.varName}`}
                                >
                                  {CANDIDATES.map((c) => {
                                    const would = wouldGrade(c.hex, row.property, report.colors)
                                    return (
                                      <button
                                        key={c.token}
                                        type="button"
                                        className={styles.candidate}
                                        data-fail={would?.fails || undefined}
                                        onClick={() => {
                                          nudge(r.varName, c.hex)
                                          after()
                                        }}
                                      >
                                        <span
                                          className={styles.swatch}
                                          style={{ background: c.hex }}
                                          aria-hidden="true"
                                        />
                                        <span className={styles.candidateName}>{c.token}</span>
                                        {would && (
                                          <span className={styles.candidateGrade}>
                                            {would.grade}
                                          </span>
                                        )}
                                      </button>
                                    )
                                  })}
                                  {held && (
                                    <button
                                      type="button"
                                      className={styles.candidate}
                                      data-reset=""
                                      onClick={() => {
                                        reset(r.varName)
                                        after()
                                      }}
                                    >
                                      <CopyText k="inspect.revert" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ---- CONTRAST ---- */}
            <section className={styles.section}>
              <h3 className={styles.head}>
                <CopyText k="inspect.section.contrast" />
              </h3>
              <div className={styles.contrast}>
                <span className={styles.pair}>
                  {report.colors.fgHex && (
                    <span
                      className={styles.swatch}
                      style={{ background: report.colors.fgHex }}
                      aria-hidden="true"
                    />
                  )}
                  <span className={styles.value}>{report.colors.fgHex ?? '—'}</span>
                </span>
                <CopyText k="inspect.on" className={styles.on} />
                <span className={styles.pair}>
                  {report.colors.bgHex && (
                    <span
                      className={styles.swatch}
                      style={{ background: report.colors.bgHex }}
                      aria-hidden="true"
                    />
                  )}
                  <span className={styles.value}>{report.colors.bgHex ?? '—'}</span>
                </span>
                {report.colors.ratio !== null && (
                  <span className={styles.ratio}>{report.colors.ratio.toFixed(2)}:1</span>
                )}
                {report.colors.grade && (
                  <span
                    className={styles.gradeChip}
                    data-fail={report.colors.grade === 'FAIL' || undefined}
                  >
                    {report.colors.grade}
                  </span>
                )}
              </div>
            </section>

            {/* ---- TYPE ---- */}
            <section className={styles.section}>
              <h3 className={styles.head}>
                <CopyText k="inspect.section.type" />
              </h3>
              <dl className={styles.facts}>
                <dt>family</dt>
                <dd>{report.type.family}</dd>
                <dt>size</dt>
                <dd>{report.type.size}</dd>
                <dt>weight</dt>
                <dd>{report.type.weight}</dd>
                <dt>tracking</dt>
                <dd>{report.type.tracking}</dd>
                <dt>leading</dt>
                <dd>{report.type.leading}</dd>
              </dl>
              {report.typeVars.length > 0 && (
                <div className={styles.chips}>
                  {report.typeVars.map((name) => (
                    <span key={name} className={styles.roleChip}>
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* ---- MOTION ---- */}
            <section className={styles.section}>
              <h3 className={styles.head}>
                <CopyText k="inspect.section.motion" />
              </h3>
              {report.spring && springKey ? (
                <>
                  <p className={styles.springLine}>
                    <span className={styles.springName}>{report.spring.name.toUpperCase()}</span>
                    <span className={styles.value}>
                      stiffness {report.spring.stiffness} · damping {report.spring.damping}
                      {report.spring.mass ? ` · mass ${report.spring.mass}` : ''}
                    </span>
                  </p>
                  <CopyText k={springKey} as="p" className={styles.note} />
                  {report.spring.inherited && (
                    <CopyText k="inspect.springvia" as="p" className={styles.note} />
                  )}
                </>
              ) : (
                <p className={styles.note}>
                  <CopyText k="inspect.nospring" />
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  )
}
