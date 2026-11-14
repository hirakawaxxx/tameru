import { Hono } from 'hono'
import type { Env } from './env'
import api from './routes/api'

const app = new Hono<{ Bindings: Env }>()

app.get('/health', (c) => c.json({ ok: true }))
app.route('/api', api)

export default app