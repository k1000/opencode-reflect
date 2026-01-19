#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "========================================"
echo "  OpenCode Reflect Test Suite"
echo "========================================"

echo ""
echo "[1/3] Install/Uninstall Tests"
echo "----------------------------------------"
./test/install.test.sh

echo ""
echo "[2/3] Agent YAML Validation Tests"
echo "----------------------------------------"
./test/agents.test.sh

echo ""
echo "[3/3] Plugin Unit Tests"
echo "----------------------------------------"
if command -v bun &> /dev/null; then
  bun test ./test/plugin.test.ts
else
  echo "  ⚠ Bun not installed, skipping plugin tests"
  echo "  Install with: curl -fsSL https://bun.sh/install | bash"
fi

echo ""
echo "========================================"
echo "  All tests passed!"
echo "========================================"
