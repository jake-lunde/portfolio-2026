#!/usr/bin/env node
/* PHONE PROBE — drives a case study at 393×852 in a real browser and
   measures what a reader on an iPhone would actually see. Run it BY HAND
   before a case-study PR and paste its output into the PR body. It is
   not a CI gate: the repo's harness is pure `node --test` with no DOM,
   and a browser dependency is not worth adding for one route.
   (Testing decision, s140 spec — "spec, family hub on mobile".)
   Never reads component state; every check is a measurement off the
   rendered page, the way the s139 audit took them.

     node scripts/phone-probe.mjs            # chromium (headless shell)
     node scripts/phone-probe.mjs webkit     # Safari's engine — no
                                             # scroll anchoring, which is
                                             # the whole point of check D
     PORT=3210 node scripts/phone-probe.mjs
     ROUTE=/projects/greenlight-invest node scripts/phone-probe.mjs

   No new dependency: it borrows the cached playwright-core npx dropped
   (override with PW_DIR) and the browsers in ~/Library/Caches/ms-playwright.
   The two do not have to be the same vintage for chromium — CDP tolerates
   the gap — but WebKit's protocol does not: a core whose browsers.json
   names a webkit revision the cache doesn't hold dies on "Unknown
   setting". Match them (cache webkit-2182 = playwright-core 1.53.2) via
   PW_DIR, or fetch the build the default core wants. */

import { createRequire } from 'node:module'

const PW_DIR =
  process.env.PW_DIR || '/Users/jake/.npm/_npx/e058441c325e062a/node_modules/playwright-core'
const require = createRequire(PW_DIR + '/package.json')
const pw = require(PW_DIR)

/* the cached browsers are whatever `npx playwright` last pulled, and
   playwright-core asks for the build number IT was published with — so
   point it at what is actually on disk instead of downloading a second
   copy. Override either path if the cache moves. */
const BROWSERS = process.env.PW_BROWSERS || `${process.env.HOME}/Library/Caches/ms-playwright`
const EXE = {
  chromium: process.env.PW_CHROMIUM || `${BROWSERS}/chromium_headless_shell-1178/chrome-mac/headless_shell`,
  webkit: process.env.PW_WEBKIT || `${BROWSERS}/webkit-2182/pw_run.sh`,
}

const engine = process.argv[2] || 'chromium'
const port = process.env.PORT || '3000'
const route = process.env.ROUTE || '/projects/family-hub'
const url = `http://localhost:${port}${route}`

const VW = 393
const VH = 852
/* the window's own scroller, the fidelity rocker in the window bar, and
   the deck's horizontal strip — the one thing allowed to be wider than
   the phone, because scrolling sideways is its job */
const BODY = '[class*="windowBody"]'
const SWITCH = 'button[role="switch"]'
const DECK = '[class*="deckScroll"]'

const results = []
const check = (id, name, pass, detail) => {
  results.push({ id, name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${name} — ${detail}`)
}
/* not every case carries every surface — greenlight-invest has no spec
   sheet, no survey chart and no fidelity switch. A check with nothing to
   measure is skipped, never failed. */
const skip = (id, name, why) => {
  results.push({ id, name, skipped: true, detail: why })
  console.log(`SKIP  ${id}  ${name} — ${why}`)
}

const browser = await pw[engine].launch({ executablePath: EXE[engine] })
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  deviceScaleFactor: 2,
  isMobile: engine === 'chromium' ? true : undefined,
  hasTouch: true,
})
/* every case but family-hub is behind the sphere (cases.ts `gated`), and
   the probe measures layout, not clearance — so hand it the session
   token the sphere would have written and go straight to the article */
await ctx.addInitScript(() => {
  try {
    sessionStorage.setItem('lunde-gate', '1')
  } catch {}
})

const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 160))
})

console.log(`\nphone-probe · ${engine} · ${VW}×${VH} · ${url}\n`)

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForSelector('article', { timeout: 45000 })
/* the shell hydrates, the window opens, the programs code-split in —
   4s is what the s139 audit needed before measurements settled */
await page.waitForTimeout(4000)

/* ---- G. the chart is never blank — measured FIRST, before anything
   scrolls it into view, so a bar that only fills when an observer fires
   would be caught here ---- */
const barW = await page.$$eval('[class*="surveyBar"]', (els) =>
  els.map((el) => Math.round(el.getBoundingClientRect().width)),
)
if (!barW.length) skip('G', 'chart bars have width without being scrolled to', 'no survey chart on this route')
else
  check(
    'G',
    'chart bars have width without being scrolled to',
    barW.every((w) => w > 0),
    `${barW.length} bars, widths ${barW.join(' / ')}px`,
  )

/* ---- A. nothing in the article is wider than the phone ---- */
const wide = await page.$$eval(
  'article *',
  (els, [vw, deck]) =>
    els
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.right > vw + 1 && !el.closest(deck)
      })
      .slice(0, 8)
      .map((el) => {
        const r = el.getBoundingClientRect()
        const cls = (el.className.baseVal ?? el.className).toString().slice(0, 34)
        return `${el.tagName.toLowerCase()}.${cls}@${Math.round(r.right)}`
      }),
  [VW, DECK],
)
check('A', 'no article descendant overflows the viewport', wide.length === 0, wide.length ? wide.join(', ') : `nothing past ${VW}px`)

/* ---- B. spec-sheet keys are one line of their own font ---- */
const keys = await page.$$eval('[class*="ledgerKey"]', (els) =>
  els.map((el) => {
    const fs = parseFloat(getComputedStyle(el).fontSize)
    return { h: Math.round(el.getBoundingClientRect().height * 10) / 10, fs, cap: 1.6 * fs }
  }),
)
const tallKeys = keys.filter((k) => k.h > k.cap)
if (!keys.length) skip('B', 'every spec-sheet key is one line tall', 'no spec sheet on this route')
else
  check(
    'B',
    'every spec-sheet key is one line tall',
    tallKeys.length === 0,
    `${keys.length} keys, tallest ${Math.max(...keys.map((k) => k.h))}px, cap ${Math.round(keys[0].cap * 10) / 10}px (1.6 × ${keys[0].fs}px)`,
  )

/* ---- E. the chart's label is the case's label size (the spec sheet's
   own key is the reference — same role, same size) ---- */
const sizes = await page
  .evaluate(() => {
    const label = document.querySelector('[class*="surveyLabel"]')
    const key = document.querySelector('[class*="ledgerKey"]')
    if (!label || !key) return null
    return {
      label: getComputedStyle(label).fontSize,
      pct: getComputedStyle(document.querySelector('[class*="surveyPct"]')).fontSize,
      key: getComputedStyle(key).fontSize,
    }
  })
  .catch(() => null)
if (!sizes) skip('E', 'chart label sits at the case label size', 'no chart and spec sheet to compare on this route')
else
  check(
    'E',
    'chart label sits at the case label size',
    sizes.label === sizes.key && sizes.pct === sizes.key,
    `label ${sizes.label} · figure ${sizes.pct} · spec-sheet key ${sizes.key}`,
  )

/* ---- F. tapping a bar never changes the chart plate's height ---- */
const PLATE = '[class*="survey"] >> xpath=ancestor::*[contains(@class,"plate")]'
const plateH = async () => page.$eval(PLATE, (el) => Math.round(el.getBoundingClientRect().height))
let fBefore = null
let fAfter = null
if (await page.$('[class*="surveyRow"]')) {
  await page.$eval('[class*="surveyRow"]', (el) => el.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(1200)
  fBefore = await plateH()
  await page.tap('[class*="surveyRow"] >> nth=0')
  await page.waitForTimeout(500)
  fAfter = await plateH()
}
if (fBefore === null) skip('F', 'chart plate holds its height when a bar is tapped', 'no survey chart on this route')
else check('F', 'chart plate holds its height when a bar is tapped', fBefore === fAfter, `${fBefore}px → ${fAfter}px`)

/* ---- C + D. the fidelity flip moves nothing: the hero's stage keeps
   one height, and so does the whole document ---- */
const heroH = () => page.$eval('[class*="heroArt"]', (el) => Math.round(el.getBoundingClientRect().height)).catch(() => null)
const docH = () => page.$eval(BODY, (el) => el.scrollHeight)

if (!(await page.$(SWITCH))) {
  skip('C', 'hero art keeps one height on both faces', 'no fidelity switch on this route')
  skip('D', 'the scroller keeps one height on both faces', 'no fidelity switch on this route')
} else {
  await page.$eval(BODY, (el) => {
    el.scrollTop = 0
  })
  await page.waitForTimeout(800)
  const heroDraft = await heroH()
  const docDraft = await docH()
  await page.tap(SWITCH)
  await page.waitForTimeout(900)
  const heroShipped = await heroH()
  const docShipped = await docH()

  if (heroDraft === null) skip('C', 'hero art keeps one height on both faces', 'no hero art on this route')
  else check('C', 'hero art keeps one height on both faces', heroDraft === heroShipped, `draft ${heroDraft}px · shipped ${heroShipped}px`)
  check('D', 'the scroller keeps one height on both faces', docDraft === docShipped, `draft ${docDraft}px · shipped ${docShipped}px`)
}

if (errors.length) console.log(`\nconsole/page errors: ${errors.slice(0, 5).join(' | ')}`)

const failed = results.filter((r) => !r.skipped && !r.pass)
const ran = results.filter((r) => !r.skipped)
const skipped = results.filter((r) => r.skipped)
console.log(
  `\n${engine} · ${route}: ${ran.length - failed.length}/${ran.length} checks passed` +
    `${skipped.length ? `, ${skipped.length} skipped (${skipped.map((s) => s.id).join(', ')})` : ''}` +
    `${failed.length ? ` — failing ${failed.map((f) => f.id).join(', ')}` : ''}\n`,
)

await browser.close()
process.exit(failed.length ? 1 : 0)
