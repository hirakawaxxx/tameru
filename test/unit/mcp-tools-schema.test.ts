import { describe, it, expect } from 'vitest'
import { MCP_TOOL_NAMES } from '../../src/mcp/tools/index'
import { MCP_INSTRUCTIONS } from '../../src/mcp/server'

describe('MCP tools', () => {
  it('exports required tools', () => {
    expect([...MCP_TOOL_NAMES].sort()).toEqual(
      ['browse', 'delete_doc', 'get_doc', 'search', 'upsert_doc'].sort(),
    )
  })

  it('includes disclaimer in server instructions', () => {
    expect(MCP_INSTRUCTIONS).toContain('免責')
    expect(MCP_INSTRUCTIONS).toContain('/disclaimer')
  })
})