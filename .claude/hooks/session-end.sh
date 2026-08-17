#!/bin/bash
# SessionEnd hook — the fast path of the write-up safety net (CLAUDE.md §4.4,
# scripts/session-sweep.mjs). Reads the hook payload, drops the transcript
# path as a hint file, and kicks the launchd sweep so the work runs outside
# this hook's process group. Without the LaunchAgent it runs the sweep
# detached instead. Never blocks the session's exit; never prints.
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
STATE="${HOME}/.local/state/lunde-session-sweep"
mkdir -p "$STATE/ended"

TRANSCRIPT=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).transcript_path||"")}catch{}})' 2>/dev/null)
[ -n "$TRANSCRIPT" ] || exit 0
[ -f "$TRANSCRIPT" ] || exit 0

if launchctl print "gui/$(id -u)/com.jaique.session-sweep" >/dev/null 2>&1; then
  printf '%s\n' "$TRANSCRIPT" > "$STATE/ended/$(basename "$TRANSCRIPT" .jsonl)"
  launchctl kickstart "gui/$(id -u)/com.jaique.session-sweep" >/dev/null 2>&1
else
  nohup node scripts/session-sweep.mjs --transcript "$TRANSCRIPT" >> "$STATE/hook.log" 2>&1 &
fi
exit 0
