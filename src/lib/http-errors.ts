import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export const ERROR_CODES = {
  unauthorized: 'unauthorized',
  disclaimer_required: 'disclaimer_required',
  not_found: 'not_found',
  validation_failed: 'validation_failed',
  too_large: 'too_large',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/** Design doc §13 — HTTP status for each API error code. */
export const ERROR_HTTP_STATUS: Record<ErrorCode, ContentfulStatusCode> = {
  unauthorized: 401,
  disclaimer_required: 403,
  not_found: 404,
  validation_failed: 400,
  too_large: 413,
}

export function errorJson(code: ErrorCode) {
  return { error: code }
}

export function jsonApiError(c: Context, code: ErrorCode) {
  return c.json(errorJson(code), ERROR_HTTP_STATUS[code])
}

/** MCP tools embed the intended HTTP-equivalent status in JSON. */
export function mcpErrorJson(code: ErrorCode) {
  return { ...errorJson(code), status: ERROR_HTTP_STATUS[code] }
}