import matter from 'gray-matter'
import { extractInternalLinks, MAX_TAGS } from './constants'

export type ParsedDoc = {
  title: string
  description: string
  kind: string
  tags: string[]
  body: string
  links: string[]
}

export { extractInternalLinks }

function firstH1(body: string): string | null {
  const m = body.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : null
}

export function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const tags: string[] = []
  for (const item of input) {
    const tag = String(item).trim()
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
    if (tags.length >= MAX_TAGS) break
  }
  return tags
}

export function parseMarkdownDoc(raw: string): ParsedDoc {
  const { data, content } = matter(raw)
  const body = content.trim()
  const title =
    (typeof data.title === 'string' && data.title.trim()) ||
    firstH1(body) ||
    '無題'
  const description =
    typeof data.description === 'string' ? data.description.trim() : ''
  const kind =
    typeof data.kind === 'string' && data.kind.trim() ? data.kind.trim() : 'doc'
  const tags = normalizeTags(data.tags)
  const links = extractInternalLinks(raw)
  return { title, description, kind, tags, body, links }
}