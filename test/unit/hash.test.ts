import { describe, it, expect } from 'vitest'
import { sha256Hex } from '../../src/lib/hash'

describe('sha256Hex', () => {
  it('is deterministic', async () => {
    const a = await sha256Hex('hello')
    const b = await sha256Hex('hello')
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })
})