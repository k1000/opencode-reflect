import { describe, test, expect } from "bun:test"
import { readFileSync } from "fs"
import { join } from "path"

const PLUGIN_PATH = join(import.meta.dir, "..", "plugins", "reflect.ts")
const pluginSource = readFileSync(PLUGIN_PATH, "utf-8")

describe("Plugin: reflect.ts", () => {
  describe("Structure", () => {
    test("exports ReflectPlugin", () => {
      expect(pluginSource).toContain("export const ReflectPlugin")
    })

    test("exports default", () => {
      expect(pluginSource).toContain("export default ReflectPlugin")
    })

    test("imports Plugin type", () => {
      expect(pluginSource).toContain('import type { Plugin } from "@opencode-ai/plugin"')
    })

    test("uses $ shell helper from context", () => {
      expect(pluginSource).toContain("{ client, directory, $ }")
    })
  })

  describe("Thresholds", () => {
    test("defines MIN_USER_MESSAGES", () => {
      expect(pluginSource).toMatch(/const MIN_USER_MESSAGES = \d+/)
    })

    test("defines MIN_TOOL_CALLS", () => {
      expect(pluginSource).toMatch(/const MIN_TOOL_CALLS = \d+/)
    })

    test("MIN_USER_MESSAGES is at least 2", () => {
      const match = pluginSource.match(/const MIN_USER_MESSAGES = (\d+)/)
      expect(match).not.toBeNull()
      expect(parseInt(match![1])).toBeGreaterThanOrEqual(2)
    })

    test("MIN_TOOL_CALLS is at least 3", () => {
      const match = pluginSource.match(/const MIN_TOOL_CALLS = (\d+)/)
      expect(match).not.toBeNull()
      expect(parseInt(match![1])).toBeGreaterThanOrEqual(3)
    })
  })

  describe("Session filtering", () => {
    test("filters reflection sessions by title", () => {
      expect(pluginSource).toContain("isReflectionSession")
      expect(pluginSource).toContain('includes("reflect")')
      expect(pluginSource).toContain('includes("improvement")')
    })

    test("tracks analyzed sessions to prevent duplicates", () => {
      expect(pluginSource).toContain("analyzedSessions")
      expect(pluginSource).toContain("new Set<string>()")
    })
  })

  describe("Directory creation", () => {
    test("creates reflect directory before analysis", () => {
      expect(pluginSource).toContain("mkdir -p")
      expect(pluginSource).toContain("reflect")
    })
  })

  describe("Event handling", () => {
    test("handles session.created event", () => {
      expect(pluginSource).toContain('"session.created"')
    })

    test("handles session.idle event", () => {
      expect(pluginSource).toContain('"session.idle"')
    })
  })

  describe("Classifier delegation", () => {
    test("creates reflection session", () => {
      expect(pluginSource).toContain("client.session.create")
    })

    test("prompts reflect-classifier agent", () => {
      expect(pluginSource).toContain("reflect-classifier")
    })

    test("includes session metadata in prompt", () => {
      expect(pluginSource).toContain("Session ID:")
      expect(pluginSource).toContain("Project:")
      expect(pluginSource).toContain("User Messages:")
      expect(pluginSource).toContain("Tool Calls:")
    })
  })

  describe("Error handling", () => {
    test("uses try-catch for analysis", () => {
      expect(pluginSource).toContain("try {")
      expect(pluginSource).toContain("} catch (error)")
    })

    test("logs errors via client.app.log", () => {
      expect(pluginSource).toContain("client.app.log")
      expect(pluginSource).toContain('level: "error"')
    })

    test("does not throw errors (graceful recovery)", () => {
      expect(pluginSource).not.toMatch(/throw new Error/)
    })
  })

  describe("Type safety", () => {
    test("uses type assertions with undefined", () => {
      expect(pluginSource).toContain("as SessionData | undefined")
    })

    test("guards against undefined session", () => {
      expect(pluginSource).toContain("if (!session) return")
    })
  })
})
