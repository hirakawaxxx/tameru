const JSONRPC_INVALID_PARAMS = -32602

function isAppToolErrorPayload(text: string): boolean {
  try {
    const parsed = JSON.parse(text) as unknown
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'error' in parsed &&
      typeof (parsed as { error?: unknown }).error === 'string'
    )
  } catch {
    return false
  }
}

/** MCP Streamable HTTP may return tool zod failures as SSE 200; map to HTTP 400 when detected. */
export function mcpSseShowsToolValidationFailure(sseBody: string): boolean {
  for (const line of sseBody.split('\n')) {
    if (!line.startsWith('data: ')) continue
    const raw = line.slice('data: '.length).trim()
    if (!raw) continue
    let message: unknown
    try {
      message = JSON.parse(raw)
    } catch {
      continue
    }
    if (typeof message !== 'object' || message === null) continue
    const msg = message as Record<string, unknown>

    if (msg.error && typeof msg.error === 'object') {
      const err = msg.error as Record<string, unknown>
      if (err.code === JSONRPC_INVALID_PARAMS) return true
    }

    const result = msg.result
    if (typeof result !== 'object' || result === null) continue
    const r = result as Record<string, unknown>
    if (r.isError !== true) continue

    const content = r.content
    if (!Array.isArray(content) || content.length === 0) return true
    const first = content[0]
    if (typeof first !== 'object' || first === null) return true
    const text = (first as { text?: unknown }).text
    if (typeof text !== 'string') return true
    if (isAppToolErrorPayload(text)) return false
    return true
  }
  return false
}