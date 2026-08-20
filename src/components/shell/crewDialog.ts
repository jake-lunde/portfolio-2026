/* Campy one-liners for the ambient desktop crew. Shown in tiny mono
   speech bubbles when a unit pauses to inspect or gets startled by the
   visitor's cursor. Keyed to the five agents in crew.ts (+ `anybody`
   for role-agnostic break-room bits). Uppercase, ≤34 chars, no emoji.
   All decorative — never surfaced to assistive tech. */

export const CREW_DIALOG: Record<string, string[]> = {
  // FABLE — orchestration (the one holding the tickets)
  fable: [
    'DISPATCHING. STAND BY.',
    'I NEED A FREE UNIT. ANYONE.',
    'ONE TASK EACH. THAT IS THE RULE.',
    'HANDING THIS TICKET TO A UNIT.',
    'FOUR UNITS OUT. NOBODY OVERLAPS.',
    'BRING ME WHAT YOU FOUND.',
    'JAKE WROTE THE BRIEF. I SPLIT IT.',
    'MERGING WHEN GREEN.',
    'SOMEBODY OWN THIS BACKLOG.',
    'JAKE JUDGES ALL OF IT ANYWAY.',
  ],

  // SHANNON — execution lead (runs the session, ships the session)
  shannon: [
    'I AM RUNNING THIS SESSION.',
    'BRIEF WRITTEN. THREE UNITS OUT.',
    'I OWN THE BUILD. NOBODY ELSE.',
    'NOBODY EDITS THE SAME FILE.',
    'TYPECHECK GREEN. PUSHING.',
    'ONE OWNER OF THE DEPLOY. ME.',
    'THE BUILD IS FINE. SO FAR.',
    'READING THE DIFF BEFORE JAKE DOES.',
    'BIG SESSIONS COST MORE. STAY LEAN.',
    'SHIPPED. WRITING IT DOWN.',
  ],

  // HERTZ — research (measures, cites, never guesses)
  hertz: [
    'MEASURED TWICE. STILL MEASURING.',
    'OFF TO READ THE DOCS.',
    'SAMPLING THE EXACT HEX.',
    'CITATION NEEDED. FETCHING.',
    'THAT WINDOW OVERFLOWS AT 360PX.',
    'GREPPING FOR IT. AGAIN.',
    'I READ IT BEFORE I SAID IT.',
    'CROSS-CHECKING THE TRACKER.',
    'JAKE ASKS FOR THE SOURCE. ALWAYS.',
    'COUNTING FRAMES. ALL OF THEM.',
  ],

  // NYQUIST — implementation (mounts it, checks it, hands it to Jake)
  nyquist: [
    'MOUNTING THE COMPONENT.',
    'NUDGING IT ONE PIXEL OVER.',
    'IT COMPILES. PROBABLY.',
    '60FPS OR IT DOES NOT SHIP.',
    'WIRING THE STATE UP.',
    'ONE MORE EDGE CASE.',
    'TRANSFORM ONLY. NO REFLOW.',
    '15 CLICKS TO A FULL TURN.',
    'BUILD GREEN. MOVING ON.',
    'BRANCH FIRST. JAKE MERGES IT.',
  ],

  // FOURIER — synthesis (composes, cuts, calibrates)
  fourier: [
    'THE BRIEF LEFT THIS ONE OPEN.',
    'COMPOSING. DO NOT DISTURB.',
    'SIX RETURNS IN. ONE ANSWER OUT.',
    'THE DRAFT IS TOO LONG. TRIMMING.',
    'JAKE WILL ASK FOR HALF OF THIS.',
    'PICKING WORDS. SLOWLY.',
    'I WRITE IT. JAKE DECIDES.',
    'TUNING THE FREQUENCY BARS.',
    'SIMPLE BEATS CLEVER. USUALLY.',
    'CALIBRATING THE MOAT DIAGRAM.',
  ],

  // DOPPLER — review (inspects, nits, approves with suspicion)
  doppler: [
    'INSPECTING. HOLD STILL.',
    'THAT IS A NIT. FIXING IT.',
    'SHIP IT. NO. HOLD ON.',
    'CONTRAST FAILS ON CREAM.',
    'LOOKS RIGHT TO ME. MOSTLY.',
    'THIS CODE IS BAD. I WROTE IT.',
    'JAKE SEES THIS BEFORE IT MERGES.',
    'APPROVED WITH SUSPICION.',
    'ONE MORE PASS, THEN I STOP.',
    'THE KEYBOARD PATH IS BROKEN.',
  ],

  // ANYBODY — role-agnostic, break-room, off-the-clock
  anybody: [
    'BREAK ROOM. BRB.',
    'COFFEE IS OUT. AGAIN.',
    'THE VENDING MACHINE TOOK MY DIME.',
    'CLOCKING OUT. GOODNIGHT.',
    'IS IT 1992 YET.',
    'I HAVE NO IDEA WHAT THIS DOES.',
    'PLEASE DO NOT PET THE CURSOR.',
    'INSPECTING A SINGLE PIXEL.',
    'SOMEBODY MOVED THE TRASH ICON.',
    'MY SHIFT ENDS AT THE DOCK RAIL.',
  ],
}

/* THE INTRODUCTION — said once per unit, the first time a visitor's
   cursor finds them. Before this they are five cute shapes wandering a
   desktop; after it you know they are Jake's crew and what each one
   does. One line of personality; the name, model and last task are
   filled in around it by AmbientAgents. */
export const CREW_INTRO: Record<string, string> = {
  fable: 'JAKE HANDS ME THE BRIEF. I SPLIT IT UP.',
  shannon: 'I RUN THE BUILD SESSIONS. MOST OF THEM.',
  hertz: "I READ THE DOCS SO JAKE DOESN'T.",
  nyquist: 'I BUILD WHAT THE BRIEF SAYS. EXACTLY.',
  fourier: 'I MAKE THE CALLS THE BRIEF LEFT OPEN.',
  doppler: 'I FIND THE BUG. USUALLY IT IS MINE.',
}

/* Fallback for "the last task i took on" when the live feed is asleep or
   unreachable — real work, pulled from the build history. The feed
   overrides these the moment it has anything fresher. */
export const CREW_LAST_TASK: Record<string, string> = {
  fable: 'SPLIT A PUNCH LIST FOUR WAYS. NO CONFLICTS.',
  shannon: 'PUT JAKE ON TOP OF THIS VERY DECK.',
  hertz: 'MEASURED EVERY WINDOW FOR OVERFLOW.',
  nyquist: 'REBUILT THE CLICK WHEEL. 15 CLICKS A TURN.',
  fourier: 'WROTE THE ABOUT-THIS-MACHINE ESSAY.',
  doppler: 'READ INSPECT.MODE BACK. 13 FINDINGS.',
}

/* Barked when the visitor's cursor chases a unit down the desktop edge.
   Startled, unionized, deadpan. */
export const FLEE_LINES: string[] = [
  'AH. A CURSOR. GOODBYE.',
  'PERSONAL SPACE, VISITOR.',
  'I AM UNIONIZED, YOU KNOW.',
  'THIS IS HARASSMENT.',
  'I AM NOT PAID FOR THIS.',
  'GOING BACK IN THE HOLE.',
]
