#!/usr/bin/env bash
# Idempotent environment setup for 3gp (also run by the Claude Code
# SessionStart hook). Never fails the session: each step is best-effort.
cd "$(dirname "$0")/.." || exit 0

if [ ! -d node_modules ]; then
  echo "[3gp] installing npm dependencies…"
  npm ci --no-audit --no-fund >/dev/null 2>&1 || echo "[3gp] npm ci failed — run it manually"
fi

if [ ! -d .claude/skills/remotion-best-practices ]; then
  echo "[3gp] installing official Remotion agent skills…"
  npx -y skills add remotion-dev/skills -a claude-code -s '*' -y --copy >/dev/null 2>&1 \
    || echo "[3gp] could not install Remotion skills (offline?) — run: npm run skills"
fi

exit 0
