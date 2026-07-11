# CREW.md — delegation doctrine (living document)

> Started by Fable 5, 2026-07-11, at Jake's request: "how do we delegate more
> effectively — by skill or by goal? parts of one problem, or one problem
> each?" This file is the evolving answer. Orchestrators read it before
> dispatching; update it when a session teaches something. CLAUDE.md §13.5 is
> the *protocol* (always deck, delegate separable work); this is the *theory*.

## 1. What we've actually learned so far

Six sessions of orchestration on LUNDE OS. What held up:

- **The brief is the product.** Every successful dispatch (NYQUIST's
  leaderboard, FOURIER's SPEC.SHEET) came from a brief with three parts:
  exact file ownership, the conventions that aren't guessable (blob
  versioned-paths, two-accent law, "don't run builds"), and a definition of
  done (`tsc --noEmit` passes, report back X). Every correction we've had to
  make traces to something the brief left implicit.
- **File ownership is the real interface.** We've never had a merge conflict
  between agents — not because they're careful, but because briefs assign
  disjoint files. The one near-miss: two sessions both editing registry.tsx
  (orchestrator + FOURIER); solved by sequencing, and later by "FOURIER owns
  registry this turn."
- **Verification doesn't delegate.** Agents typecheck; only the orchestrator
  builds, previews, and ships (one owner of `.next`, one owner of the deploy).
  This is a hard rule born of corrupted builds, and it shapes everything:
  agent work must be *reviewable from the diff + a compile check*.
- **The protocol failure mode is silence, not error.** Session 5 (Opus solo):
  competent work, zero dispatches, dead deck. Nothing broke — that's the
  problem. A preference gets optimized away under "this is small"; only a
  protocol with an explicit escape hatch ("skip only if entangled, and say
  so") survives contact with a punch list.

## 2. Skill vs goal — the answer is task *shape*

Don't assign by "who is good at CSS" — every crew member knows CSS. Assign by
how much **judgment under ambiguity** the task needs:

| Shape | Signature | Send to |
| --- | --- | --- |
| **Closed** | Correct output is checkable from the brief alone (fix icon, wire API to pattern X, move widget) | Sonnet (NYQUIST/HERTZ) |
| **Open** | Brief specifies *intent*; the agent makes real design/content decisions (new program, writeup, synthesis) | Opus (FOURIER/DOPPLER) |
| **Taste** | Success = "does this feel like LUNDE OS" — reference images, motion feel, voice, anything Jake will react to aesthetically | Orchestrator, never delegated |
| **Vision** | Requires looking at photos/screenshots and judging fidelity | Orchestrator (tattoo pass taught this) |

Goal-based assignment ("NYQUIST owns the puzzle program") is tempting because
it builds pseudo-expertise, but agents have no memory between dispatches —
the "expertise" lives in the brief anyway. Shape-based routing is what
actually predicts quality.

## 3. One problem split, or one problem each?

**Default: each agent gets a whole, distinct problem.** Distinct problems
parallelize for free — no shared state, no interface to negotiate, returns
reviewable independently. (Session 4: NYQUIST got three whole small problems;
FOURIER got two whole programs. Zero coordination cost.)

**Split a single problem only when a clean seam already exists** — an API
contract, a component boundary, a data file. Then the seam goes *in the
brief* ("the route returns `{times: Record<id, Score[]>}`; you own the
consumer"). If you find yourself inventing a seam just to parallelize, stop:
the coordination tax (spec-writing + merge review + rework when the seam
leaks) exceeds doing it serially. A split without a seam is how you get two
half-solutions to review instead of one whole one.

Litmus: **could each agent's return ship alone?** If yes, split is safe. If
the returns only make sense together, one agent (or the orchestrator) should
own the whole thing.

## 4. The economics (when NOT to delegate)

An agent starts cold. Its cost = brief-writing + its own re-derivation of
context + your review of the return. Delegate when:

- the work is ≥ ~20 minutes of orchestrator attention, AND
- the brief writes itself from things you already know (paths, patterns), AND
- you have parallel work to do while it runs.

A 10-item punch list of one-line fixes fails test 1 item-by-item — but check
whether it *bundles* (session 4 bundled three into one NYQUIST dispatch and
it paid). Usage pressure (like today's 92%) legitimately tilts toward solo:
agents multiply tokens, and the deck can stay live with self-reports.

## 5. What the deck should visualize (COMMAND.CTR roadmap)

The current deck shows *events* (dispatch/status/return/merge). The doctrine
above suggests what's missing:

1. **Ownership lanes** — which files each unit holds, drawn as lanes; makes
   the no-conflict discipline visible and beautiful (very REDS-Explorer).
2. **Brief → return sizing** — a small bar pair per dispatch (brief tokens vs
   return tokens); the visual signature of a good delegation is a short brief
   and a fat return.
3. **Task-shape glyph** — closed/open/taste badge on each dispatch, so the
   replay teaches the routing table in §2.
4. **The escape-hatch log** — when an orchestrator skips delegation, that
   declaration ("entangled, going solo") becomes a deck event too. Honesty as
   telemetry. (Add a `solo` action to cc-report.)

## 6. Open questions for Jake

- Should DOPPLER (review) become a *standing* gate before every push, or stay
  on-demand? Cost says on-demand; rigor says standing.
- Do we want agents to write their own deck events (give them the key) or
  keep the orchestrator as the single reporter? Single reporter is truthful
  about *who verified what*; agent self-reporting is more alive.
- Naming: units are currently model-tiers with call signs. If models change
  under us, do call signs keep their *shape* meaning (NYQUIST = closed-task
  unit) rather than their model binding? I'd vote yes — shape is the stable
  abstraction.

— FABLE
