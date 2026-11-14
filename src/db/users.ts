export type UserRow = {
  owner: string
  disclaimer_version: string
  disclaimer_accepted_at: string | null
}

export function disclaimerAccepted(
  row: Pick<UserRow, 'disclaimer_version' | 'disclaimer_accepted_at'> | null,
  required: string,
): boolean {
  if (!row?.disclaimer_accepted_at) return false
  return row.disclaimer_version === required
}

export async function ensureUser(db: D1Database, owner: string): Promise<UserRow> {
  const existing = await db
    .prepare(
      'SELECT owner, disclaimer_version, disclaimer_accepted_at FROM users WHERE owner = ?',
    )
    .bind(owner)
    .first<UserRow>()
  if (existing) return existing
  await db.prepare('INSERT OR IGNORE INTO users (owner) VALUES (?)').bind(owner).run()
  const after = await db
    .prepare(
      'SELECT owner, disclaimer_version, disclaimer_accepted_at FROM users WHERE owner = ?',
    )
    .bind(owner)
    .first<UserRow>()
  if (after) return after
  return {
    owner,
    disclaimer_version: '0',
    disclaimer_accepted_at: null,
  }
}

export async function acceptDisclaimer(
  db: D1Database,
  owner: string,
  version: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE users SET disclaimer_version = ?, disclaimer_accepted_at = datetime('now') WHERE owner = ?`,
    )
    .bind(version, owner)
    .run()
}