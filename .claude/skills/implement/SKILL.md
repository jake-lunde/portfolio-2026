---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

TDD is parked in this repo (Jake's ruling, 2026-08-29): no test runner is installed and `tsc` is the only gate. Do not reach for /tdd; if a ticket is logic-heavy enough that test-first would genuinely earn its keep, raise that with Jake instead of adopting it silently.

Run `npx tsc --noEmit` regularly, and honor the checkout/build law in HANDOFF.md (never run `npm run build` while the dev server holds `.next`).

Once done, use /code-review to review the work.

Commit your work to the current branch.
