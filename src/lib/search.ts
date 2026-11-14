import { SEARCH_MAX_TERMS } from './constants'

export function buildSearchPlan(q: string): {
  mode: 'fts' | 'like'
  binds: string[]
} {
  const terms = q
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, SEARCH_MAX_TERMS)
  if (terms.length === 0) {
    return { mode: 'like', binds: ['%'] }
  }
  if (terms.some((t) => t.length < 3)) {
    return { mode: 'like', binds: [`%${terms.join('%')}%`] }
  }
  const ftsQuery = terms.map((t) => `"${t.replaceAll('"', '')}"`).join(' AND ')
  return { mode: 'fts', binds: [ftsQuery] }
}