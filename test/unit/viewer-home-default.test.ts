import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const viewerTs = readFileSync('src/routes/viewer.ts', 'utf8')
const viewerJs = readFileSync('public/viewer.js', 'utf8')

describe('viewer home default and help', () => {
  it('homeMain defaults to graph tab and hides list panel', () => {
    expect(viewerTs).toMatch(/data-view="graph"[^>]*aria-selected="true"/s)
    expect(viewerTs).toMatch(/data-view="list"[^>]*aria-selected="false"/s)
    expect(viewerTs).toMatch(/id="view-list"[^>]*hidden/s)
    expect(viewerTs).not.toMatch(/id="view-graph"[^>]*hidden/s)
  })

  it('view toggle buttons are icon-only with accessible names', () => {
    expect(viewerTs).toMatch(/data-view="list"[^>]*aria-label="リスト"/s)
    expect(viewerTs).toMatch(/data-view="graph"[^>]*aria-label="グラフ"/s)
    expect(viewerTs).toMatch(/viewer-view-icon[^"]*"[^>]*aria-hidden="true"/s)
    expect(viewerTs).not.toMatch(/>\s*リスト\s*<\/button>/)
    expect(viewerTs).not.toMatch(/>\s*グラフ\s*<\/button>/)
  })

  it('registers public /help route and footer link', () => {
    expect(viewerTs).toContain("viewer.get('/help'")
    const helpRouteLine = viewerTs.match(/viewer\.get\('\/help'.*$/m)?.[0] ?? ''
    expect(helpRouteLine).not.toContain('requireAuth')
    expect(viewerTs).toContain('<a href="/help">使い方</a>')
    expect(viewerTs).toContain("page: 'help'")
    expect(viewerTs).toContain('function helpMain()')
  })

  it('preferredView() falls back to graph', () => {
    expect(viewerJs).toMatch(/return 'graph'\s*\n\}/)
    expect(viewerJs).not.toMatch(/return 'list'\s*\n\}/)
  })

  it('skips disclaimer gate fetch on help page', () => {
    expect(viewerJs).toMatch(
      /page === 'disclaimer' \|\| page === 'help'/,
    )
  })

  it('loads list data when switching to list view', () => {
    expect(viewerJs).toMatch(/if \(view === 'list'\)[\s\S]*runSearch/s)
  })
})