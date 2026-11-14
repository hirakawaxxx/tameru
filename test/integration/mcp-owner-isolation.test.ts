import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '../../src/app'
import { ERROR_CODES } from '../../src/lib/http-errors'
import { mcpCallTool, mcpInitialize } from './helpers/mcp'
import { authHeaders, openTestPlatform, testEnv } from './helpers/platform'

describe('MCP per-request owner isolation', () => {
  const ownerA = `mcp-iso-a-${Date.now()}@example.com`
  const ownerB = `mcp-iso-b-${Date.now()}@example.com`
  let dispose: () => Promise<void>
  let env: ReturnType<typeof testEnv>
  let secretId: string
  const secretToken = `iso-token-${Date.now()}`

  beforeAll(async () => {
    const proxy = await openTestPlatform()
    dispose = () => proxy.dispose()
    env = testEnv(proxy)
    await mcpInitialize(app, env, ownerA)
    const upsert = await mcpCallTool<{ status: string; id: string }>(
      app,
      env,
      ownerA,
      'upsert_doc',
      {
        markdown: `---
title: Owner A private
tags: [secret]
---
${secretToken}`,
      },
    )
    secretId = upsert.id
  })

  afterAll(async () => {
    await dispose()
  })

  it('owner B cannot get_doc or search owner A document (no cross-talk)', async () => {
    await mcpInitialize(app, env, ownerB)

    const got = await mcpCallTool<{ error: string }>(app, env, ownerB, 'get_doc', { id: secretId })
    expect(got.error).toBe(ERROR_CODES.not_found)

    const search = await mcpCallTool<{ items: { id: string }[] }>(app, env, ownerB, 'search', {
      q: secretToken,
    })
    expect(search.items.some((d) => d.id === secretId)).toBe(false)
  })
})

describe('MCP HTTP surface', () => {
  let dispose: () => Promise<void>
  let env: ReturnType<typeof testEnv>

  beforeAll(async () => {
    const proxy = await openTestPlatform()
    dispose = () => proxy.dispose()
    env = testEnv(proxy)
  })

  afterAll(async () => {
    await dispose()
  })

  it('rejects GET and DELETE on /mcp with 405', async () => {
    for (const method of ['GET', 'DELETE'] as const) {
      const res = await app.request(
        'http://localhost/mcp',
        { method, headers: authHeaders('mcp-405@example.com') },
        env,
      )
      expect(res.status).toBe(405)
    }
  })
})