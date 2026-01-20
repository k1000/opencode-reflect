# AGENTS.md

Guidelines for AI coding agents working on OpenCode Reflect.

## Project Overview

OpenCode plugin for automatic session reflection. Analyzes coding sessions and generates improvement recommendations in three categories: process (agentic infrastructure), automation (user tooling), and knowledge (documentation).

## Architecture

```
plugins/reflect.ts     → Event-driven plugin (session.created trigger)
agents/*.md           → Agent definitions (YAML frontmatter + markdown)
commands/reflect.md    → /reflect command definition
{project}/reflect/     → Output directory for improvement files
```

**Pattern: Classifier → Specialists → Executor**
1. Plugin triggers on new session, analyzes previous session
2. Classifier detects symptoms, delegates to specialists
3. Specialists write remedy files to `{project}/reflect/`

## Build & Test Commands

No formal build system - this is a configuration-style plugin.

### Installation & Verification
```bash
# Install
cp plugins/reflect.ts ~/.config/opencode/plugins/
cp agents/*.md ~/.config/opencode/agents/
cp commands/reflect.md ~/.config/opencode/commands/

# Verify YAML frontmatter
for f in agents/*.md; do
  head -n 15 "$f" | grep -E "^(description|mode|model|tools):"
done
```

### Manual Testing
1. Restart OpenCode after copying files
2. Create a session with ≥2 messages and ≥3 tool calls
3. Run `/reflect` or start new session
4. Check `{project}/reflect/` for output files

## Code Style

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES` |
| Interfaces | PascalCase | `SessionData` |
| Functions | camelCase, verb-first | `analyzeSession` |
| Files | kebab-case | `reflect.ts` |
| Agent files | `{system}-{role}.md` | `reflect-classifier.md` |

### TypeScript Rules
```typescript
// Use `import type` for type-only imports
import type { Plugin } from "@opencode-ai/plugin"

// Include `| undefined` for API response assertions
const session = response.data as SessionData | undefined
if (!session) return

// Use optional chaining and nullish coalescing
const title = session?.title ?? "Untitled"
```

### Error Handling
```typescript
try {
  const result = await operation()
} catch (error) {
  await client.app.log({
    body: { service: "reflect", level: "error", message: `Failed: ${error}` }
  })
  // Log and recover - don't crash
}
```

## Agent Definition Format

### Required YAML Frontmatter
```yaml
---
description: [Role] that [action] for Reflect
mode: subagent
model: anthropic/claude-sonnet-4-20250514
tools:
  write: true|false
  edit: true|false
  bash: true|false
---
```

### Tool Permissions
| Role | read | write | edit | bash | Notes |
|------|------|-------|------|------|-------|
| Classifier | false | false | false | false | Analyzes input, delegates |
| Specialist | true | true | false | false | Reads context, creates output files |
| Executor | true | true | true | true | Full access |

## Output File Naming

Pattern: `{project}/reflect/YYYY-MM-DD_{emoji}{confidence}_{slug}.md`

| Type | Emoji | Confidence | Stars |
|------|-------|------------|-------|
| process | ⚙️ | low | ⭐ |
| automation | 🤖 | medium | ⭐⭐ |
| knowledge | 📚 | high | ⭐⭐⭐ |

Example: `2026-01-19_⚙️⭐⭐⭐_git-commit-validation.md`

## Plugin API

```typescript
// Plugin interface
type Plugin = (ctx: { client: Client; directory: string }) => Promise<{
  event: (ctx: { event: Event }) => Promise<void>
}>

// Key client methods
client.session.get({ path: { id } })
client.session.messages({ path: { id } })
client.session.create({ body: { title } })
client.session.prompt({ path: { id }, body: { agent, parts } })
client.app.log({ body: { service, level, message } })
client.tui.showToast({ body: { message, variant } })
```

## Thresholds

```typescript
const MIN_USER_MESSAGES = 2  // Skip sessions with fewer
const MIN_TOOL_CALLS = 3     // Skip sessions with fewer
```

Sessions titled with "reflect" or "improvement" are skipped (recursion prevention).

## Common Patterns

```typescript
// Guard clauses
const session = response.data as SessionData | undefined
if (!session) return

// Track processed items
const analyzedSessions = new Set<string>()
if (analyzedSessions.has(id)) return
analyzedSessions.add(id)

// Truncate for logs
const summary = text.replace(/\n/g, " ").slice(0, 80)
```

## What NOT to Do

- Don't use `as any` or `@ts-ignore`
- Don't throw errors - log and recover gracefully
- Don't add abstractions for "future" use cases
- Don't create shared types until used by 3+ files
- Don't modify existing files when specialist only has `write: true`
