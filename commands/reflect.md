---
description: Analyze sessions and propose improvements
agent: reflect-classifier
subtask: true
---

Analyze sessions to identify improvements.

## Mode Selection

The user invoked `/reflect`. Determine the mode:

1. **If arguments provided** (e.g., `/reflect 3` or `/reflect all`):
   - Number N → analyze the N most recent non-reflection sessions
   - "all" → analyze all unprocessed sessions

2. **If no arguments** → analyze current session only

## Instructions

1. **List available sessions** using the SDK to fetch recent sessions
2. **Filter out** sessions titled with "reflect" or "improvement" (recursion prevention)
3. **Filter out** sessions with <2 user messages or <3 tool calls
4. **For each qualifying session**, analyze and identify symptoms in these categories:
   - **process**: Agentic behavior patterns (skills, commands, AGENTS.md rules)
   - **automation**: User tooling (scripts, git hooks)
   - **knowledge**: Documentation for READMEs
5. For each symptom detected, delegate to the appropriate specialist using the Task tool:
   - **process** symptoms → `@reflect-process`
   - **automation** symptoms → `@reflect-automation`
   - **knowledge** symptoms → `@reflect-knowledge`
6. Present refined improvements to the user for approval
7. For approved improvements, use `@reflect-executor` to apply them

## Save Path

All specialists save to: `<project>/reflect/YYYY-MM-DD_[type][confidence]_<title>.md`

Where:
- Type: `⚙️`=process, `🤖`=automation, `📚`=knowledge
- Confidence: `⭐`=low, `⭐⭐`=medium, `⭐⭐⭐`=high
