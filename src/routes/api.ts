import { Hono } from 'hono'
import type { Env } from '../env'
import {
  acceptDisclaimer,
  disclaimerAccepted,
  ensureUser,
} from '../db/users'
import {
  docSummaryFromRow,
  getDocForOwner,
  listBacklinks,
  listDocsForOwner,
  searchDocs,
} from '../db/docs'
import { getOwnerGraph } from '../db/graph'
import type { AuthVariables } from '../middleware/auth'
import { requireAuth } from '../middleware/auth'
import { requireDisclaimer } from '../middleware/disclaimer'
import { BROWSE_MAX } from '../lib/constants'

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

api.get('/docs', async (c) => {
  const owner = c.get('owner')
  const kind = c.req.query('kind')
  const tag = c.req.query('tag')
  const limit = Math.min(Number(c.req.query('limit') ?? BROWSE_MAX), BROWSE_MAX)
  const offset = Math.max(Number(c.req.query('offset') ?? 0), 0)
  const items = await listDocsForOwner(c.env.DB, owner, { kind, tag, limit, offset })
  return c.json({ items, limit, offset })
})

api.get('/docs/:id', async (c) => {
  const owner = c.get('owner')
  const id = c.req.param('id')
  const row = await getDocForOwner(c.env.DB, owner, id)
  if (!row) return c.json({ error: 'not_found' }, 404)
  const links = JSON.parse(row.links_json) as string[]
  const backlinks = await listBacklinks(c.env.DB, owner, id)
  return c.json({
    id: row.id,
    title: row.title,
    description: row.description,
    kind: row.kind,
    tags: JSON.parse(row.tags_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
    body: row.body_md,
    links,
    backlinks,
  })
})

api.get('/search', async (c) => {
  const owner = c.get('owner')
  const q = c.req.query('q') ?? ''
  const tag = c.req.query('tag')
  const kind = c.req.query('kind')
  let rows = await searchDocs(c.env.DB, owner, q, BROWSE_MAX)
  if (tag) {
    const t = tag.toLowerCase()
    rows = rows.filter((r) =>
      (JSON.parse(r.tags_json) as string[]).some((x) => x.toLowerCase() === t),
    )
  }
  if (kind) {
    rows = rows.filter((r) => r.kind === kind)
  }
  return c.json({ items: rows.map(docSummaryFromRow) })
})

api.get('/graph', async (c) => {
  const owner = c.get('owner')
  const graph = await getOwnerGraph(c.env.DB, owner)
  return c.json(graph)
})

export default api