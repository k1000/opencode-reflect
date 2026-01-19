# OpenCode Reflect

Automatic session reflection and improvement system for [OpenCode](https://opencode.ai).

Analyzes your coding sessions to identify improvement opportunities in three categories:
- **Process** - Agentic infrastructure improvements (skills, commands, AGENTS.md rules)
- **Automation** - User tooling (scripts, git hooks, CI/CD)
- **Knowledge** - Developer documentation (READMEs, docstrings)

## Installation

### 1. Copy files to OpenCode config

```bash
# Plugin
cp plugins/reflect.ts ~/.config/opencode/plugins/

# Agents
cp agents/*.md ~/.config/opencode/agents/

# Command
cp commands/reflect.md ~/.config/opencode/commands/
```

### 2. Restart OpenCode

The plugin loads automatically on startup.

## Usage

### Manual Reflection

```
/reflect
```

Analyzes the current session for improvement opportunities.

### Automatic Reflection

The plugin automatically triggers reflection when you start a new session, analyzing the **previous** session.

Requirements for automatic trigger:
- Previous session had ≥2 user messages
- Previous session had ≥3 tool calls
- Previous session is not a reflection session

### Direct Agent Invocation

```
@reflect-classifier analyze this session
@reflect-process analyze this process symptom
@reflect-automation analyze this automation opportunity
@reflect-knowledge document this knowledge gap
```

## Architecture

```
┌─────────────────┐
│  Plugin         │  Triggers on session.created
│  reflect.ts     │  Analyzes previous session
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Classifier     │  Detects symptoms
│  Agent          │  Delegates to specialists
└────────┬────────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
┌──────┐┌──────┐┌──────┐
│Process││Auto- ││Know- │  Specialists write
│      ││mation││ledge │  improvements to files
└──────┘└──────┘└──────┘
         │
         ▼
┌─────────────────┐
│  {project}/     │  Dated markdown files
│  reflect/       │  with remedies
└─────────────────┘
```

## Output

Improvements are written to `{project}/reflect/` as dated markdown files:

```
reflect/
├── 2026-01-19_⚙️⭐⭐⭐_git-commit-validation.md
├── 2026-01-19_🤖⭐⭐_auto-format-on-save.md
└── 2026-01-19_📚⭐⭐_api-documentation.md
```

File naming: `YYYY-MM-DD_{emoji}{confidence}_{slug-title}.md`

- `⚙️` = process
- `🤖` = automation  
- `📚` = knowledge
- `⭐` = low confidence
- `⭐⭐` = medium confidence
- `⭐⭐⭐` = high confidence

## Files

```
opencode-reflect/
├── plugins/
│   └── reflect.ts          # Main plugin (session.created trigger)
├── agents/
│   ├── reflect-classifier.md   # Session analyzer
│   ├── reflect-process.md      # Process specialist
│   ├── reflect-automation.md   # Automation specialist
│   ├── reflect-knowledge.md    # Knowledge specialist
│   └── reflect-executor.md     # Improvement executor
├── commands/
│   └── reflect.md          # /reflect command
└── README.md
```

## Configuration

Edit thresholds in `plugins/reflect.ts`:

```typescript
const MIN_USER_MESSAGES = 2  // Minimum user messages to trigger
const MIN_TOOL_CALLS = 3     // Minimum tool calls to trigger
```

## License

MIT
