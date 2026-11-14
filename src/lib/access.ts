import { createRemoteJWKSet, jwtVerify } from 'jose'

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

export function normalizeOwner(email: string): string {
  return email.trim().toLowerCase()
}

export function ownerFromDevHeaders(opts: {
  host: string
  accessAud: string
  debugOwner?: string | null
}): string | null {
  const isLocal =
    opts.host.startsWith('localhost') || opts.host.startsWith('127.0.0.1')
  if (!isLocal || opts.accessAud) return null
  if (!opts.debugOwner) return null
  return normalizeOwner(opts.debugOwner)
}

export async function verifyAccessJwt(
  token: string,
  teamDomain: string,
  aud: string,
): Promise<string> {
  const url = `https://${teamDomain}/cdn-cgi/access/certs`
  jwks ??= createRemoteJWKSet(new URL(url))
  const { payload } = await jwtVerify(token, jwks, {
    audience: aud,
    issuer: `https://${teamDomain}`,
  })
  const email = payload.email
  if (typeof email !== 'string' || !email) throw new Error('missing email')
  return normalizeOwner(email)
}