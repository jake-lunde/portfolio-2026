/* CV build — src/content/resume.ts → public/jake-lunde-resume.pdf.
 *
 * The window and the PDF render from the SAME data (src/content/resume.ts),
 * so the recruiter's download can never drift from what the site shows.
 * Output is committed, same convention as tokens.generated.css; do not
 * hand-edit the PDF.
 *
 * Library choice: pdfkit, not @react-pdf/renderer (which docs/PLAN-CV-EXE.md
 * listed first). The layout is a single ATS column, so a React reconciler +
 * yoga-layout buys nothing, and pdfkit's built-in Helvetica means no font
 * embedding at all — which is both the ATS-safe face the plan asks for and
 * the reason the file lands ~10KB instead of ~400KB.
 *
 * ATS rules enforced here, all non-negotiable:
 *   single column · real selectable text (never text-as-image) · standard
 *   EXPERIENCE / SKILLS / EDUCATION headings · Helvetica · contact as plain
 *   text · no photo · one page.
 *
 * The build FAILS rather than silently shipping a bad artifact if the
 * content overflows page one or the file crosses 200KB.
 */
import { build } from 'esbuild'
import PDFDocument from 'pdfkit'
import { createWriteStream, promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const ROOT = process.cwd()
/* Variant support (.claude/skills/tailor-resume): --input <resume.ts>
 * --output <pdf>. Both default to the canonical paths, so the bare
 * `cv:build` invocation in predev/prebuild is byte-identical to before.
 * Tailored variants live under ref/applications/ and are never committed. */
const argv = process.argv.slice(2)
const flagValue = (name) => {
  const i = argv.indexOf(name)
  if (i === -1) return undefined
  const v = argv[i + 1]
  if (!v || v.startsWith('--')) throw new Error(`${name} needs a path argument`)
  return v
}
const INPUT = path.resolve(ROOT, flagValue('--input') ?? path.join('src', 'content', 'resume.ts'))
const OUT = path.resolve(ROOT, flagValue('--output') ?? path.join('public', 'jake-lunde-resume.pdf'))
const MAX_BYTES = 200 * 1024

/* resume.ts is TypeScript with no imports, so a bundle-less esbuild pass to a
 * temp .mjs is enough to import it. Keeps one source of truth instead of
 * duplicating the data in a .mjs the window can't read. */
async function loadResume() {
  const tmp = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'cv-')), 'resume.mjs')
  await build({
    entryPoints: [INPUT],
    outfile: tmp,
    format: 'esm',
    platform: 'node',
    bundle: false,
  })
  return import(`file://${tmp}`)
}

// ---- page geometry (US Letter, 0.75in margins) ----

const PAGE = { size: 'LETTER', margin: 54 }
const W = 612 - PAGE.margin * 2 // 504pt of usable column

// Type scale. Small, but the whole point is one page that stays readable.
const T = {
  name: 20,
  contact: 9.5,
  summary: 9.5,
  section: 9,
  roleTitle: 10.5,
  roleMeta: 9,
  bullet: 9.5,
  colophon: 8.5,
}

/* A section rule doubles as the ATS heading anchor — the text is what the
 * parser reads, the hairline is for the human. */
function section(doc, label) {
  doc.moveDown(0.85)
  doc
    .font('Helvetica-Bold')
    .fontSize(T.section)
    .fillColor('#000')
    /* x is EXPLICIT: pdfkit continues from wherever the previous block
       left doc.x, so an unanchored heading inherits the bullet indent
       (SKILLS floated 14pt) or the skills label column (EDUCATION floated
       88pt) — Jake caught it on the shipped PDF. */
    .text(label.toUpperCase(), PAGE.margin, doc.y, { characterSpacing: 1.2 })
  const y = doc.y + 3
  doc
    .moveTo(PAGE.margin, y)
    .lineTo(PAGE.margin + W, y)
    .lineWidth(0.75)
    .strokeColor('#000')
    .stroke()
  doc.y = y + 7
}

function role(doc, r) {
  // Title left, dates right, on one baseline: the shape every parser expects.
  const top = doc.y
  const titleLine = r.priorTitle ? `${r.title} (promoted from ${r.priorTitle})` : r.title
  doc
    .font('Helvetica-Bold')
    .fontSize(T.roleTitle)
    .text(titleLine, PAGE.margin, top, { width: W * 0.68, lineGap: 0 })
  const afterTitle = doc.y
  doc
    .font('Helvetica')
    .fontSize(T.roleMeta)
    .text(r.dates, PAGE.margin + W * 0.68, top + 1.5, { width: W * 0.32, align: 'right' })

  doc.y = afterTitle
  doc
    .font('Helvetica-Oblique')
    .fontSize(T.roleMeta)
    .text(`${r.org} · ${r.location}`, PAGE.margin, doc.y + 1)
  doc.moveDown(0.45)

  doc.font('Helvetica').fontSize(T.bullet).fillColor('#000')
  for (const b of r.bullets) {
    const y = doc.y
    doc.text('•', PAGE.margin + 2, y, { width: 10 })
    doc.text(b, PAGE.margin + 14, y, { width: W - 14, align: 'left', lineGap: 0.6 })
    doc.moveDown(0.32)
  }
  doc.moveDown(0.28)
}

async function main() {
  const R = await loadResume()

  const doc = new PDFDocument({
    ...PAGE,
    info: {
      Title: 'Jake Lunde — Resume',
      Author: R.CONTACT.name,
      Subject: 'Product designer who ships production code',
      Keywords: 'product design, design engineer, design systems, TypeScript, React',
      /* Fixed date: pdfkit stamps `new Date()` by default, which would make
       * every build byte-different and churn the committed file. */
      CreationDate: new Date('2026-01-01T00:00:00Z'),
    },
  })

  await fs.mkdir(path.dirname(OUT), { recursive: true })
  const stream = createWriteStream(OUT)
  doc.pipe(stream)

  // ---- header ----
  doc
    .font('Helvetica-Bold')
    .fontSize(T.name)
    .fillColor('#000')
    .text(R.CONTACT.name, { characterSpacing: 0.3 })
  doc.moveDown(0.28)
  doc
    .font('Helvetica')
    .fontSize(T.contact)
    .text([R.CONTACT.email, R.CONTACT.site, R.CONTACT.location].join('  ·  '))

  doc.moveDown(0.6)
  doc.font('Helvetica').fontSize(T.summary).text(R.SUMMARY, { width: W, lineGap: 0.8 })

  // ---- experience ----
  section(doc, 'Experience')
  for (const r of R.ROLES) role(doc, r)

  // ---- skills ----
  section(doc, 'Skills')
  doc.fontSize(T.bullet)
  // label column sized to the widest label, "Code Generation"
  for (const g of R.SKILLS) {
    const y = doc.y
    doc.font('Helvetica-Bold').text(`${g.label}`, PAGE.margin, y, { width: 88, continued: false })
    doc.font('Helvetica').text(g.items.join(' · '), PAGE.margin + 88, y, { width: W - 88 })
    doc.moveDown(0.3)
  }

  // ---- education ----
  section(doc, 'Education')
  for (const e of R.EDUCATION) {
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(T.bullet).text(e.school, PAGE.margin, y, { width: W * 0.7 })
    doc
      .font('Helvetica')
      .fontSize(T.roleMeta)
      .text(e.year, PAGE.margin + W * 0.7, y + 0.5, { width: W * 0.3, align: 'right' })
    doc.font('Helvetica').fontSize(T.roleMeta).text(e.degree, PAGE.margin, doc.y + 0.5)
  }

  doc.moveDown(0.9)
  doc
    .font('Helvetica-Oblique')
    .fontSize(T.colophon)
    .fillColor('#333')
    .text(R.COLOPHON, PAGE.margin, doc.y, { width: W })

  /* One page is the brief. pdfkit auto-paginates, so catching it here is the
   * difference between "shipped a two-page resume" and "build failed". */
  const pages = doc.bufferedPageRange().count
  const endY = doc.y

  doc.end()
  await new Promise((res, rej) => stream.on('finish', res).on('error', rej))

  const { size } = await fs.stat(OUT)
  const rel = path.relative(ROOT, OUT)

  if (pages > 1) {
    throw new Error(
      `CV overflowed to ${pages} pages. Trim a bullet in ${path.relative(ROOT, INPUT)} or drop the type scale in scripts/build-cv.mjs.`,
    )
  }
  if (size > MAX_BYTES) {
    throw new Error(`CV is ${(size / 1024).toFixed(1)}KB, over the ${MAX_BYTES / 1024}KB ATS budget.`)
  }

  const slack = (792 - PAGE.margin - endY).toFixed(0)
  console.log(`CV → ${rel}  ${(size / 1024).toFixed(1)}KB · 1 page · ${slack}pt slack at the foot`)
}

main().catch((err) => {
  console.error(`\nCV build failed: ${err.message}\n`)
  process.exit(1)
})
