import { describe, it, expect } from 'vitest'
import { buildSearchPlan } from '../../src/lib/search'

describe('buildSearchPlan', () => {
  it('ANDs terms for fts', () => {
    const p = buildSearchPlan('foo bar')
    expect(p.mode).toBe('fts')
    expect(p.binds.join(' ')).toContain('foo')
  })
  it('uses like for short token', () => {
    const p = buildSearchPlan('ab')
    expect(p.mode).toBe('like')
  })
})