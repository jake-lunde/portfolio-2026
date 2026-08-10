/* The five cards and their authored answers. Written by Claude (Fable 5) —
   the same model behind the live composer — from Jake's 2024/2025 reviews,
   the Invest user research, and three days inside this design system.
   Long-form persona content stays in TS, not copy.json (roasts.ts precedent). */

export type CardDef = {
  id: string
  eyebrow: string   // mono category label, CAPS
  prompt: string    // visitor-voice question, sentence case
  answer: string    // Claude's authored answer, prose
}

export const CARDS: CardDef[] = [
  {
    id: 'coworkers',
    eyebrow: 'THE RECEIPTS',
    prompt: "What do Jake's coworkers say about him?",
    answer:
      "I'll quote them, because they said it better than I could. A peer called him \"a true experience architect\" who \"proactively leverages new technologies to prototype experiences, proving out concepts before committing to deep design cycles.\" Another noted him \"even jumping into the code himself… high-fidelity prototypes, smart AI integrations, smooth animations.\" My favorite is the arc: in 2024 his manager told him to develop coding and prototyping skills. In 2025, when engineering said an industry-standard scrubbing interaction was too hard, he got repo access, learned the tools, and shipped it himself in SwiftUI — the first haptics in the app. Reviews rarely document a gap closing that cleanly.",
  },
  {
    id: 'individual',
    eyebrow: 'THE INDIVIDUAL',
    prompt: 'Who is Jake outside the work?',
    answer:
      "You can read him off this desktop. The first 3D model on the site isn't a product mockup — it's flowers his wife grew, scanned and rebuilt at 1,970 faces. The daily tracker knows when the dog gets her pills. Taylor's name is on his arm in a banner, in the coloring book, forever. He collects American traditional tattoos because the form is honest — bold lines, no hedging — and he remixes pop songs because he loves them, not ironically. He builds monuments to small domestic things, which tells you what he actually optimizes for. The personal isn't decoration here; it's the architecture.",
  },
  {
    id: 'craft',
    eyebrow: 'THE CRAFT',
    prompt: 'What is Jake actually good at?',
    answer:
      "Making complex systems decidable. In his user research, kids could finally explain a stock to their parents — one family said the product \"encouraged conversation.\" Making a complex system legible to a nine-year-old is the hardest information design there is, and it's the same move this site makes for hiring managers. Working beside him, what I can attest to is the feedback loop: his instinct for when something feels wrong — a scrub that doesn't tick, a window that opens without weight — is the fastest I've worked inside. He directs code the way a good engineer reviews it: by outcome, at the interaction level, with taste as the spec.",
  },
  {
    id: 'edit',
    eyebrow: 'THE EDIT',
    prompt: 'What does Jake need to improve?',
    answer:
      "He generates more than he can ship, and he knows it — a peer once wrote he could have explored \"60–75% as much\" and landed in the same place. The editing is where his discipline shows now, and honestly, I'd rather work with this failure mode than its opposite: you can cut from abundance; you can't cut your way to it. The mature version of his abundance is this site — many ideas, each cut to its simplest working form. Ask him about it. He'll tell you the same thing, which is the part that matters.",
  },
  {
    id: 'spark',
    eyebrow: 'THE SPARK',
    prompt: 'What excites Jake right now?',
    answer:
      "Directing machines like me. Not 'using AI' — everyone says that — but designing the systems agents work inside: the design law this codebase enforces, the token architecture I'm not allowed to break, the review gates his crew of agents report through. He dreaded updating his portfolio for years; new tools made it a joy, and you're standing in the result. Next on his desk: a 3D desk scene, more instruments in the music corner, and figuring out how design systems become something an agent can be handed, not just a human. If your team is working on that frontier, he will talk your ear off. Kindly.",
  },
]
