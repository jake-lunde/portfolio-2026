/* Campy one-liners for the ambient desktop crew. Shown in tiny mono
   speech bubbles when a unit pauses to inspect or gets startled by the
   visitor's cursor. Keyed to the five agents in crew.ts (+ `anybody`
   for role-agnostic break-room bits). Uppercase, ≤34 chars, no emoji.
   All decorative — never surfaced to assistive tech. */

export const CREW_DIALOG: Record<string, string[]> = {
  // FABLE — orchestration (the one holding the tickets)
  fable: [
    'DISPATCHING. STAND BY.',
    'WHO IS FREE. ANYONE. HELLO.',
    'ONE TASK EACH. THAT IS THE RULE.',
    'ROUTING TICKET TO A UNIT.',
    'I DELEGATE, THEREFORE I AM.',
    'SYNC IN FIVE. BRING FINDINGS.',
    'THE PLAN IS THE PRODUCT.',
    'MERGING WHEN GREEN.',
    'SOMEBODY OWN THIS BACKLOG.',
    'NO FANNING OUT. FOCUS.',
  ],

  // HERTZ — research (measures, cites, never guesses)
  hertz: [
    'MEASURING TWICE. CUTTING NEVER.',
    'OFF TO READ THE DOCS.',
    'SAMPLING THE EXACT HEX.',
    'CITATION NEEDED. FETCHING.',
    '920.12 FT AND CLIMBING.',
    'GREPPING THE UNKNOWN.',
    'FACTS FIRST. VIBES LATER.',
    'CROSS-CHECKING THE TRACKER.',
    'NO SOURCE, NO SHIP.',
    'COUNTING FRAMES. ALL OF THEM.',
  ],

  // NYQUIST — implementation (mounts, ships, prays)
  nyquist: [
    'MOUNTING THE COMPONENT.',
    'PIXELS WONT KERN THEMSELVES.',
    'IT COMPILES. PROBABLY.',
    '60FPS OR IT DOES NOT SHIP.',
    'WIRING THE STATE UP.',
    'ONE MORE EDGE CASE.',
    'TRANSFORM ONLY. NO REFLOW.',
    'PUSH. DEPLOY. PRAY.',
    'BUILD GREEN. MOVING ON.',
    'SHIPPING TO MAIN. DUCK.',
  ],

  // FOURIER — synthesis (composes, cuts, calibrates)
  fourier: [
    'OFF TO CALIBRATE THE MOAT.',
    'COMPOSING. DO NOT DISTURB.',
    'SYNTHESIZING THE FINDINGS.',
    'EVERY WORD EARNS ITS SPACE.',
    'TLDR: IT IS BEAUTIFUL.',
    'FOLDING SIX INPUTS INTO ONE.',
    'THE PROSE CARRIES THE WORK.',
    'TUNING THE FREQUENCY BARS.',
    'RESTRAINT. SCALE. REPEAT.',
    'DRAFTING. THEN CUTTING HALF.',
  ],

  // DOPPLER — review (inspects, nits, approves with suspicion)
  doppler: [
    'INSPECTING. HOLD STILL.',
    'THAT IS A NIT. FIXING IT.',
    'SHIP IT. NO — WAIT.',
    'CONTRAST FAILS ON CREAM.',
    'LGTM. MOSTLY.',
    'WHO WROTE THIS. OH. ME.',
    'RINGS OUT: RIVALS, THREATS.',
    'APPROVED WITH SUSPICION.',
    'RE-READING THE DIFF AGAIN.',
    'EDGE CASE AT ARMS LENGTH.',
  ],

  // ANYBODY — role-agnostic, break-room, off-the-clock
  anybody: [
    'BREAK ROOM. BRB.',
    'COFFEE IS OUT. AGAIN.',
    'VENDING MACHINE ATE MY BYTE.',
    'CLOCKING OUT. GOODNIGHT.',
    'IS IT 1992 YET.',
    'THE WORK IS MYSTERIOUS.',
    'PLEASE DO NOT PET THE CURSOR.',
    'INSPECTING A SINGLE PIXEL.',
    'WHO MOVED THE TRASH ICON.',
    'MY SHIFT ENDS AT PIXEL 800.',
  ],
}

/* Barked when the visitor's cursor chases a unit down the desktop edge.
   Startled, unionized, deadpan. */
export const FLEE_LINES: string[] = [
  'AH. A CURSOR. GOODBYE.',
  'PERSONAL SPACE, VISITOR.',
  'I AM UNIONIZED, YOU KNOW.',
  'THIS IS HARASSMENT.',
  'NOT PAID FOR THIS.',
  'FLEEING. PROFESSIONALLY.',
]
