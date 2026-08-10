'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSettings } from '@/store/settings'
import { CopyText } from '@/content/CopyText'
import { t } from '@/content/copy'
import { inspectElement, type Inspection } from '@/lib/inspect'
import styles from './inspectmode.module.css'

/* INSPECT.MODE — SYS-21. The system's read-only x-ray, and the one program
   whose subject is the rest of the desktop.

   Zero writes, zero auth: it arms a capture-phase pick, then reports which
   token custom properties style the chosen element, what they resolve to
   standing where it stands, what its fg/bg pair grades, and which named
   spring moves it. Modelled on EDIT.MODE (SYS-99) — same document
   delegation, same body data-attribute arming, same injected global style
   block, same bullet-proof teardown — because that shape is already proven
   against the shell's Escape handling and window churn.

   The reading engine is src/lib/inspect.ts. This file is a renderer and a
   set of listeners; nothing here computes a value. */

/* Global affordances for nodes outside this module's scope — the whole
   desktop is the subject, so the CSS cannot be a CSS module.

   The hover outline and the crosshair are gated on the armed body
   attribute. The PICKED outline deliberately is not: the pick survives
   disarming (that is the DevTools bargain — one click, then the result
   stays put while you use it), so its selector is bare and only unmount
   takes it away with the whole <style> node. */
const GLOBAL_CSS = `
  body[data-inspectmode="on"] *{
    cursor:crosshair !important;
  }
  body[data-inspectmode="on"] [data-inspect-self],
  body[data-inspectmode="on"] [data-inspect-self] *{
    cursor:auto !important;
  }
  body[data-inspectmode="on"] [data-inspect-hover]{
    outline:var(--border-width-strong) dashed var(--accent);
    outline-offset:2px;
  }
  [data-inspect-picked]{
    outline:var(--border-width-strong) solid var(--accent);
    outline-offset:2px;
  }
`

const NARROW = '(max-width: 720px)'

/** Strip every attribute this program stamps on the desktop. */
function scrub(attr: string) {
  for (const n of document.querySelectorAll<HTMLElement>(`[${attr}]`)) n.removeAttribute(attr)
}

export default function InspectMode() {
  const skin = useSettings((s) => s.skin)

  const [armed, setArmed] = useState(false)
  const [report, setReport] = useState<Inspection | null>(null)
  const [busy, setBusy] = useState(false) // EDIT.MODE holds the floor
  const [narrow, setNarrow] = useState(false)

  // the listeners are bound once and read these, so they never go stale
  const armedRef = useRef(false)
  const pickRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    armedRef.current = armed
  }, [armed])

  /* ---- read the current pick (or drop it if the DOM moved on) ---- */
  const refresh = useCallback(() => {
    const el = pickRef.current
    if (!el || !document.contains(el)) {
      pickRef.current = null
      setReport(null)
      return
    }
    setReport(inspectElement(el))
  }, [])

  const pick = useCallback((el: HTMLElement) => {
    scrub('data-inspect-picked')
    el.setAttribute('data-inspect-picked', '')
    pickRef.current = el
    setReport(inspectElement(el))
  }, [])

  /* ---- viewport: below the shell's own breakpoint a window goes
     full-bleed, so the panel would cover the thing it is inspecting ---- */
  useEffect(() => {
    const mq = window.matchMedia(NARROW)
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  /* ---- the pick itself: bound for the whole mounted life, because
     ALT+CLICK works whether or not SCAN is armed ---- */
  useEffect(() => {
    const exempt = (el: Element | null) =>
      !el || !!el.closest('[data-inspect-self]') || !!document.body.dataset.editmode

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (exempt(target) || !target) return
      if (!armedRef.current && !e.altKey) return
      // suppress the link/button underneath AND the browser's own alt-click
      e.preventDefault()
      e.stopPropagation()
      pick(target)
      // DevTools bargain: one pick, then stand down so the result is usable
      if (armedRef.current) setArmed(false)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !armedRef.current) return
      // stop the host Window's Escape-to-close from also firing
      e.preventDefault()
      e.stopPropagation()
      setArmed(false)
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [pick])

  /* ---- armed-only: the hover halo and the body flag ---- */
  useEffect(() => {
    if (!armed) return
    document.body.setAttribute('data-inspectmode', 'on')

    const onOver = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (!target || target.closest('[data-inspect-self]')) return
      target.setAttribute('data-inspect-hover', '')
    }
    const onOut = (e: Event) => {
      ;(e.target as HTMLElement | null)?.removeAttribute?.('data-inspect-hover')
    }

    document.addEventListener('pointerover', onOver, true)
    document.addEventListener('pointerout', onOut, true)
    return () => {
      document.removeEventListener('pointerover', onOver, true)
      document.removeEventListener('pointerout', onOut, true)
      document.body.removeAttribute('data-inspectmode')
      scrub('data-inspect-hover')
    }
  }, [armed])

  /* ---- a skin or theme flip swaps the whole token set, and SKIN
     BUILDER's inline overrides land on the root's style attribute: the
     current pick has to be re-read, not just re-rendered. (Same observer
     SPEC.SHEET runs — one pattern, one place to fix.) ---- */
  useEffect(() => {
    const obs = new MutationObserver(refresh)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-skin', 'style'],
    })
    return () => obs.disconnect()
  }, [refresh])

  /* ---- teardown: the desktop must not carry a single mark of ours ---- */
  useEffect(
    () => () => {
      document.body.removeAttribute('data-inspectmode')
      scrub('data-inspect-hover')
      scrub('data-inspect-picked')
      scrub('data-inspect-probe')
    },
    [],
  )

  const toggle = () => {
    if (armed) {
      setArmed(false)
      setBusy(false)
      return
    }
    if (document.body.dataset.editmode) {
      setBusy(true)
      return
    }
    setBusy(false)
    setArmed(true)
  }

  const springKey = report?.spring ? `inspect.spring.${report.spring.name}` : null

  return (
    <div className={styles.root} data-inspect-self="">
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      <CopyText k="inspect.eyebrow" as="p" className={styles.eyebrow} />

      <div className={styles.bar}>
        {narrow ? (
          <p className={styles.notice} role="status">
            <CopyText k="inspect.mobile" />
          </p>
        ) : (
          <>
            <button
              type="button"
              className={styles.scan}
              onClick={toggle}
              aria-pressed={armed}
              data-on={armed || undefined}
            >
              <CopyText k={armed ? 'inspect.stop' : 'inspect.scan'} />
            </button>
            <CopyText
              k={armed ? 'inspect.armed' : 'inspect.hint'}
              as="p"
              className={styles.hint}
            />
          </>
        )}
      </div>

      {busy && (
        <p className={styles.notice} role="status">
          <CopyText k="inspect.editbusy" />
        </p>
      )}

      <div className={styles.results} role="region" aria-label={t('inspect.region', skin)}>
        {!report ? (
          <p className={styles.empty}>
            <CopyText k="inspect.empty" />
          </p>
        ) : (
          <>
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

            {/* ---- LAYERS: outermost first, so it reads as a path down ---- */}
            <section className={styles.section}>
              <h3 className={styles.head}>
                <CopyText k="inspect.section.layers" />
              </h3>
              <div className={styles.chain}>
                {report.chain
                  .slice()
                  .reverse()
                  .map((entry, i) => {
                    const current = entry.el === pickRef.current
                    return (
                      <button
                        key={`${i}-${entry.label}`}
                        type="button"
                        className={styles.chip}
                        data-current={current || undefined}
                        aria-current={current ? 'true' : undefined}
                        onClick={() => pick(entry.el)}
                      >
                        {entry.label}
                      </button>
                    )
                  })}
              </div>
            </section>

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
                    <li key={row.property} className={styles.row}>
                      <span className={styles.prop}>{row.property}</span>
                      <ul className={styles.vars}>
                        {row.resolved.map((r) => {
                          // springs are core BY DESIGN — motion has no
                          // semantic tier, so they are not a violation
                          const rawCore = r.tier === 'core' && !r.varName.startsWith('--spring-')
                          return (
                            <li
                              key={r.varName}
                              className={styles.var}
                              data-warn={rawCore || undefined}
                            >
                              <span className={styles.varName}>{r.varName}</span>
                              <span className={styles.tier} data-tier={r.tier}>
                                {r.tier.toUpperCase()}
                              </span>
                              {r.hex && (
                                <span
                                  className={styles.swatch}
                                  style={{ background: r.hex }}
                                  aria-hidden="true"
                                />
                              )}
                              <span className={styles.value}>{r.value || '—'}</span>
                              {rawCore && (
                                <span className={styles.warnText}>
                                  <CopyText k="inspect.corewarn" />
                                </span>
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
                  <span className={styles.gradeChip} data-fail={report.colors.grade === 'FAIL' || undefined}>
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
                <div className={styles.chain}>
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
                </>
              ) : (
                <p className={styles.note}>
                  <CopyText k="inspect.nospring" />
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
