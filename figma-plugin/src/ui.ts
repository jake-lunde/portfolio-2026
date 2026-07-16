/* TOKEN BRIDGE — UI iframe logic.
 *
 * The UI never sees the PAT that is already stored: it only receives a
 * `hasPat` boolean. It sends a new PAT to the sandbox on Save; the sandbox
 * owns all network + storage. Messages cross via the standard Figma bridge.
 */

type FromPlugin =
  | { type: 'settings'; repo: string; branch: string; hasPat: boolean }
  | { type: 'log'; level: 'info' | 'ok' | 'warn' | 'error'; message: string }

function $(id: string): HTMLElement {
  const el = document.getElementById(id)
  if (!el) throw new Error(`missing #${id}`)
  return el
}

const patInput = $('pat') as HTMLInputElement
const repoInput = $('repo') as HTMLInputElement
const branchInput = $('branch') as HTMLInputElement
const logEl = $('log')

function post(message: unknown): void {
  parent.postMessage({ pluginMessage: message }, '*')
}

function appendLog(level: string, text: string): void {
  const line = document.createElement('div')
  line.className = `l-${level}`
  const stamp = new Date().toLocaleTimeString([], { hour12: false })
  line.textContent = `${stamp}  ${text}`
  logEl.appendChild(line)
  logEl.scrollTop = logEl.scrollHeight
}

$('save').addEventListener('click', () => {
  post({
    type: 'save-settings',
    pat: patInput.value,
    repo: repoInput.value,
    branch: branchInput.value,
  })
  patInput.value = '' // don't retain the secret in the DOM after handing it off
})

$('pull').addEventListener('click', () => post({ type: 'pull' }))
$('push').addEventListener('click', () => post({ type: 'push' }))

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage as FromPlugin | undefined
  if (!msg) return
  if (msg.type === 'settings') {
    repoInput.value = msg.repo
    branchInput.value = msg.branch
    patInput.placeholder = msg.hasPat
      ? 'token saved — leave blank to keep it'
      : 'github_pat_… (stored locally, never shown)'
  } else if (msg.type === 'log') {
    appendLog(msg.level, msg.message)
  }
}

post({ type: 'ui-ready' })
