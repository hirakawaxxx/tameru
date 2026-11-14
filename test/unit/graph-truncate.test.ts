import { describe, it, expect, vi, afterEach } from 'vitest'
import { getOwnerGraph } from '../../src/db/graph'
import { GRAPH_MAX_NODES } from '../../src/lib/constants'

type DocRow = {
  id: string
  title: string
  kind: string
  links_json: string
}

function mockDb(rows: DocRow[]): D1Database {
  return {
    prepare: () => ({
      bind: () => ({
        all: async () => ({ results: rows }),
      }),
    }),
  } as unknown as D1Database
}

describe('getOwnerGraph', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds nodes and edges from links_json when targets are in the graph', async () => {
    const db = mockDb([
      {
        id: 'A',
        title: 'One',
        kind: 'note',
        links_json: JSON.stringify(['B']),
      },
      {
        id: 'B',
        title: 'Two',
        kind: 'note',
        links_json: '[]',
      },
    ])
    const graph = await getOwnerGraph(db, 'user@example.com')
    expect(graph.truncated).toBe(false)
    expect(graph.nodes).toEqual([
      { id: 'A', title: 'One', kind: 'note' },
      { id: 'B', title: 'Two', kind: 'note' },
    ])
    expect(graph.edges).toEqual([{ from: 'A', to: 'B' }])
  })

  it('omits edges to ids outside the node set', async () => {
    const db = mockDb([
      {
        id: 'A',
        title: 'One',
        kind: 'note',
        links_json: JSON.stringify(['MISSING']),
      },
    ])
    const graph = await getOwnerGraph(db, 'user@example.com')
    expect(graph.edges).toEqual([])
  })

  it('sets truncated and caps nodes at GRAPH_MAX_NODES', async () => {
    const rows: DocRow[] = Array.from({ length: GRAPH_MAX_NODES + 1 }, (_, i) => ({
      id: `id-${i}`,
      title: `t-${i}`,
      kind: 'note',
      links_json: '[]',
    }))
    const db = mockDb(rows)
    const graph = await getOwnerGraph(db, 'user@example.com')
    expect(graph.truncated).toBe(true)
    expect(graph.nodes).toHaveLength(GRAPH_MAX_NODES)
    expect(graph.nodes[0]?.id).toBe('id-0')
    expect(graph.nodes.at(-1)?.id).toBe(`id-${GRAPH_MAX_NODES - 1}`)
  })
})