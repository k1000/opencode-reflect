# OpenCode Reflect

Automatic session reflection for [OpenCode](https://opencode.ai). Analyzes your coding sessions and generates actionable improvements.

## What It Does

After each coding session, Reflect analyzes what happened and identifies opportunities in three categories:

| Category | Icon | Examples |
|----------|------|----------|
| **Process** | ⚙️ | Skills, commands, AGENTS.md rules |
| **Automation** | 🤖 | Scripts, git hooks, CI/CD |
| **Knowledge** | 📚 | READMEs, docstrings, guides |

Improvements are saved to `{project}/reflect/` as actionable markdown files.

## Installation

```bash
git clone https://github.com/user/opencode-reflect
cd opencode-reflect
./install.sh
```

Restart OpenCode after installation.

## Usage

### Automatic Mode

Reflect triggers automatically when you start a new session, analyzing the previous one.

### Manual Mode

```bash
/reflect          # Current session
/reflect 3        # Last 3 sessions  
/reflect all      # All unprocessed sessions
```

### Direct Agent Invocation

```bash
@reflect-classifier analyze this session
@reflect-process analyze this process symptom
@reflect-automation analyze this automation opportunity
@reflect-knowledge document this knowledge gap
```

## Output

```
project/
└── reflect/
    ├── 2026-01-19_⚙️⭐⭐⭐_git-commit-validation.md
    ├── 2026-01-19_🤖⭐⭐_auto-format-on-save.md
    └── 2026-01-19_📚⭐_api-documentation.md
```

**Filename format**: `YYYY-MM-DD_{type}{confidence}_{title}.md`

**Confidence levels**: ⭐ low, ⭐⭐ medium, ⭐⭐⭐ high

## Architecture

```
┌──────────────────┐
│  Plugin          │  Triggers on session.created
│  reflect.ts      │  Analyzes previous session
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Classifier      │  Detects symptoms
│  Agent           │  Delegates to specialists
└────────┬─────────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
┌──────┐┌──────┐┌──────┐
│⚙️    ││🤖    ││📚    │  Specialists write
│Process││Auto ││Know  │  improvements to files
└──────┘└──────┘└──────┘
         │
         ▼
┌──────────────────┐
│  Executor        │  Applies approved
│  Agent           │  improvements
└──────────────────┘
```

## Configuration

Edit thresholds in `plugins/reflect.ts`:

```typescript
const MIN_USER_MESSAGES = 2  // Skip sessions with fewer
const MIN_TOOL_CALLS = 3     // Skip sessions with fewer
```

Sessions titled with "reflect" or "improvement" are automatically skipped.

## Testing

```bash
./test/run.sh
```

**78 tests** covering install/uninstall, agent YAML validation, and plugin logic.

Requires [Bun](https://bun.sh) for TypeScript tests.

## Project Structure

```
opencode-reflect/
├── plugins/
│   └── reflect.ts              # Event-driven plugin
├── agents/
│   ├── reflect-classifier.md   # Session analyzer (read-only)
│   ├── reflect-process.md      # Process specialist (write)
│   ├── reflect-automation.md   # Automation specialist (write)
│   ├── reflect-knowledge.md    # Knowledge specialist (write)
│   └── reflect-executor.md     # Executor (full access)
├── commands/
│   └── reflect.md              # /reflect command
├── test/
│   ├── run.sh                  # Test runner
│   ├── install.test.sh         # Install/uninstall tests
│   ├── agents.test.sh          # YAML validation tests
│   └── plugin.test.ts          # Plugin unit tests
├── install.sh                  # Idempotent installer
├── uninstall.sh                # Clean removal
├── AGENTS.md                   # AI coding guidelines
└── README.md
```

## Uninstall

```bash
./uninstall.sh
```

## License

MIT
