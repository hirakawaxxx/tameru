import { describe, it, expect } from 'vitest'
import { ownerFromDevHeaders } from '../../src/lib/access'

describe('ownerFromDevHeaders', () => {
  it('uses X-Tameru-Debug-Owner on localhost when ACCESS_AUD empty', () => {
    const owner = ownerFromDevHeaders({
      host: 'localhost:8787',
      accessAud: '',
      debugOwner: '  Alice@Example.COM ',
    })
    expect(owner).toBe('alice@example.com')
  })
})