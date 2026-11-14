import { describe, it, expect } from 'vitest'
import { resolveBrowsePath } from '../../src/lib/browse-paths'

describe('resolveBrowsePath', () => {
  it('parses tag path', () => {
    expect(resolveBrowsePath('/tags/design/')).toEqual({ kind: 'tag', value: 'design' })
  })

  it('parses root and section paths', () => {
    expect(resolveBrowsePath('/')).toEqual({ kind: 'root' })
    expect(resolveBrowsePath('/recent/')).toEqual({ kind: 'recent' })
    expect(resolveBrowsePath('/kind')).toEqual({ kind: 'kinds' })
    expect(resolveBrowsePath('/kind/note/')).toEqual({ kind: 'kind', value: 'note' })
    expect(resolveBrowsePath('/tags')).toEqual({ kind: 'tags' })
  })

  it('decodes encoded kind segments', () => {
    expect(resolveBrowsePath('/kind/a%20b/')).toEqual({ kind: 'kind', value: 'a b' })
  })
})