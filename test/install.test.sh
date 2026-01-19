#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TEST_CONFIG_DIR=$(mktemp -d)
PASS=0
FAIL=0

cleanup() {
  rm -rf "$TEST_CONFIG_DIR"
}
trap cleanup EXIT

assert_file_exists() {
  if [ -f "$1" ]; then
    echo "  ✓ $2"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $2 (file not found: $1)"
    FAIL=$((FAIL + 1))
  fi
}

assert_file_not_exists() {
  if [ ! -f "$1" ]; then
    echo "  ✓ $2"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $2 (file exists: $1)"
    FAIL=$((FAIL + 1))
  fi
}

assert_file_contains() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo "  ✓ $3"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $3 (pattern not found: $2)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Install Script Tests ==="

echo ""
echo "Test 1: Fresh install creates all files"
HOME="$TEST_CONFIG_DIR" "$SCRIPT_DIR/install.sh" > /dev/null
assert_file_exists "$TEST_CONFIG_DIR/.config/opencode/plugins/reflect.ts" "plugin installed"
assert_file_exists "$TEST_CONFIG_DIR/.config/opencode/agents/reflect-classifier.md" "classifier agent installed"
assert_file_exists "$TEST_CONFIG_DIR/.config/opencode/agents/reflect-process.md" "process agent installed"
assert_file_exists "$TEST_CONFIG_DIR/.config/opencode/agents/reflect-automation.md" "automation agent installed"
assert_file_exists "$TEST_CONFIG_DIR/.config/opencode/agents/reflect-knowledge.md" "knowledge agent installed"
assert_file_exists "$TEST_CONFIG_DIR/.config/opencode/agents/reflect-executor.md" "executor agent installed"
assert_file_exists "$TEST_CONFIG_DIR/.config/opencode/commands/reflect.md" "command installed"

echo ""
echo "Test 2: Reinstall with same files creates no backups"
HOME="$TEST_CONFIG_DIR" "$SCRIPT_DIR/install.sh" > /dev/null
assert_file_not_exists "$TEST_CONFIG_DIR/.config/opencode/plugins/reflect.ts.backup" "no plugin backup (same content)"

echo ""
echo "Test 3: Reinstall with changed file creates backup"
echo "modified" >> "$TEST_CONFIG_DIR/.config/opencode/plugins/reflect.ts"
HOME="$TEST_CONFIG_DIR" "$SCRIPT_DIR/install.sh" > /dev/null
assert_file_exists "$TEST_CONFIG_DIR/.config/opencode/plugins/reflect.ts.backup" "plugin backup created"
assert_file_contains "$TEST_CONFIG_DIR/.config/opencode/plugins/reflect.ts.backup" "modified" "backup contains old content"

echo ""
echo "=== Uninstall Script Tests ==="

echo ""
echo "Test 4: Uninstall removes all files"
HOME="$TEST_CONFIG_DIR" "$SCRIPT_DIR/uninstall.sh" > /dev/null
assert_file_not_exists "$TEST_CONFIG_DIR/.config/opencode/plugins/reflect.ts" "plugin removed"
assert_file_not_exists "$TEST_CONFIG_DIR/.config/opencode/agents/reflect-classifier.md" "classifier agent removed"
assert_file_not_exists "$TEST_CONFIG_DIR/.config/opencode/agents/reflect-process.md" "process agent removed"
assert_file_not_exists "$TEST_CONFIG_DIR/.config/opencode/commands/reflect.md" "command removed"

echo ""
echo "=== Results ==="
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [ $FAIL -gt 0 ]; then
  exit 1
fi
