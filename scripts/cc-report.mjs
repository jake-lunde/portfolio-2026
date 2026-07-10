/* Report live orchestration events to COMMAND.CTR.
   Used by the orchestrating Claude session during real work:
     CC_FEED_KEY=xxx node scripts/cc-report.mjs dispatch fable hertz "MEASURE APPLE API LIMITS"
     CC_FEED_KEY=xxx node scripts/cc-report.mjs return hertz "" "NO TIMESTAMPS · CAP 50"
     CC_FEED_KEY=xxx node scripts/cc-report.mjs status nyquist "" "SECRET FEATURE" --redact
     CC_FEED_KEY=xxx node scripts/cc-report.mjs --reset          (clear the feed)
   RULE: anything sensitive gets --redact AND a bland label — the real
   text never leaves this machine; the site draws marker blackouts. */

const key = process.env.CC_FEED_KEY
if (!key) throw new Error('CC_FEED_KEY required')
const origin = process.env.CC_ORIGIN ?? 'https://lunde.co'

const args = process.argv.slice(2)
const body = { events: [], reset: false }

if (args.includes('--reset')) {
  body.reset = true
} else {
  const [action, agent, target, label] = args
  if (!action || !agent || label === undefined) {
    console.error('usage: cc-report.mjs <action> <agent> <target|""> <label> [--redact] | --reset')
    process.exit(1)
  }
  body.events.push({
    t: Math.floor(Date.now() / 1000) % 86400,
    agent,
    action,
    ...(target ? { target } : {}),
    label,
    ...(args.includes('--redact') ? { redact: true } : {}),
  })
}

const res = await fetch(`${origin}/api/cc-feed`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-cc-key': key },
  body: JSON.stringify(body),
  redirect: 'follow',
})
console.log(res.status, await res.text())
