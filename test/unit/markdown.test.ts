import { describe, it, expect } from 'vitest'
import { parseMarkdownDoc, extractInternalLinks } from '../../src/lib/markdown'

describe('parseMarkdownDoc', () => {
  it('reads yaml front matter', () => {
    const raw = `---
title: Note
description: hi
kind: note
tags: [a, b]
---
# Body\n\nSee [x](/d/01JCN0TE000000000000000001).`
    const p = parseMarkdownDoc(raw)
    expect(p.title).toBe('Note')
    expect(p.kind).toBe('note')
    expect(p.tags).toEqual(['a', 'b'])
    expect(p.links).toContain('01JCN0TE000000000000000001')
  })

  it('falls back to first h1 then 無題', () => {
    expect(parseMarkdownDoc('# Hello\n').title).toBe('Hello')
    expect(parseMarkdownDoc('plain').title).toBe('無題')
  })
})

describe('extractInternalLinks', () => {
  it('captures /d/{ulid} only', () => {
    const ids = extractInternalLinks('[a](/d/01JCAAAAAAAAAAAAAAAAAAAAA1) [b](https://x)')
    expect(ids).toEqual(['01JCAAAAAAAAAAAAAAAAAAAAA1'])
  })
})