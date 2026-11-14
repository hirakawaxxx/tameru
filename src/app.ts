import { Hono } from 'hono'
import type { Env } from './env'
import { mcpApp } from './mcp/route'
import api from './routes/api'

const app = new Hono<{ Bindings: Env }>()

app.get('/health', (c) => c.json({ ok: true }))
app.route('/mcp', mcpApp)
app.route('/api', api)

export default app