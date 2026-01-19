---
description: Analyze current session and propose improvements
agent: reflect-classifier
subtask: true
---

Analyze this session to identify improvements.

## Instructions

1. Analyze the current session transcript thoroughly
2. Identify symptoms in these categories:
   - **process**: Agentic behavior patterns (skills, commands, AGENTS.md rules)
   - **automation**: User tooling (scripts, git hooks)
   - **knowledge**: Documentation for READMEs
3. For each symptom detected, delegate to the appropriate specialist using the Task tool:
   - **process** symptoms → `@reflect-process`
   - **automation** symptoms → `@reflect-automation`
   - **knowledge** symptoms → `@reflect-knowledge`
4. Present refined improvements to the user for approval
5. For approved improvements, use `@reflect-executor` to apply them

## Save Path

All specialists save to: `<project>/reflect/YYYY-MM-DD_[aut,doc,proc]_<title>.md`

Where: `aut`=automation, `doc`=knowledge, `proc`=process
