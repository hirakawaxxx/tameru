import { createMiddleware } from 'hono/factory'
import type { Env } from '../env'
import { ownerFromDevHeaders, verifyAccessJwt } from '../lib/access'

export type AuthVariables = { owner: string }

export const requireAuth = createMiddleware<{
  Bindings: Env
  Variables: AuthVariables
}>(async (c, next) => {
  const host = c.req.header('host') ?? ''
  const devOwner = ownerFromDevHeaders({
    host,
    accessAud: c.env.ACCESS_AUD,
    debugOwner: c.req.header('X-Tameru-Debug-Owner'),
  })
  if (devOwner) {
    c.set('owner', devOwner)
    return next()
  }
  if (!c.env.ACCESS_AUD) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  const jwt = c.req.header('Cf-Access-Jwt-Assertion')
  if (!jwt) return c.json({ error: 'unauthorized' }, 401)
  try {
    const owner = await verifyAccessJwt(
      jwt,
      c.env.ACCESS_TEAM_DOMAIN,
      c.env.ACCESS_AUD,
    )
    c.set('owner', owner)
    await next()
  } catch {
    return c.json({ error: 'unauthorized' }, 401)
  }
})