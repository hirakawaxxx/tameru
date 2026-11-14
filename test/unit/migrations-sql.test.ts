import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

describe('0001_init.sql', () => {
  const sql = readFileSync('migrations/0001_init.sql', 'utf8')
  it('defines core tables', () => {
    expect(sql).toMatch(/CREATE TABLE users/)
    expect(sql).toMatch(/CREATE TABLE docs/)
    expect(sql).toMatch(/CREATE VIRTUAL TABLE docs_fts/)
    expect(sql).toMatch(/tokenize='trigram'/)
  })
})