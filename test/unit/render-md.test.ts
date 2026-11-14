import { describe, it, expect } from 'vitest'
import { renderMarkdownToHtml } from '../../src/lib/render-md'

describe('renderMarkdownToHtml', () => {
  it('escapes raw script-like HTML', () => {
    const html = renderMarkdownToHtml('<script>alert(1)</script>\n\nok')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('keeps internal /d/ links and drops external hrefs', () => {
    const html = renderMarkdownToHtml(
      '[in](/d/01JCAAAAAAAAAAAAAAAAAAAAA1) [out](https://evil.example)',
    )
    expect(html).toContain('href="/d/01JCAAAAAAAAAAAAAAAAAAAAA1"')
    expect(html).toContain('href="#"')
    expect(html).not.toContain('https://evil.example')
  })

  it('allows /disclaimer links', () => {
    const html = renderMarkdownToHtml('[免責](/disclaimer)')
    expect(html).toContain('href="/disclaimer"')
  })

  it('escapes HTML in link label text', () => {
    const html = renderMarkdownToHtml(
      '[<img onerror=alert(1) src=x>](/d/01JCAAAAAAAAAAAAAAAAAAAAA1)',
    )
    expect(html).not.toMatch(/<img\b/i)
    expect(html).toContain('&lt;img')
    expect(html).toContain('onerror')
  })
})