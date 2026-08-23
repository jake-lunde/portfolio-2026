import { Stamp } from '@/components/primitives/Stamp'
import { CopyText as Copy } from '@/content/CopyText'
import ExhibitStack from './ExhibitStack'
import RecoveredPhone from './RecoveredPhone'
import styles from './trash.module.css'

/* The Trash — open. Killed ideas, kept on file: what it was, why it died,
   what it taught. The reasons are the point — judgment about what NOT to
   build is the argument this window makes.

   Each record carries its evidence (s95): Levels gets the presentation
   deck as a pile of exhibit photos, the Assistants gets the recording
   still running on a phone. Both sit between the memo and the findings.

   Facts cross-checked against portfolio-tracker.md (Levels — renamed
   from "Grows With You", Jake's call, s95) and the team-library Figma
   (the Assistants — node 442:338964); Jake approved the copy to ship
   (s31).
   PARKED: a third record, "The Installer" (the site's own killed
   progress-bar metaphor), rides with the unshipped leaf patch — restore
   it from branch leaf-patch (8934b21) when the caterpillar ships.
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
  media?: 'exhibits' | 'device'
}

const IDEAS: KilledIdea[] = [
  {
    no: 'TAG-01',
    name: 'Levels',
    origin: 'GREENLIGHT INVEST · 2024–25',
    memo: 'Read the whole picture of a young investor — their experience, their spending, their family’s financial context — and level the entire interface with them: language, data density, complexity, all rising as the kid grows into it. A real curriculum, not a settings toggle.',
    cause:
      'Couldn’t afford it in time or people. We indexed for the lowest common denominator instead — simple enough for everyone, on day one.',
    lesson:
      'Shipping the simple thing that works beats shipping the ambitious thing that doesn’t. Knowing which is which is most of the job.',
    tone: 'pink',
    media: 'exhibits',
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
    media: 'device',
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
            {idea.media === 'exhibits' && <ExhibitStack />}
            {idea.media === 'device' && <RecoveredPhone />}
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
