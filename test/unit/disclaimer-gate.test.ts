import { describe, it, expect } from 'vitest'
import { disclaimerAccepted } from '../../src/db/users'

describe('disclaimerAccepted', () => {
  it('false when version mismatch', () => {
    expect(
      disclaimerAccepted(
        { disclaimer_version: 'old', disclaimer_accepted_at: 'x' },
        '2026-11-14-v1',
      ),
    ).toBe(false)
  })
  it('true when versions match and accepted_at set', () => {
    expect(
      disclaimerAccepted(
        { disclaimer_version: '2026-11-14-v1', disclaimer_accepted_at: 'x' },
        '2026-11-14-v1',
      ),
    ).toBe(true)
  })
})