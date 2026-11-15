import { Hono, type Context } from 'hono'
import type { Env } from '../env'
import type { AuthVariables } from '../middleware/auth'
import { requireAuth } from '../middleware/auth'
import { renderDisclaimerScrollRegion } from '../lib/disclaimer'

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
  page: 'home' | 'doc' | 'disclaimer' | 'help'
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
      <a href="/help">使い方</a>
      <a href="/disclaimer">免責事項</a>
    </footer>
  </div>
  <div id="disclaimer-gate" class="viewer-gate" hidden>
    <div class="viewer-gate__panel ui-card">
      <h2 class="ui-text-heading">免責事項</h2>
      <p class="ui-text-body">tameru を使う前に、以下の免責事項を最後までお読みのうえ同意してください。</p>
      ${renderDisclaimerScrollRegion('gate')}
      <p id="disclaimer-accept-status" class="viewer-disclaimer__status ui-text-caption" role="alert" hidden></p>
      <div class="viewer-gate__actions">
        <button type="button" id="disclaimer-accept" class="ui-button ui-button--primary" disabled>同意して続ける</button>
      </div>
    </div>
  </div>
  <script src="/viewer.js" type="module"></script>
</body>
</html>`
}

function disclaimerMain(): string {
  return `<article class="viewer-disclaimer">
  <h1 class="ui-text-display">免責事項</h1>
  ${renderDisclaimerScrollRegion()}
  <p id="disclaimer-accept-page-status" class="viewer-disclaimer__status ui-text-caption" role="alert" hidden></p>
  <p class="viewer-disclaimer__actions">
    <a href="/" class="ui-button ui-button--secondary">ホームへ</a>
    <button type="button" id="disclaimer-accept-page" class="ui-button ui-button--primary" disabled>同意して続ける</button>
  </p>
</article>`
}

const LIST_VIEW_ICON = `<svg class="viewer-view-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/></svg>`

const GRAPH_VIEW_ICON = `<svg class="viewer-view-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><line x1="7" y1="6" x2="13" y2="10"/><line x1="13" y1="10" x2="7" y2="14"/><circle cx="7" cy="6" r="2.5" fill="currentColor" stroke="none"/><circle cx="13" cy="10" r="2.5" fill="currentColor" stroke="none"/><circle cx="7" cy="14" r="2.5" fill="currentColor" stroke="none"/></svg>`

function homeMain(): string {
  return `<div class="viewer-home">
  <div class="viewer-toolbar">
    <div class="ui-segmented" role="tablist" aria-label="表示切替">
      <button type="button" class="ui-segmented__item" data-view="list" role="tab" aria-selected="false" aria-label="リスト" title="リスト">${LIST_VIEW_ICON}</button>
      <button type="button" class="ui-segmented__item" data-view="graph" role="tab" aria-selected="true" aria-label="グラフ" title="グラフ">${GRAPH_VIEW_ICON}</button>
    </div>
    <label class="viewer-search">
      <span class="ui-visually-hidden">検索</span>
      <input type="search" id="search-input" class="ui-input" placeholder="検索…" autocomplete="off">
    </label>
  </div>
  <section id="view-list" class="viewer-panel" role="tabpanel" hidden>
    <p id="list-status" class="ui-text-caption ui-text-muted">読み込み中…</p>
    <ul id="doc-list" class="viewer-doc-list"></ul>
  </section>
  <section id="view-graph" class="viewer-panel" role="tabpanel">
    <p id="graph-status" class="ui-text-caption ui-text-muted">読み込み中…</p>
    <div class="viewer-graph-wrap">
      <svg id="graph-svg" class="viewer-graph" aria-label="文書リンクのグラフ"></svg>
      <aside id="graph-panel" class="viewer-graph-panel ui-card" hidden></aside>
    </div>
  </section>
</div>`
}

function helpMain(): string {
  return `<article class="viewer-help">
  <h1 class="ui-text-display">使い方</h1>
  <div class="viewer-help__body ui-text-body">
    <p>tameru は、コーディングエージェントが <strong>MCP</strong> で Markdown 文書をため、人が <strong>Viewer</strong>（このブラウザ画面）で読むためのナレッジベースです。</p>
    <h2 class="ui-text-heading">ホーム画面</h2>
    <p>初回表示は<strong>グラフ</strong>が既定です。ツールバーのアイコンで<strong>リスト</strong>（一覧・検索）に切り替えられます。前回の表示はブラウザに記憶されます（<code>?view=list</code> / <code>?view=graph</code> でも指定できます）。</p>
    <h2 class="ui-text-heading">MCP ツール（書き込みの本線）</h2>
    <ul>
      <li><code>upsert_doc</code> — Markdown を作成・更新</li>
      <li><code>browse</code> — 索引や文書ツリーを探索</li>
      <li><code>search</code> — 全文検索</li>
      <li><code>get_doc</code> — 1 件取得</li>
      <li><code>delete_doc</code> — 論理削除</li>
    </ul>
    <h2 class="ui-text-heading">接続の目安</h2>
    <p>MCP クライアントからは、デプロイ先と同じオリジンの <code>/mcp</code> エンドポイントに接続します（ローカル開発では <code>wrangler dev</code> の URL を使います）。機微情報や個人データは置かないでください。詳しくは <a href="/disclaimer">免責事項</a> をお読みください。</p>
  </div>
  <p class="viewer-help__actions">
    <a href="/" class="ui-button ui-button--secondary">ホームへ</a>
  </p>
</article>`
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

viewer.get('/help', (c) =>
  viewerHtml(c, renderShell({ title: '使い方', page: 'help', main: helpMain() })),
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