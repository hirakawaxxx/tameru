import { Hono, type Context } from 'hono'
import type { Env } from '../env'
import type { AuthVariables } from '../middleware/auth'
import { requireAuth } from '../middleware/auth'

const DISCLAIMER_ITEMS = [
  '個人開発であり、予告なく終了・データ消去がありうる',
  '目安として GitHub の Star を歓迎（任意）',
  '機密性・完全性・可用性を保証しない。機微情報を置かない',
  'バックアップ・復旧・SLA なし',
  '違法コンテンツ・他者権利侵害の禁止',
] as const

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function isPublicAssetPath(pathname: string): boolean {
  return (
    /\.(?:css|js|svg|png|woff2|txt|ico)$/i.test(pathname) ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/icons/')
  )
}

function renderShell(options: {
  title: string
  page: 'home' | 'doc' | 'disclaimer'
  docId?: string
  main: string
}): string {
  const docAttr = options.docId
    ? ` data-doc-id="${escapeHtml(options.docId)}"`
    : ''
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.title)} — tameru</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/fonts.css">
  <link rel="stylesheet" href="/tokens.css">
  <link rel="stylesheet" href="/components.css">
  <link rel="stylesheet" href="/viewer.css">
</head>
<body data-page="${options.page}"${docAttr}>
  <div class="viewer-shell">
    <header class="viewer-header">
      <a href="/" class="viewer-brand ui-text-heading">tameru</a>
      <p class="viewer-lead ui-text-caption">エージェントがため、人がつながりを見る Markdown ナレッジ</p>
    </header>
    <main class="viewer-main">
      ${options.main}
    </main>
    <footer class="viewer-footer ui-text-caption">
      <a href="/disclaimer">免責事項</a>
    </footer>
  </div>
  <div id="disclaimer-gate" class="viewer-gate" hidden>
    <div class="viewer-gate__panel ui-card">
      <h2 class="ui-text-heading">はじめに</h2>
      <p class="ui-text-body">tameru を使う前に免責事項への同意が必要です。</p>
      <div class="viewer-gate__actions">
        <a href="/disclaimer" class="ui-button ui-button--secondary">免責を読む</a>
        <button type="button" id="disclaimer-accept" class="ui-button ui-button--primary">同意して続ける</button>
      </div>
    </div>
  </div>
  <script src="/viewer.js" type="module"></script>
</body>
</html>`
}

function disclaimerMain(): string {
  const items = DISCLAIMER_ITEMS.map((t) => `<li>${escapeHtml(t)}</li>`).join('\n    ')
  return `<article class="viewer-disclaimer">
  <h1 class="ui-text-display">免責事項</h1>
  <ol class="ui-text-body">
    ${items}
  </ol>
  <p class="viewer-disclaimer__actions">
    <a href="/" class="ui-button ui-button--secondary">ホームへ</a>
    <button type="button" id="disclaimer-accept-page" class="ui-button ui-button--primary">同意して続ける</button>
  </p>
</article>`
}

function homeMain(): string {
  return `<div class="viewer-home">
  <div class="viewer-toolbar">
    <div class="ui-segmented" role="tablist" aria-label="表示切替">
      <button type="button" class="ui-segmented__item" data-view="list" role="tab" aria-selected="true">リスト</button>
      <button type="button" class="ui-segmented__item" data-view="graph" role="tab" aria-selected="false">グラフ</button>
    </div>
    <label class="viewer-search">
      <span class="ui-visually-hidden">検索</span>
      <input type="search" id="search-input" class="ui-input" placeholder="検索…" autocomplete="off">
    </label>
  </div>
  <section id="view-list" class="viewer-panel" role="tabpanel">
    <p id="list-status" class="ui-text-caption ui-text-muted">読み込み中…</p>
    <ul id="doc-list" class="viewer-doc-list"></ul>
  </section>
  <section id="view-graph" class="viewer-panel" role="tabpanel" hidden>
    <p id="graph-status" class="ui-text-caption ui-text-muted">読み込み中…</p>
    <div class="viewer-graph-wrap">
      <svg id="graph-svg" class="viewer-graph" aria-label="文書リンクのグラフ"></svg>
      <aside id="graph-panel" class="viewer-graph-panel ui-card" hidden></aside>
    </div>
  </section>
</div>`
}

function docMain(): string {
  return `<article class="viewer-doc">
  <p class="ui-text-caption"><a href="/">← 一覧</a></p>
  <div id="doc-content">
    <p class="ui-text-muted">読み込み中…</p>
  </div>
</article>`
}

const VIEWER_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; img-src 'self' data:"

const viewer = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

function viewerHtml(
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
  html: string,
) {
  c.header('Content-Security-Policy', VIEWER_CSP)
  return c.html(html)
}

viewer.use('*', async (c, next) => {
  if (isPublicAssetPath(c.req.path)) {
    const asset = await c.env.ASSETS.fetch(c.req.raw)
    if (asset.status !== 404) return asset
  }
  await next()
})

viewer.get('/disclaimer', (c) =>
  viewerHtml(c, renderShell({ title: '免責事項', page: 'disclaimer', main: disclaimerMain() })),
)

viewer.get('/d/:id', requireAuth, (c) => {
  const id = c.req.param('id')
  return viewerHtml(
    c,
    renderShell({
      title: '文書',
      page: 'doc',
      docId: id,
      main: docMain(),
    }),
  )
})

viewer.get('/', requireAuth, (c) =>
  viewerHtml(c, renderShell({ title: 'ホーム', page: 'home', main: homeMain() })),
)

export default viewer