import { describe, expect, it } from 'vitest'
import { normalizeTags, parseMarkdownDoc } from '../../src/lib/markdown'

describe('normalizeTags', () => {
  it('dedupes tags case-insensitively before persisting', () => {
    expect(normalizeTags(['Alpha', 'alpha', 'BETA', 'beta '])).toEqual(['Alpha', 'BETA'])
  })

  it('parseMarkdownDoc uses normalized tags', () => {
    const doc = parseMarkdownDoc(`---
tags: [Foo, foo, Bar]
---
# t
`)
    expect(doc.tags).toEqual(['Foo', 'Bar'])
  })
})