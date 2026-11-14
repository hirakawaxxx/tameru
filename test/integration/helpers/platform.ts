import { getPlatformProxy, type PlatformProxy } from 'wrangler'
import type { Env } from '../../../src/env'

export const TEST_DISCLAIMER_VERSION = '2026-11-14-v1'

export async function openTestPlatform(): Promise<PlatformProxy<Env>> {
  return getPlatformProxy<Env>({ configPath: 'wrangler.jsonc' })
}

export function testEnv(proxy: PlatformProxy<Env>): Env {
  return {
    ...proxy.env,
    ACCESS_AUD: '',
    DISCLAIMER_VERSION: TEST_DISCLAIMER_VERSION,
  }
}

export function authHeaders(owner: string): Record<string, string> {
  return {
    host: 'localhost:8787',
    'X-Tameru-Debug-Owner': owner,
  }
}