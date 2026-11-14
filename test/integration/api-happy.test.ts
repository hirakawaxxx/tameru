import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '../../src/app'
import { mcpCallTool, mcpInitialize } from './helpers/mcp'
import { authHeaders, openTestPlatform, testEnv } from './helpers/platform'

/**
 * Task 12 parked requirement: HTTP API happy path with local D1 (via wrangler getPlatformProxy).
 */
const owner = `api-happy-${Date.now()}@example.com`

describe('API happy path (Task 12)', () => {
  let dispose: () => Promise<void>
  let env: ReturnType<typeof testEnv>

  beforeAll(async () => {
    const proxy = await openTestPlatform()
    dispose = () => proxy.dispose()
    env = testEnv(proxy)
    await mcpInitialize(app, env, owner)
  })

  afterAll(async () => {
    await dispose()
  })

  it('auth → disclaimer → MCP upsert → GET /api/docs', async () => {
    const me = await app.request('http://localhost/api/me', { headers: authHeaders(owner) }, env)
    expect(me.status).toBe(200)
    const meBody = (await me.json()) as { disclaimer_accepted: boolean }
    expect(meBody.disclaimer_accepted).toBe(false)

    const blocked = await app.request('http://localhost/api/docs', { headers: authHeaders(owner) }, env)
    expect(blocked.status).toBe(403)

    const accept = await app.request(
      'http://localhost/api/me/disclaimer',
      { method: 'POST', headers: authHeaders(owner) },
      env,
    )
    expect(accept.status).toBe(200)

    const upsert = await mcpCallTool<{ status: string; id: string }>(app, env, owner, 'upsert_doc', {
      markdown: `---
title: Happy Path Doc
tags: [happy]
kind: doc
---

happy-path-token-881`,
    })
    expect(upsert.status).toBe('created')

    const list = await app.request('http://localhost/api/docs', { headers: authHeaders(owner) }, env)
    expect(list.status).toBe(200)
    const listBody = (await list.json()) as { items: { id: string; title: string }[] }
    expect(listBody.items.some((d) => d.id === upsert.id && d.title === 'Happy Path Doc')).toBe(true)

    const search = await app.request(
      'http://localhost/api/search?q=happy-path-token-881',
      { headers: authHeaders(owner) },
      env,
    )
    expect(search.status).toBe(200)
    const searchBody = (await search.json()) as { items: { id: string }[] }
    expect(searchBody.items.some((d) => d.id === upsert.id)).toBe(true)
  })
})