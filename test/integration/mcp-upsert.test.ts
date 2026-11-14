import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '../../src/app'
import { upsertDoc } from '../../src/db/docs'
import { mcpCallTool, mcpInitialize } from './helpers/mcp'
import { authHeaders, openTestPlatform, testEnv } from './helpers/platform'

const owner = `mcp-owner-${Date.now()}@example.com`
const otherOwner = `mcp-other-${Date.now()}@example.com`

describe('MCP upsert happy path', () => {
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

  it('upsert → search → get_doc returns the document', async () => {
    const markdown = `---
title: Integration Note
description: task-21
tags: [task21, alpha]
kind: note
---

Unique token zyx-integration-710.

See also [[missing-link]].
`
    const upsert = await mcpCallTool<{ status: string; id: string }>(
      app,
      env,
      owner,
      'upsert_doc',
      { markdown },
    )
    expect(upsert.status).toBe('created')
    const id = upsert.id

    const search = await mcpCallTool<{ items: { id: string }[] }>(app, env, owner, 'search', {
      q: 'zyx-integration-710',
    })
    expect(search.items.some((d) => d.id === id)).toBe(true)

    const doc = await mcpCallTool<{ id: string; title: string; body: string }>(
      app,
      env,
      owner,
      'get_doc',
      { id },
    )
    expect(doc.id).toBe(id)
    expect(doc.title).toBe('Integration Note')
    expect(doc.body).toContain('zyx-integration-710')
  })

  it('GET /api/docs lists only the authenticated owner docs', async () => {
    const aliceDoc = await upsertDoc(env.DB, owner, {
      markdown: '# Alice only\n\nowner scoped',
    })
    if (aliceDoc.status === 'not_found' || aliceDoc.status === 'too_large') {
      throw new Error(`alice seed failed: ${aliceDoc.status}`)
    }
    const aliceId = aliceDoc.id
    await upsertDoc(env.DB, otherOwner, {
      markdown: '# Bob only\n\nother owner',
    })

    const acceptOther = await app.request(
      'http://localhost/api/me/disclaimer',
      { method: 'POST', headers: authHeaders(otherOwner) },
      env,
    )
    expect(acceptOther.status).toBe(200)

    const accept = await app.request(
      'http://localhost/api/me/disclaimer',
      { method: 'POST', headers: authHeaders(owner) },
      env,
    )
    expect(accept.status).toBe(200)

    const list = await app.request('http://localhost/api/docs', { headers: authHeaders(owner) }, env)
    expect(list.status).toBe(200)
    const body = (await list.json()) as { items: { id: string }[] }
    expect(body.items.some((d) => d.id === aliceId)).toBe(true)

    const otherList = await app.request(
      'http://localhost/api/docs',
      { headers: authHeaders(otherOwner) },
      env,
    )
    const otherBody = (await otherList.json()) as { items: { id: string }[] }
    expect(otherBody.items.some((d) => d.id === aliceId)).toBe(false)
  })
})