#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

assert_yaml_field() {
  local file="$1"
  local field="$2"
  local msg="$3"
  if head -n 20 "$file" | grep -qE "^${field}:"; then
    echo "  ✓ $msg"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $msg (missing: $field)"
    FAIL=$((FAIL + 1))
  fi
}

assert_yaml_field_absent() {
  local file="$1"
  local field="$2"
  local msg="$3"
  if ! head -n 20 "$file" | grep -qE "^${field}:"; then
    echo "  ✓ $msg"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $msg (should not have: $field)"
    FAIL=$((FAIL + 1))
  fi
}

assert_yaml_value() {
  local file="$1"
  local field="$2"
  local value="$3"
  local msg="$4"
  if head -n 20 "$file" | grep -qE "^${field}: *${value}"; then
    echo "  ✓ $msg"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $msg (expected $field: $value)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Agent YAML Validation Tests ==="

for agent in "$SCRIPT_DIR"/agents/reflect-*.md; do
  name=$(basename "$agent")
  echo ""
  echo "Agent: $name"
  
  assert_yaml_field "$agent" "description" "has description"
  assert_yaml_field "$agent" "mode" "has mode"
  assert_yaml_value "$agent" "mode" "subagent" "mode is subagent"
  assert_yaml_field "$agent" "tools" "has tools section"
  assert_yaml_field_absent "$agent" "model" "no hardcoded model"
done

echo ""
echo "=== Command YAML Validation Tests ==="

echo ""
echo "Command: reflect.md"
assert_yaml_field "$SCRIPT_DIR/commands/reflect.md" "description" "has description"
assert_yaml_field "$SCRIPT_DIR/commands/reflect.md" "agent" "has agent"
assert_yaml_value "$SCRIPT_DIR/commands/reflect.md" "agent" "reflect-classifier" "agent is reflect-classifier"

echo ""
echo "=== Tool Permissions Tests ==="

echo ""
echo "Classifier (read-only)"
assert_yaml_value "$SCRIPT_DIR/agents/reflect-classifier.md" "  write" "false" "write: false"
assert_yaml_value "$SCRIPT_DIR/agents/reflect-classifier.md" "  edit" "false" "edit: false"
assert_yaml_value "$SCRIPT_DIR/agents/reflect-classifier.md" "  bash" "false" "bash: false"

echo ""
echo "Specialists (write-only)"
for specialist in process automation knowledge; do
  file="$SCRIPT_DIR/agents/reflect-${specialist}.md"
  assert_yaml_value "$file" "  write" "true" "$specialist: write: true"
  assert_yaml_value "$file" "  edit" "false" "$specialist: edit: false"
  assert_yaml_value "$file" "  bash" "false" "$specialist: bash: false"
done

echo ""
echo "Executor (full access)"
assert_yaml_value "$SCRIPT_DIR/agents/reflect-executor.md" "  write" "true" "write: true"
assert_yaml_value "$SCRIPT_DIR/agents/reflect-executor.md" "  edit" "true" "edit: true"
assert_yaml_value "$SCRIPT_DIR/agents/reflect-executor.md" "  bash" "true" "bash: true"

echo ""
echo "=== Results ==="
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [ $FAIL -gt 0 ]; then
  exit 1
fi
