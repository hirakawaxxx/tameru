import { createMiddleware } from 'hono/factory'
import type { Env } from '../env'
import { ensureUser, disclaimerAccepted } from '../db/users'
import { ERROR_CODES, jsonApiError } from '../lib/http-errors'
import type { AuthVariables } from './auth'

export const requireDisclaimer = createMiddleware<{
  Bindings: Env
  Variables: AuthVariables
}>(async (c, next) => {
  const owner = c.get('owner')
  const user = await ensureUser(c.env.DB, owner)
  if (!disclaimerAccepted(user, c.env.DISCLAIMER_VERSION)) {
    return jsonApiError(c, ERROR_CODES.disclaimer_required)
  }
  return next()
})