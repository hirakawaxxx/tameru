import { describe, it, expect } from 'vitest'
import { isVisibleToOwner } from '../../src/db/docs'

describe('isVisibleToOwner', () => {
  it('rejects wrong owner', () => {
    expect(isVisibleToOwner({ owner: 'a@b.c', deleted_at: null }, 'x@y.z')).toBe(false)
  })

  it('accepts matching owner when not deleted', () => {
    expect(isVisibleToOwner({ owner: 'a@b.c', deleted_at: null }, 'a@b.c')).toBe(true)
  })

  it('rejects when soft-deleted', () => {
    expect(isVisibleToOwner({ owner: 'a@b.c', deleted_at: '2026-01-01T00:00:00.000Z' }, 'a@b.c')).toBe(
      false,
    )
  })
})