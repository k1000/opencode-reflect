#!/bin/bash
set -e

CONFIG_DIR="${HOME}/.config/opencode"

rm -f "$CONFIG_DIR/plugins/reflect.ts"
rm -f "$CONFIG_DIR/agents/reflect-"*.md
rm -f "$CONFIG_DIR/commands/reflect.md"

echo "Uninstalled. Restart OpenCode."
