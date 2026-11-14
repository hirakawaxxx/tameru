import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '../../src/app'
import { BODY_MAX_BYTES } from '../../src/lib/constants'
import {
  ERROR_CODES,
  ERROR_HTTP_STATUS,
  errorJson,
  mcpErrorJson,
} from '../../src/lib/http-errors'
import { upsertDoc } from '../../src/db/docs'
import { mcpCallTool, mcpInitialize } from '../integration/helpers/mcp'
import { authHeaders, openTestPlatform, testEnv } from '../integration/helpers/platform'

describe('HTTP error policy mapping', () => {
  it('maps design codes to HTTP status', () => {
    expect(ERROR_HTTP_STATUS[ERROR_CODES.unauthorized]).toBe(401)
    expect(ERROR_HTTP_STATUS[ERROR_CODES.disclaimer_required]).toBe(403)
    expect(ERROR_HTTP_STATUS[ERROR_CODES.not_found]).toBe(404)
    expect(ERROR_HTTP_STATUS[ERROR_CODES.validation_failed]).toBe(400)
    expect(ERROR_HTTP_STATUS[ERROR_CODES.too_large]).toBe(413)
    expect(errorJson(ERROR_CODES.not_found)).toEqual({ error: 'not_found' })
    expect(mcpErrorJson(ERROR_CODES.too_large)).toEqual({ error: 'too_large', status: 413 })
  })
})

describe('HTTP error policy (app)', () => {
  const owner = `http-err-${Date.now()}@example.com`
  const other = `http-err-other-${Date.now()}@example.com`
  let dispose: () => Promise<void>
  let env: ReturnType<typeof testEnv>
  let otherDocId: string

  beforeAll(async () => {
    const proxy = await openTestPlatform()
    dispose = () => proxy.dispose()
    env = testEnv(proxy)
    await mcpInitialize(app, env, owner)
    const seeded = await upsertDoc(env.DB, other, { markdown: '# Private\n\nsecret' })
    if (seeded.status !== 'created') throw new Error(`seed failed: ${seeded.status}`)
    otherDocId = seeded.id
  })

  afterAll(async () => {
    await dispose()
  })

  it('401 when unauthenticated', async () => {
    const res = await app.request('http://localhost/api/me', { headers: { host: 'localhost:8787' } }, env)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual(errorJson(ERROR_CODES.unauthorized))
  })

  it('sets Cache-Control: no-store on GET /api/me', async () => {
    const res = await app.request(
      'http://localhost/api/me',
      { headers: authHeaders(owner) },
      env,
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('403 when disclaimer not accepted', async () => {
    const fresh = `http-err-nodec-${Date.now()}@example.com`
    const res = await app.request(
      'http://localhost/api/docs',
      { headers: authHeaders(fresh) },
      env,
    )
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual(errorJson(ERROR_CODES.disclaimer_required))
  })

  it('404 for cross-owner doc (no existence leak)', async () => {
    const accept = await app.request(
      'http://localhost/api/me/disclaimer',
      { method: 'POST', headers: authHeaders(owner) },
      env,
    )
    expect(accept.status).toBe(200)
    const res = await app.request(
      `http://localhost/api/docs/${otherDocId}`,
      { headers: authHeaders(owner) },
      env,
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(errorJson(ERROR_CODES.not_found))
  })

  it('413 for oversize markdown via MCP', async () => {
    const big = 'a'.repeat(BODY_MAX_BYTES + 1)
    const payload = await mcpCallTool<{ error: string; status: number }>(app, env, owner, 'upsert_doc', {
      markdown: big,
    })
    expect(payload).toEqual(mcpErrorJson(ERROR_CODES.too_large))
  })

  it('400 for invalid MCP tool args (zod)', async () => {
    await expect(mcpCallTool(app, env, owner, 'get_doc', { id: 123 })).rejects.toThrow()
    const res = await app.request(
      'http://localhost/mcp',
      {
        method: 'POST',
        headers: {
          ...authHeaders(owner),
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 99,
          method: 'tools/call',
          params: { name: 'get_doc', arguments: { id: 123 } },
        }),
      },
      env,
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual(errorJson(ERROR_CODES.validation_failed))
  })
})