import { BODY_MAX_BYTES, BROWSE_MAX } from '../lib/constants'
import { buildSearchPlan } from '../lib/search'
import { parseMarkdownDoc } from '../lib/markdown'
import { sha256Hex } from '../lib/hash'

export type DocRow = {
  id: string
  owner: string
  slug: string | null
  title: string
  description: string
  kind: string
  tags_json: string
  body_md: string
  hash: string
  links_json: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export function isVisibleToOwner(
  row: Pick<DocRow, 'owner' | 'deleted_at'>,
  owner: string,
): boolean {
  return row.owner === owner && row.deleted_at == null
}

export async function searchDocs(
  db: D1Database,
  owner: string,
  q: string,
  limit: number = BROWSE_MAX,
): Promise<DocRow[]> {
  const plan = buildSearchPlan(q)
  if (plan.mode === 'fts') {
    const result = await db
      .prepare(
        `SELECT d.* FROM docs_fts f
         JOIN docs d ON d.id = f.doc_id
         WHERE f.owner = ? AND docs_fts MATCH ?
           AND d.deleted_at IS NULL
         ORDER BY rank
         LIMIT ?`,
      )
      .bind(owner, plan.binds[0], limit)
      .all<DocRow>()
    return result.results ?? []
  }
  const pattern = plan.binds[0]
  const result = await db
    .prepare(
      `SELECT * FROM docs
       WHERE owner = ? AND deleted_at IS NULL
         AND (title LIKE ? OR description LIKE ? OR body_md LIKE ?)
       LIMIT ?`,
    )
    .bind(owner, pattern, pattern, pattern, limit)
    .all<DocRow>()
  return result.results ?? []
}

export async function getDocForOwner(
  db: D1Database,
  owner: string,
  id: string,
): Promise<DocRow | null> {
  const row = await db.prepare('SELECT * FROM docs WHERE id = ?').bind(id).first<DocRow>()
  if (!row || !isVisibleToOwner(row, owner)) return null
  return row
}

export async function softDeleteDoc(
  db: D1Database,
  owner: string,
  id: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE docs SET deleted_at = ? WHERE id = ? AND owner = ? AND deleted_at IS NULL`,
    )
    .bind(new Date().toISOString(), id, owner)
    .run()
  return (result.meta.changes ?? 0) > 0
}

export async function upsertDoc(
  db: D1Database,
  owner: string,
  args: { id?: string; markdown: string },
): Promise<
  | { status: 'created' | 'updated'; id: string }
  | { status: 'unchanged'; id: string }
  | { status: 'not_found' }
  | { status: 'too_large' }
> {
  const bytes = new TextEncoder().encode(args.markdown).byteLength
  if (bytes > BODY_MAX_BYTES) return { status: 'too_large' }
  const parsed = parseMarkdownDoc(args.markdown)
  const hash = await sha256Hex(args.markdown)
  const { ulid } = await import('ulid')
  const id = args.id ?? ulid()
  if (args.id) {
    const row = await db
      .prepare('SELECT owner, hash, deleted_at FROM docs WHERE id = ?')
      .bind(id)
      .first<{ owner: string; hash: string; deleted_at: string | null }>()
    if (!row || row.owner !== owner || row.deleted_at) return { status: 'not_found' as const }
    if (row.hash === hash) return { status: 'unchanged', id }
  }
  const tagsJson = JSON.stringify(parsed.tags)
  const linksJson = JSON.stringify(parsed.links)
  const now = new Date().toISOString()
  await db.batch([
    db
      .prepare(
        `INSERT INTO docs (id, owner, title, description, kind, tags_json, body_md, hash, links_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title, description=excluded.description, kind=excluded.kind,
           tags_json=excluded.tags_json, body_md=excluded.body_md, hash=excluded.hash,
           links_json=excluded.links_json, updated_at=excluded.updated_at
         WHERE owner = excluded.owner AND deleted_at IS NULL`,
      )
      .bind(
        id,
        owner,
        parsed.title,
        parsed.description,
        parsed.kind,
        tagsJson,
        args.markdown,
        hash,
        linksJson,
        now,
        now,
      ),
    db.prepare('DELETE FROM doc_tags WHERE owner = ? AND doc_id = ?').bind(owner, id),
    ...parsed.tags.map((tag) =>
      db.prepare('INSERT INTO doc_tags (owner, tag, doc_id) VALUES (?, ?, ?)').bind(owner, tag, id),
    ),
  ])
  const created = !args.id
  return { status: created ? 'created' : 'updated', id }
}