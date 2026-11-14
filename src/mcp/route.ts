import { Hono } from 'hono'
import { StreamableHTTPTransport } from '@hono/mcp'
import { getMcpServer } from './server'
import { requireAuth, type AuthVariables } from '../middleware/auth'
import type { Env } from '../env'

const transport = new StreamableHTTPTransport({ sessionIdGenerator: undefined })

export const mcpApp = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

mcpApp.use('*', requireAuth)
mcpApp.all('*', async (c) => {
  const owner = c.get('owner')
  const server = getMcpServer({ db: c.env.DB, owner })
  if (!server.isConnected()) await server.connect(transport)
  const res = await transport.handleRequest(c)
  return res ?? c.json({ error: 'mcp_transport_failed' }, 500)
})