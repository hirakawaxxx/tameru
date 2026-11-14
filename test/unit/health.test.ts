import { describe, it, expect } from 'vitest'
import app from '../../src/app'

describe('health', () => {
  it('returns ok', async () => {
    const res = await app.request('http://localhost/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})