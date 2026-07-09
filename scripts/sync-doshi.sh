#!/usr/bin/env bash
# One-way sync: this repo's skills → a consuming workspace's .claude/skills.
#
# Why this exists: Google Drive (and similar synced folders) won't sync
# symlinks to teammates' machines, so the shared workspace needs real files.
# This script copies them, and a marker file in each synced directory tells
# everyone the repo — not the workspace copy — is the source of truth.
#
# Usage:
#   scripts/sync-doshi.sh                 # uses $VALIDATION_OS_SYNC_TARGET
#   scripts/sync-doshi.sh /path/to/workspace
#
# Set the target once in scripts/../.sync-env (gitignored):
#   VALIDATION_OS_SYNC_TARGET="/path/to/Doshi All Staff"
#
# The target directory must contain (or will get) a .claude/skills/ dir.
# Only the directories listed in SYNCED are touched; workspace-private
# skills alongside them are left alone.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# shellcheck disable=SC1091
[ -f "$REPO_DIR/.sync-env" ] && source "$REPO_DIR/.sync-env"

TARGET="${1:-${VALIDATION_OS_SYNC_TARGET:-}}"
if [ -z "$TARGET" ]; then
  echo "error: no target. Pass a workspace path or set VALIDATION_OS_SYNC_TARGET in .sync-env" >&2
  exit 1
fi
if [ ! -d "$TARGET" ]; then
  echo "error: target does not exist: $TARGET" >&2
  exit 1
fi

DEST="$TARGET/.claude/skills"
mkdir -p "$DEST"

SYNCED=(assumptions experiment-design find-evidence meeting-prep decisions _shared)

echo "Syncing validation-os skills → $DEST"
for skill in "${SYNCED[@]}"; do
  src="$REPO_DIR/skills/$skill/"
  dst="$DEST/$skill/"
  rsync -a --delete --exclude '.DS_Store' "$src" "$dst"
  cat > "$dst/.SYNCED-FROM-VALIDATION-OS" <<EOF
DO NOT EDIT FILES IN THIS DIRECTORY.

This skill is synced one-way from the validation-os repo
(https://github.com/bfish1996/validation-os). Edits made here will be
overwritten by the next sync. Change the skill in the repo instead, then run
scripts/sync-doshi.sh.

Synced: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Commit: $(git -C "$REPO_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown")
EOF
  echo "  ✓ $skill"
done

# Connectors + config template ride along so the skills' relative references
# resolve inside the workspace too.
rsync -a --delete --exclude '.DS_Store' "$REPO_DIR/connectors/" "$DEST/_connectors/"
echo "  ✓ _connectors (connectors/ mirrored for reference resolution)"

echo "Done. $(git -C "$REPO_DIR" rev-parse --short HEAD 2>/dev/null || echo '?') → $DEST"
