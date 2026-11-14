import type { Hono } from 'hono'
import type { Env } from '../../../src/env'

const MCP_HEADERS = {
  Accept: 'application/json, text/event-stream',
  'Content-Type': 'application/json',
}

export function parseSseJson(text: string): unknown {
  const line = text.split('\n').find((l) => l.startsWith('data: '))
  if (!line) throw new Error(`expected SSE data, got: ${text.slice(0, 120)}`)
  return JSON.parse(line.slice('data: '.length))
}

export function toolResultPayload(sseBody: unknown): unknown {
  const data = sseBody as { result?: { content?: { text?: string }[] } }
  const raw = data.result?.content?.[0]?.text
  if (!raw) throw new Error('missing tool text payload')
  return JSON.parse(raw)
}

type App = Hono<{ Bindings: Env }>

export async function mcpInitialize(app: App, env: Env, owner: string): Promise<void> {
  const res = await app.request(
    'http://localhost/mcp',
    {
      method: 'POST',
      headers: { ...MCP_HEADERS, host: 'localhost:8787', 'X-Tameru-Debug-Owner': owner },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'vitest', version: '1' },
        },
      }),
    },
    env,
  )
  if (!res.ok) throw new Error(`mcp initialize failed: ${res.status}`)
}

export async function mcpCallTool<T = unknown>(
  app: App,
  env: Env,
  owner: string,
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  const res = await app.request(
    'http://localhost/mcp',
    {
      method: 'POST',
      headers: { ...MCP_HEADERS, host: 'localhost:8787', 'X-Tameru-Debug-Owner': owner },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name, arguments: args },
      }),
    },
    env,
  )
  if (!res.ok) throw new Error(`mcp ${name} failed: ${res.status}`)
  const parsed = parseSseJson(await res.text())
  return toolResultPayload(parsed) as T
}