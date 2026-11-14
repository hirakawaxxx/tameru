import { describe, expect, it } from 'vitest'
import { mcpSseShowsToolValidationFailure } from '../../src/mcp/response-policy'

describe('mcpSseShowsToolValidationFailure', () => {
  it('detects JSON-RPC invalid params', () => {
    const sse = 'event: message\ndata: {"jsonrpc":"2.0","id":1,"error":{"code":-32602,"message":"Invalid"}}'
    expect(mcpSseShowsToolValidationFailure(sse)).toBe(true)
  })

  it('ignores app tool errors with error code payload', () => {
    const sse =
      'data: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"{\\"error\\":\\"not_found\\",\\"status\\":404}"}],"isError":true}}'
    expect(mcpSseShowsToolValidationFailure(sse)).toBe(false)
  })
})