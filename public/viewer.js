const VIEW_KEY = 'tameru-view'

function preferredView() {
  const q = new URLSearchParams(location.search).get('view')
  if (q === 'list' || q === 'graph') return q
  const stored = localStorage.getItem(VIEW_KEY)
  if (stored === 'list' || stored === 'graph') return stored
  return 'list'
}

function setView(view) {
  localStorage.setItem(VIEW_KEY, view)
  const list = document.getElementById('view-list')
  const graph = document.getElementById('view-graph')
  const tabs = document.querySelectorAll('[data-view]')
  if (!list || !graph) return
  list.hidden = view !== 'list'
  graph.hidden = view !== 'graph'
  tabs.forEach((el) => {
    const on = el.getAttribute('data-view') === view
    el.setAttribute('aria-selected', on ? 'true' : 'false')
  })
  const url = new URL(location.href)
  url.searchParams.set('view', view)
  history.replaceState(null, '', url)
  if (view === 'graph') loadGraph()
}

async function acceptDisclaimer() {
  const res = await fetch('/api/me/disclaimer', { method: 'POST' })
  if (!res.ok) return
  location.reload()
}

async function initDisclaimerGate() {
  const gate = document.getElementById('disclaimer-gate')
  const page = document.body.dataset.page
  const acceptBtn = document.getElementById('disclaimer-accept')
  const acceptPage = document.getElementById('disclaimer-accept-page')

  acceptBtn?.addEventListener('click', () => void acceptDisclaimer())
  acceptPage?.addEventListener('click', () => void acceptDisclaimer())

  if (page === 'disclaimer') return

  try {
    const res = await fetch('/api/me')
    if (!res.ok) return
    const me = await res.json()
    if (me.disclaimer_accepted) return
    if (gate) gate.hidden = false
  } catch {
    /* ignore */
  }
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function renderDocList(items) {
  const ul = document.getElementById('doc-list')
  const status = document.getElementById('list-status')
  if (!ul) return
  ul.innerHTML = ''
  if (!items.length) {
    if (status) status.textContent = '文書がありません。MCP で upsert_doc するとここに並びます。'
    return
  }
  if (status) status.textContent = `${items.length} 件`
  for (const d of items) {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.href = `/d/${d.id}`
    a.innerHTML = `<span class="ui-text-heading">${escapeHtml(d.title || d.id)}</span>
      <span class="doc-meta ui-text-caption ui-text-muted">${escapeHtml(d.kind || '')} · 更新 ${formatDate(d.updated_at)}</span>`
    li.append(a)
    ul.append(li)
  }
}

function escapeHtml(text) {
  const d = document.createElement('div')
  d.textContent = text ?? ''
  return d.innerHTML
}

let searchTimer
async function runSearch(q) {
  const status = document.getElementById('list-status')
  try {
    const url = q ? `/api/search?q=${encodeURIComponent(q)}` : '/api/docs'
    const res = await fetch(url)
    if (res.status === 403) {
      if (status) status.textContent = '免責への同意が必要です。'
      return
    }
    if (!res.ok) throw new Error('fetch failed')
    const data = await res.json()
    renderDocList(data.items ?? [])
  } catch {
    if (status) status.textContent = '読み込みに失敗しました。'
  }
}

function initHome() {
  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => setView(btn.getAttribute('data-view')))
  })
  const search = document.getElementById('search-input')
  search?.addEventListener('input', () => {
    clearTimeout(searchTimer)
    const q = search.value.trim()
    searchTimer = setTimeout(() => void runSearch(q), 250)
  })
  setView(preferredView())
  if (preferredView() === 'list') void runSearch('')
}

let graphLoaded = false
async function loadGraph() {
  if (graphLoaded) return
  const status = document.getElementById('graph-status')
  const svg = document.getElementById('graph-svg')
  if (!svg) return
  try {
    const res = await fetch('/api/graph')
    if (res.status === 403) {
      if (status) status.textContent = '免責への同意が必要です。'
      return
    }
    if (!res.ok) throw new Error('graph')
    const data = await res.json()
    graphLoaded = true
    drawGraph(svg, data, status)
  } catch {
    if (status) status.textContent = 'グラフの読み込みに失敗しました。'
  }
}

function drawGraph(svg, data, statusEl) {
  const nodes = data.nodes ?? []
  const edges = data.edges ?? []
  if (!nodes.length) {
    if (statusEl) {
      statusEl.textContent =
        'まだつながりがありません。MCP で upsert_doc し、/d/{id} リンクを書くとグラフが育ちます。'
    }
    return
  }
  if (statusEl) {
    statusEl.textContent = data.truncated
      ? `${nodes.length} ノード（上限で切り詰め）`
      : `${nodes.length} ノード · ${edges.length} リンク`
  }

  const w = svg.clientWidth || 640
  const h = svg.clientHeight || 480
  const cx = w / 2
  const cy = h / 2
  const r = Math.min(w, h) * 0.38
  const byId = new Map(nodes.map((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2
    return [n.id, { ...n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }]
  }))

  while (svg.firstChild) svg.removeChild(svg.firstChild)
  const ns = 'http://www.w3.org/2000/svg'
  for (const e of edges) {
    const a = byId.get(e.from)
    const b = byId.get(e.to)
    if (!a || !b) continue
    const line = document.createElementNS(ns, 'line')
    line.setAttribute('x1', String(a.x))
    line.setAttribute('y1', String(a.y))
    line.setAttribute('x2', String(b.x))
    line.setAttribute('y2', String(b.y))
    line.setAttribute('stroke', 'var(--color-border-strong, #9ab)')
    line.setAttribute('stroke-width', '1')
    svg.append(line)
  }
  for (const n of byId.values()) {
    const g = document.createElementNS(ns, 'g')
    g.classList.add('graph-node')
    g.setAttribute('tabindex', '0')
    g.dataset.id = n.id
    const circle = document.createElementNS(ns, 'circle')
    circle.setAttribute('cx', String(n.x))
    circle.setAttribute('cy', String(n.y))
    circle.setAttribute('r', '10')
    circle.setAttribute('fill', 'var(--color-primary)')
    const label = document.createElementNS(ns, 'text')
    label.setAttribute('x', String(n.x))
    label.setAttribute('y', String(n.y + 22))
    label.setAttribute('text-anchor', 'middle')
    label.setAttribute('font-size', '11')
    label.setAttribute('fill', 'var(--color-text)')
    label.textContent = (n.title || n.id).slice(0, 24)
    g.append(circle, label)
    g.addEventListener('click', () => showGraphPanel(n))
    g.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        showGraphPanel(n)
      }
    })
    svg.append(g)
  }
}

function showGraphPanel(node) {
  const panel = document.getElementById('graph-panel')
  if (!panel) return
  panel.hidden = false
  panel.innerHTML = `
    <h3 class="ui-text-heading">${escapeHtml(node.title || node.id)}</h3>
    <p class="ui-text-caption ui-text-muted">${escapeHtml(node.kind || '')}</p>
    <p><a class="ui-button ui-button--primary" href="/d/${encodeURIComponent(node.id)}">文書を開く</a></p>`
}

async function initDoc() {
  const id = document.body.dataset.docId
  const mount = document.getElementById('doc-content')
  if (!id || !mount) return
  try {
    const res = await fetch(`/api/docs/${encodeURIComponent(id)}`)
    if (res.status === 404) {
      mount.innerHTML = '<p class="ui-text-body">文書が見つかりません。</p>'
      return
    }
    if (res.status === 403) {
      mount.innerHTML = '<p class="ui-text-body">免責への同意が必要です。</p>'
      return
    }
    if (!res.ok) throw new Error('doc')
    const d = await res.json()
    const links = (d.links ?? [])
      .map((x) => `<li><a href="/d/${encodeURIComponent(x)}">${escapeHtml(x)}</a></li>`)
      .join('')
    const backlinks = (d.backlinks ?? [])
      .map((b) => `<li><a href="/d/${encodeURIComponent(b.id)}">${escapeHtml(b.title || b.id)}</a></li>`)
      .join('')
    mount.innerHTML = `
      <h1 class="ui-text-display">${escapeHtml(d.title || d.id)}</h1>
      <p class="ui-text-caption ui-text-muted">${escapeHtml(d.kind || '')} · 更新 ${formatDate(d.updated_at)}</p>
      ${d.description ? `<p class="ui-text-body">${escapeHtml(d.description)}</p>` : ''}
      <div class="doc-body ui-text-body">${d.body_html ?? ''}</div>
      ${links ? `<section><h2 class="ui-text-heading">リンク</h2><ul>${links}</ul></section>` : ''}
      ${backlinks ? `<section><h2 class="ui-text-heading">バックリンク</h2><ul>${backlinks}</ul></section>` : ''}`
  } catch {
    mount.innerHTML = '<p class="ui-text-body">読み込みに失敗しました。</p>'
  }
}

function init() {
  void initDisclaimerGate()
  const page = document.body.dataset.page
  if (page === 'home') initHome()
  if (page === 'doc') void initDoc()
}

init()