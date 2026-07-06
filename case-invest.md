# Greenlight Invest
### Making a company decidable — for a nine-year-old

**Role** Lead product designer  ·  **Partners** 1 PM, iOS/Android engineering, data science  ·  **Timeline** 2024–2025  ·  **Shipped** Production iOS interaction code (SwiftUI), AI-data components, a redesigned decision flow

---

A kid looked at the new stock screen — cleaner charts, better-formatted financials, everything we thought they wanted — and told us it was just numbers on a screen. They didn't know what the company was. They didn't know what to do with any of it. That was the first round of research, run with the children of Greenlight employees, and it quietly reset the whole project. We hadn't made investing *understandable*. We'd made a prettier balance sheet.

The old Invest was, in a word, undecidable. It read like a printout of a finance site: the facts of a company with no path from *I've heard of Nike* to *I'd like to own a piece of it.* For an adult that's a gap you can bridge with experience. For a nine-year-old it's a wall.

So the redesign stopped trying to present information and started trying to make a company **decidable**. Three moves.

**Know it.** A kid understands Nike because they wear the shoes. They have no idea what NVIDIA does — and neither do a lot of adults. So we generated a short, minute-long overview for every company in the S&P 500: what it makes, how it earns, why it matters to a life a kid actually lives — built from real financial filings and formatted like the stories they already watch all day. Suddenly NVIDIA isn't a ticker. It's the reason their games look the way they do.

**Size it up.** Owning a company means knowing who it's up against. The Economic Moat component puts the company at the center of three rings — closest rivals, competitors, and the threats further out — and lets a kid tap any one to learn why it sits where it does. Netflix at the center, Disney and Amazon beside it, Apple a ring out, Google and Comcast further still. It's a genuinely hard idea — competitive moats confuse grown investors — rendered as something you can read in a glance.

**Decide it — yourself.** This is where the constraint became the design. We are legally not allowed to give a child investment advice, and we didn't want to. So instead of telling a kid what to do, we taught them what to ask. A *Help me decide* button on every stock runs three questions — is this a leading company, will it keep growing and earning, is it worth buying right now — and hands the kid the pieces to answer each one: the P/E, what the bulls say, what the bears say. The product doesn't render a verdict. It reflects the kid's own reasoning back: *based on your answers, this might be worth considering* — or *this doesn't look like a fit, here's something closer to what you're into.* The compliance line we couldn't cross turned out to be the best thing that happened to the design. It forced the product to make a thinker instead of a follower.

Underneath all of this is the part I'm proudest of, because it's the part I was told couldn't be done. The interactive performance graph — press and hold, scrub across time, feel a haptic tick at each interval — came back from engineering as too hard to build. It's an industry-standard interaction; being told it was out of reach annoyed me enough to go build it. I paired with an engineer who gave me access to the real repo and a playground inside it, used the current generation of AI coding tools, and wrote the interaction in SwiftUI against our actual codebase, state by state, until it felt right. Most of that code shipped. It was the first haptic feedback anywhere in the app — and the first time the thing felt alive under my thumb.

That's the honest shape of how I work now. I wrote and shipped the interaction. I designed and specced the AI-data components — the Moat logic, the overview-video pipeline — that a data team and I generated at scale. Design and engineering stopped being a handoff and started being the same motion.

Not everything survived. The most ambitious idea, *Grows with You*, didn't ship. It would have read the whole picture of a young investor — their experience, their spending, their family's financial context — and leveled the entire interface up with them: the language, the data density, the complexity all rising as the kid grew into it. A real curriculum. We couldn't afford it in time or resources, so we made the hard call to index for the lowest common denominator instead — simple enough for everyone, on day one. I still believe in the adaptive version. But shipping the simple thing that works beats shipping the ambitious thing that doesn't, and knowing which is which is most of the job.

What it did was move the numbers. Kids exposed to the new detail screens placed a first trade at roughly three to four times the rate of those who weren't; views of the screens themselves climbed several-fold. But the outcome I keep is quieter than a metric. Investing used to be a kid alone with a screen they couldn't read. Now a parent asks *why this one* — and the kid can actually answer. One family put it plainly in testing: *it encouraged conversation.* That's the whole thing. We didn't teach a kid to buy a stock. We gave a family something to talk about.

---

*Artifacts: before/after detail screens · the haptic scrubbing interaction (recording) · Economic Moat component · S&P-500 overview videos · Help me decide flow · verbatim family research quotes.*
