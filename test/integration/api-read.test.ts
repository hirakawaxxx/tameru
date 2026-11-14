import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '../../src/app'
import { upsertDoc } from '../../src/db/docs'
import { authHeaders, openTestPlatform, testEnv } from './helpers/platform'

const owner = `api-read-${Date.now()}@example.com`

describe('API read paths', () => {
  let dispose: () => Promise<void>
  let env: ReturnType<typeof testEnv>
  let docId: string

  beforeAll(async () => {
    const proxy = await openTestPlatform()
    dispose = () => proxy.dispose()
    env = testEnv(proxy)
    const upsert = await upsertDoc(env.DB, owner, {
      markdown: `---
title: Graph Node A
tags: [graph]
kind: doc
---

Body A with link token graph-hop-42.

# Linked doc

ref: [[placeholder-for-b]]
`,
    })
    if (upsert.status !== 'created') throw new Error(`seed doc A failed: ${upsert.status}`)
    docId = upsert.id
    const upsertB = await upsertDoc(env.DB, owner, {
      markdown: `---
title: Graph Node B
tags: [graph]
kind: doc
---

Target B for graph-hop-42.`,
    })
    if (upsertB.status !== 'created') throw new Error(`seed doc B failed: ${upsertB.status}`)
    await upsertDoc(env.DB, owner, {
      id: docId,
      markdown: `---
title: Graph Node A
tags: [graph]
kind: doc
---

Body A with link token graph-hop-42.

# Linked doc

See [Node B](/d/${upsertB.id}).
`,
    })
    const accept = await app.request(
      'http://localhost/api/me/disclaimer',
      { method: 'POST', headers: authHeaders(owner) },
      env,
    )
    expect(accept.status).toBe(200)
  })

  afterAll(async () => {
    await dispose()
  })

  it('rejects unauthenticated requests', async () => {
    const res = await app.request('http://localhost/api/docs', { headers: { host: 'localhost:8787' } }, env)
    expect(res.status).toBe(401)
  })

  it('blocks reads until disclaimer accepted', async () => {
    const fresh = `api-no-disclaimer-${Date.now()}@example.com`
    const blocked = await app.request(
      'http://localhost/api/search?q=graph-hop-42',
      { headers: authHeaders(fresh) },
      env,
    )
    expect(blocked.status).toBe(403)
    const body = (await blocked.json()) as { error: string }
    expect(body.error).toBe('disclaimer_required')
  })

  it('GET /docs/:id, /search, /graph after disclaimer', async () => {
    const byId = await app.request(
      `http://localhost/api/docs/${docId}`,
      { headers: authHeaders(owner) },
      env,
    )
    expect(byId.status).toBe(200)
    const doc = (await byId.json()) as { id: string; body: string }
    expect(doc.id).toBe(docId)
    expect(doc.body).toContain('graph-hop-42')

    const search = await app.request(
      'http://localhost/api/search?q=graph-hop-42',
      { headers: authHeaders(owner) },
      env,
    )
    expect(search.status).toBe(200)
    const searchBody = (await search.json()) as { items: { id: string }[] }
    expect(searchBody.items.some((d) => d.id === docId)).toBe(true)

    const graph = await app.request('http://localhost/api/graph', { headers: authHeaders(owner) }, env)
    expect(graph.status).toBe(200)
    const graphBody = (await graph.json()) as {
      nodes: { id: string }[]
      edges: { from: string; to: string }[]
    }
    expect(graphBody.nodes.some((n) => n.id === docId)).toBe(true)
    expect(graphBody.edges.length).toBeGreaterThan(0)
  })
})