import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('viewer shell width', () => {
  it('widens the shell on desktop breakpoints', () => {
    const css = readFileSync('public/viewer.css', 'utf8')
    expect(css).toMatch(/\.viewer-shell\s*\{[^}]*max-width:\s*56rem/s)
    expect(css).toMatch(
      /@media\s*\(min-width:\s*64rem\)\s*\{[^}]*\.viewer-shell\s*\{[^}]*max-width:\s*min\(90rem/s,
    )
  })
})
