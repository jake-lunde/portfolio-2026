import { Stamp } from '@/components/primitives/Stamp'
import { CopyText as Copy } from '@/content/CopyText'
import styles from './trash.module.css'

/* The Trash — open. Killed ideas, kept on file: what it was, why it died,
   what it taught. The reasons are the point — judgment about what NOT to
   build is the argument this window makes.

   Facts cross-checked against portfolio-tracker.md (Grows With You;
   TAG-03/04 anchor to the "AI Interaction Models" slide, 2025) and
   the team-library Figma (the Assistants — node 442:338964; Sidecar —
   node 452:339743); Jake approved TAG-01/02 to ship (s31). TAG-03/04
   sourced from Jake's dictated memos (Notion, s37) — ⚠️ cause/origin
   lines are drafted from context, not stated by him: his fact pass
   before ship.
   PARKED: another record, "The Installer" (the site's own killed
   progress-bar metaphor), rides with the unshipped leaf patch — restore
   it from branch leaf-patch (8934b21) as TAG-05 when the caterpillar
   ships (it was cut as TAG-03 there; renumber at revive).
   ADDING ONE: append to IDEAS. Keep the memo under ~60 words; the tag
   fields carry the weight. `tone: 'pink'` = expressive wash, ONE record
   max — reserved for the idea he'd still build. */

type KilledIdea = {
  no: string
  name: string
  origin: string
  memo: string
  cause: string
  lesson: string
  tone: 'paper' | 'pink'
}

const IDEAS: KilledIdea[] = [
  {
    no: 'TAG-01',
    name: 'Grows With You',
    origin: 'GREENLIGHT INVEST · 2024–25',
    memo: 'Read the whole picture of a young investor — their experience, their spending, their family’s financial context — and level the entire interface with them: language, data density, complexity, all rising as the kid grows into it. A real curriculum, not a settings toggle.',
    cause:
      'Couldn’t afford it in time or people. We indexed for the lowest common denominator instead — simple enough for everyone, on day one.',
    lesson:
      'Shipping the simple thing that works beats shipping the ambitious thing that doesn’t. Knowing which is which is most of the job.',
    tone: 'pink',
  },
  {
    no: 'TAG-02',
    name: 'The Assistants',
    origin: 'GREENLIGHT · UNSHIPPED CONCEPT',
    memo: 'A crew of animated domain agents for kids, one per job: Sprout for investing, Dusty for chores, Penny for saving, Buck for spending, Scout for alerts. Each with its own voice, its own quick actions, and a chat bar underneath. The fuzzy little guys were good.',
    cause:
      'Five characters is five personalities to write, animate, and keep true — a second product’s worth of care the roadmap didn’t have room for.',
    lesson:
      'A character is a promise. Don’t make five promises you can only keep one of.',
    tone: 'paper',
  },
  {
    no: 'TAG-03',
    name: 'The Groupchat Guide',
    origin: 'GREENLIGHT · PITCHED 2025',
    memo: 'Greenlight, minus the app: a digital nanny in the family thread that can anticipate, alert, answer, and act. Parents change limits and move money in plain language; kids get a financial guide that answers back; the group chat gets a scorekeeper posting drive scores and chore standings.',
    cause:
      'Built on a real finding — parents want a utility, we’d built them social media — but it asked Greenlight to move its front door into a channel it doesn’t own. Bigger than a feature, smaller than a mandate; it stayed a deck.',
    lesson:
      'Parents didn’t want another app; they wanted peace of mind. 97% of texts are read inside fifteen minutes — sometimes the best surface is the one you don’t build.',
    tone: 'paper',
  },
  {
    no: 'TAG-04',
    name: 'The AI Sidecar',
    origin: 'GREENLIGHT · AI INTERACTION MODELS, 2025',
    memo: 'A collapsible AI layer you can pull up over any screen. It reads what you’re looking at and talks about that: annotates the portfolio dip, softens the bad news, offers the next question before you’ve formed it. Context first, chat second — one pattern that works on every surface.',
    cause:
      'One of four interaction models explored for bringing AI into the family product. Only so many bets fit a roadmap; this one stayed on the slide.',
    lesson:
      'An assistant that already knows where you are skips the hardest part of the prompt. Context isn’t a feature of the chat — it’s the reason to open it.',
    tone: 'paper',
  },
]

export default function Trash() {
  return (
    <div className={styles.trash}>
      <div className={styles.head}>
        <Copy k="trash.eyebrow" as="p" className={styles.eyebrow} />
        <Copy k="trash.intro" as="p" className={styles.intro} />
      </div>

      <div className={styles.records} role="list">
        {IDEAS.map((idea) => (
          <article
            key={idea.no}
            className={styles.record}
            data-tone={idea.tone}
            role="listitem"
          >
            <header className={styles.recordHead}>
              <span className={styles.tagNo}>{idea.no}</span>
              <h3 className={styles.name}>{idea.name}</h3>
              <Stamp tone={idea.tone === 'pink' ? 'pink' : undefined}>
                <Copy k="trash.stamp" as="span" />
              </Stamp>
            </header>
            <p className={styles.origin}>{idea.origin}</p>
            <p className={styles.memo}>{idea.memo}</p>
            <div className={styles.field}>
              <Copy k="trash.field.cause" as="span" className={styles.fieldLabel} />
              <p className={styles.fieldText}>{idea.cause}</p>
            </div>
            <div className={styles.field}>
              <Copy k="trash.field.lesson" as="span" className={styles.fieldLabel} />
              <p className={styles.fieldText}>{idea.lesson}</p>
            </div>
          </article>
        ))}
      </div>

      <Copy k="trash.foot" as="p" className={styles.foot} />
    </div>
  )
}
