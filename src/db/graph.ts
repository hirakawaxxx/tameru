import { GRAPH_MAX_NODES } from '../lib/constants'

export type GraphNode = { id: string; title: string; kind: string }
export type GraphEdge = { from: string; to: string }

export async function getOwnerGraph(
  db: D1Database,
  owner: string,
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[]; truncated: boolean }> {
  const { results } = await db
    .prepare(
      `SELECT id, title, kind, links_json FROM docs
       WHERE owner = ? AND deleted_at IS NULL ORDER BY updated_at DESC`,
    )
    .bind(owner)
    .all<{ id: string; title: string; kind: string; links_json: string }>()
  const rows = results ?? []
  const truncated = rows.length > GRAPH_MAX_NODES
  const slice = truncated ? rows.slice(0, GRAPH_MAX_NODES) : rows
  const nodes = slice.map((r) => ({ id: r.id, title: r.title, kind: r.kind }))
  const idSet = new Set(nodes.map((n) => n.id))
  const edges: GraphEdge[] = []
  for (const row of slice) {
    const links: string[] = JSON.parse(row.links_json || '[]')
    for (const to of links) {
      if (idSet.has(to)) edges.push({ from: row.id, to })
    }
  }
  return { nodes, edges, truncated }
}