export type BrowseTarget =
  | { kind: 'root' }
  | { kind: 'recent' }
  | { kind: 'kinds' }
  | { kind: 'kind'; value: string }
  | { kind: 'tags' }
  | { kind: 'tag'; value: string }

export function resolveBrowsePath(raw: string): BrowseTarget {
  const p = raw.replace(/\/+$/, '') || '/'
  if (p === '/') return { kind: 'root' }
  if (p === '/recent') return { kind: 'recent' }
  if (p === '/kind') return { kind: 'kinds' }
  if (p.startsWith('/kind/')) return { kind: 'kind', value: decodeURIComponent(p.slice(6)) }
  if (p === '/tags') return { kind: 'tags' }
  if (p.startsWith('/tags/')) return { kind: 'tag', value: decodeURIComponent(p.slice(6)) }
  return { kind: 'root' }
}