import { Hono } from 'hono'
import type { Env } from '../env'
import {
  acceptDisclaimer,
  disclaimerAccepted,
  ensureUser,
} from '../db/users'
import type { AuthVariables } from '../middleware/auth'
import { requireAuth } from '../middleware/auth'
import { requireDisclaimer } from '../middleware/disclaimer'

const api = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

api.use('*', requireAuth)

api.get('/me', async (c) => {
  const owner = c.get('owner')
  const user = await ensureUser(c.env.DB, owner)
  return c.json({
    owner: user.owner,
    disclaimer_accepted: disclaimerAccepted(user, c.env.DISCLAIMER_VERSION),
    disclaimer_version: c.env.DISCLAIMER_VERSION,
  })
})

api.post('/me/disclaimer', async (c) => {
  const owner = c.get('owner')
  await ensureUser(c.env.DB, owner)
  await acceptDisclaimer(c.env.DB, owner, c.env.DISCLAIMER_VERSION)
  return c.json({ ok: true })
})

api.use('*', async (c, next) => {
  const path = c.req.path
  if (
    path.endsWith('/me/disclaimer') ||
    path === '/api/me' ||
    path === '/me'
  ) {
    return next()
  }
  return requireDisclaimer(c, next)
})

export default api