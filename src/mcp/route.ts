import { Hono } from 'hono'
import { StreamableHTTPTransport } from '@hono/mcp'
import { createMcpServer } from './server'
import { requireAuth, type AuthVariables } from '../middleware/auth'
import type { Env } from '../env'
import { ERROR_CODES, jsonApiError } from '../lib/http-errors'
import { mcpSseShowsToolValidationFailure } from './response-policy'

export const mcpApp = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

mcpApp.use('*', requireAuth)

mcpApp.all('*', async (c) => {
  if (c.req.method !== 'POST') {
    return c.json({ error: 'method_not_allowed' }, 405)
  }

  const owner = c.get('owner')
  const transport = new StreamableHTTPTransport({ sessionIdGenerator: undefined })
  const server = createMcpServer({ db: c.env.DB, owner })

  try {
    await server.connect(transport)
    const res = await transport.handleRequest(c)
    if (!res) return c.json({ error: 'mcp_transport_failed' }, 500)
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('text/event-stream')) {
      const text = await res.text()
      if (mcpSseShowsToolValidationFailure(text)) {
        return jsonApiError(c, ERROR_CODES.validation_failed)
      }
      return new Response(text, { status: res.status, headers: res.headers })
    }
    return res
  } finally {
    await server.close()
  }
})