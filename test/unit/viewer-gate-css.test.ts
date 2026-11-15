import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('viewer-gate CSS', () => {
  it('hides .viewer-gate when [hidden] despite display:flex', () => {
    const css = readFileSync('public/viewer.css', 'utf8')
    expect(css).toMatch(/\.viewer-gate\s*\{[^}]*display:\s*flex/s)
    expect(css).toMatch(/\.viewer-gate\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s)
  })
})
