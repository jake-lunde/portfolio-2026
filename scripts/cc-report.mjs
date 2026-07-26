/* Report live orchestration events to COMMAND.CTR.
   Used by the orchestrating Claude session during real work.

   Positional (short form):
     CC_FEED_KEY=xxx node scripts/cc-report.mjs dispatch fable hertz "MEASURE APPLE API LIMITS"
     CC_FEED_KEY=xxx node scripts/cc-report.mjs return hertz "" "NO TIMESTAMPS · CAP 50"
     CC_FEED_KEY=xxx node scripts/cc-report.mjs status nyquist "" "SECRET FEATURE" --redact
   Named (unambiguous — prefer this):
     ... cc-report.mjs --action dispatch --agent fable --target hertz --task "SCAFFOLD SHELL"
     ... cc-report.mjs --action prompt --agent jake --task "MAKE THE WHEEL FEEL REAL"
     ... cc-report.mjs --reset          (clear the feed)

   RULE: anything sensitive gets --redact AND a bland label — the real
   text never leaves this machine; the site draws marker blackouts.

   The deck refuses to draw a unit it can't name, so this script refuses
   to send one: a mistyped call sign fails loudly here instead of
   printing "--AGENT · --task" on the live site for a week. Keep the
   roster in sync with src/components/shell/crew.ts. */

const key = process.env.CC_FEED_KEY
if (!key) throw new Error('CC_FEED_KEY required')
const origin = process.env.CC_ORIGIN ?? 'https://lunde.co'

const AGENTS = ['jake', 'fable', 'shannon', 'hertz', 'nyquist', 'fourier', 'doppler']
const ACTIONS = ['dispatch', 'status', 'return', 'review', 'merge', 'prompt', 'curate']

const args = process.argv.slice(2)
const body = { events: [], reset: false }

const die = (msg) => {
  console.error(`cc-report: ${msg}`)
  console.error('usage: cc-report.mjs <action> <agent> <target|""> <label> [--redact]')
  console.error('       cc-report.mjs --action A --agent B [--target C] --task "LABEL" [--redact]')
  console.error(`       actions: ${ACTIONS.join(' | ')}`)
  console.error(`       units:   ${AGENTS.join(' | ')}`)
  process.exit(1)
}

/** value of --flag (and its aliases), or undefined */
const flag = (...names) => {
  for (const n of names) {
    const i = args.indexOf(`--${n}`)
    if (i !== -1) return args[i + 1]
  }
  return undefined
}

if (args.includes('--reset')) {
  body.reset = true
} else {
  const named = args.some((a) => ['--action', '--agent', '--target', '--task', '--label'].includes(a))
  let action, agent, target, label
  if (named) {
    action = flag('action')
    agent = flag('agent')
    target = flag('target')
    label = flag('task', 'label')
  } else {
    ;[action, agent, target, label] = args
  }

  // a value that is itself a flag means the form got mixed up mid-command
  for (const [name, v] of [['action', action], ['agent', agent], ['target', target], ['label', label]]) {
    if (typeof v === 'string' && v.startsWith('--')) die(`${name} looks like a flag: "${v}"`)
  }

  if (!ACTIONS.includes(action)) die(`unknown action: ${action ?? '(missing)'}`)
  if (!AGENTS.includes(agent)) die(`unknown unit: ${agent ?? '(missing)'}`)
  if (target && !AGENTS.includes(target)) die(`unknown target: ${target}`)
  if (!label || !label.trim()) die('a label is required')

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
