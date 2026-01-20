import type { Plugin } from "@opencode-ai/plugin"

const MIN_USER_MESSAGES = 2
const MIN_TOOL_CALLS = 3

interface SessionData {
  id: string
  title?: string
  createdAt?: string
}

interface MessagePart {
  type?: string
  text?: string
  toolName?: string
  args?: Record<string, unknown>
  result?: string
  isError?: boolean
}

interface Message {
  info?: { role?: string }
  parts?: MessagePart[]
}

export const ReflectPlugin: Plugin = async ({ client, directory, $ }) => {
  const analyzedSessions = new Set<string>()
  let lastKnownSessionId: string | null = null

  const getSessionId = (event: { properties?: Record<string, unknown> }): string | null => {
    const id = event.properties?.sessionID || event.properties?.session_id
    return typeof id === "string" ? id : null
  }

  const isReflectionSession = (title: string): boolean => {
    const lower = title.toLowerCase()
    return lower.includes("reflect") || lower.includes("improvement")
  }

  const hasExistingReflection = async (sessionId: string): Promise<boolean> => {
    try {
      const reflectDir = `${directory}/reflect`
      const result = await $`ls ${reflectDir}/*.md 2>/dev/null | xargs grep -l ${sessionId} 2>/dev/null || true`
      return result.stdout.trim().length > 0
    } catch {
      return false
    }
  }

  const countSessionStats = (messages: Message[]): { userMessages: number; toolCalls: number } => {
    let userMessages = 0
    let toolCalls = 0

    for (const msg of messages) {
      if (msg.info?.role === "user") userMessages++
      if (msg.parts) {
        for (const part of msg.parts) {
          if (part.type === "tool-invocation") toolCalls++
        }
      }
    }

    return { userMessages, toolCalls }
  }

  const formatTranscript = (messages: Message[], limit = 50): string => {
    const lines: string[] = []
    let msgNum = 0
    let count = 0

    for (const msg of messages) {
      if (count >= limit) break

      if (msg.info?.role === "user") {
        msgNum++
        const textParts = msg.parts?.filter((p) => p.type === "text") || []
        const text = textParts.map((p) => p.text || "").join("\n")
        if (text) {
          lines.push(`\n[USER ${msgNum}] ${text.slice(0, 400)}`)
          count++
        }
      }

      if (msg.parts) {
        for (const part of msg.parts) {
          if (count >= limit) break

          if (part.type === "tool-invocation") {
            const args = part.args || {}
            const summary =
              (args.command as string) ||
              (args.prompt as string) ||
              (args.pattern as string) ||
              (args.filePath as string) ||
              JSON.stringify(args).slice(0, 80)
            lines.push(`  → ${part.toolName}: ${summary.replace(/\n/g, " ").slice(0, 80)}`)
            count++
          } else if (part.type === "tool-result" && part.isError) {
            lines.push(`  ✗ ERROR: ${(part.result || "").replace(/\n/g, " ").slice(0, 100)}`)
            count++
          }
        }
      }
    }

    return lines.join("\n")
  }

  const analyzeSession = async (sessionId: string): Promise<void> => {
    if (analyzedSessions.has(sessionId)) return
    analyzedSessions.add(sessionId)

    try {
      if (await hasExistingReflection(sessionId)) {
        await client.app.log({
          body: { service: "reflect", level: "debug", message: `Skip already processed: ${sessionId}` },
        })
        return
      }

      const sessionResponse = await client.session.get({ path: { id: sessionId } })
      const session = sessionResponse.data as SessionData | undefined
      if (!session) return

      const title = session.title || ""
      if (isReflectionSession(title)) {
        await client.app.log({
          body: { service: "reflect", level: "debug", message: `Skip reflection session: ${sessionId}` },
        })
        return
      }

      const messagesResponse = await client.session.messages({ path: { id: sessionId } })
      const messages = (messagesResponse.data || []) as Message[]

      const { userMessages, toolCalls } = countSessionStats(messages)

      if (userMessages < MIN_USER_MESSAGES || toolCalls < MIN_TOOL_CALLS) {
        await client.app.log({
          body: {
            service: "reflect",
            level: "debug",
            message: `Skip ${sessionId}: ${userMessages} msgs, ${toolCalls} tools (min: ${MIN_USER_MESSAGES}/${MIN_TOOL_CALLS})`,
          },
        })
        return
      }

      await client.app.log({
        body: { service: "reflect", level: "info", message: `Analyzing: ${title || sessionId}` },
      })

      const transcript = formatTranscript(messages)

      const reflectDir = `${directory}/reflect`
      await $`mkdir -p ${reflectDir}`

      const reflectSession = await client.session.create({
        body: { title: `Reflect: ${title || sessionId}` },
      })

      const reflectSessionData = reflectSession.data as SessionData | undefined
      if (!reflectSessionData?.id) return

      await client.session.prompt({
        path: { id: reflectSessionData.id },
        body: {
          agent: "reflect-classifier",
          parts: [
            {
              type: "text",
              text: `Analyze this completed session for improvement opportunities.

## Session Metadata

Session ID: ${sessionId}
Project: ${directory}
User Messages: ${userMessages}
Tool Calls: ${toolCalls}

## Session Transcript

${transcript}

## Instructions

1. Identify symptoms in categories: process, automation, knowledge
2. For high/medium severity symptoms, delegate to specialists:
   - process → @reflect-process
   - automation → @reflect-automation  
   - knowledge → @reflect-knowledge
3. Specialists write remedies to: ${directory}/reflect/YYYY-MM-DD_TYPE_title.md`,
            },
          ],
        },
      })

      await client.tui.showToast({
        body: { message: `Reflecting on "${title || sessionId}"...`, variant: "info" },
      })
    } catch (error) {
      await client.app.log({
        body: { service: "reflect", level: "error", message: `Analysis failed: ${error}` },
      })
    }
  }

  return {
    event: async ({ event }) => {
      const sessionId = getSessionId(event)

      if (event.type === "session.created" && sessionId) {
        const previousSessionId = lastKnownSessionId
        lastKnownSessionId = sessionId

        if (previousSessionId && !analyzedSessions.has(previousSessionId)) {
          await analyzeSession(previousSessionId)
        }
        return
      }

      if (event.type === "session.idle" && sessionId) {
        lastKnownSessionId = sessionId
        return
      }
    },
  }
}

export default ReflectPlugin
