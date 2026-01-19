#!/bin/bash
set -e

CONFIG_DIR="${HOME}/.config/opencode"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$CONFIG_DIR/plugins" "$CONFIG_DIR/agents" "$CONFIG_DIR/commands"

backup_if_different() {
  local src="$1"
  local dest="$2"
  if [ -f "$dest" ]; then
    if ! diff -q "$src" "$dest" > /dev/null 2>&1; then
      cp "$dest" "$dest.backup"
      echo "Backed up: $dest -> $dest.backup"
    fi
  fi
  cp "$src" "$dest"
}

backup_if_different "$SCRIPT_DIR/plugins/reflect.ts" "$CONFIG_DIR/plugins/reflect.ts"

for f in "$SCRIPT_DIR"/agents/reflect-*.md; do
  backup_if_different "$f" "$CONFIG_DIR/agents/$(basename "$f")"
done

backup_if_different "$SCRIPT_DIR/commands/reflect.md" "$CONFIG_DIR/commands/reflect.md"

echo "Installed. Restart OpenCode."
