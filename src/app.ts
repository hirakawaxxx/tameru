import { Hono } from 'hono'
import type { Env } from './env'
import { mcpApp } from './mcp/route'
import api from './routes/api'
import viewer from './routes/viewer'

const app = new Hono<{ Bindings: Env }>()

app.get('/health', (c) => c.json({ ok: true }))
app.route('/mcp', mcpApp)
app.route('/api', api)
app.route('/', viewer)

export default app