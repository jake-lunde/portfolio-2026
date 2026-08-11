#!/bin/bash
# SessionStart hook — makes CLAUDE.md §4.1 (live deck report) deterministic.
# stdout is injected into the session's context.
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

if [ -f .env.local ] && grep -q '^CC_FEED_KEY=' .env.local; then
  cat <<'EOF'
[hook: session-start] LUNDE OS §4.1 — the deck is live and this session is
unreported. Before build work, dispatch (fill in a real task label, caps,
--redact if sensitive):

  set -a; source .env.local; set +a; node scripts/cc-report.mjs dispatch fable "" "<TASK LABEL>"

`return`s as work lands, `merge` on ship. Pure Q&A sessions may skip.
EOF
else
  echo "[hook: session-start] CC_FEED_KEY not found in .env.local — deck reporting (CLAUDE.md §4.1) unavailable from this checkout; say so in the final reply."
fi
exit 0
