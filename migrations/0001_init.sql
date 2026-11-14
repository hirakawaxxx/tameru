-- migrations/0001_init.sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  owner TEXT PRIMARY KEY NOT NULL,
  disclaimer_version TEXT NOT NULL DEFAULT '0',
  disclaimer_accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE docs (
  id TEXT PRIMARY KEY NOT NULL,
  owner TEXT NOT NULL,
  slug TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'doc',
  tags_json TEXT NOT NULL DEFAULT '[]',
  body_md TEXT NOT NULL,
  hash TEXT NOT NULL,
  links_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE INDEX idx_docs_owner_updated
  ON docs(owner, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_docs_owner_kind
  ON docs(owner, kind)
  WHERE deleted_at IS NULL;

CREATE TABLE doc_tags (
  owner TEXT NOT NULL,
  tag TEXT NOT NULL COLLATE NOCASE,
  doc_id TEXT NOT NULL,
  PRIMARY KEY (owner, tag, doc_id),
  FOREIGN KEY (doc_id) REFERENCES docs(id)
);

CREATE VIRTUAL TABLE docs_fts USING fts5(
  doc_id UNINDEXED,
  owner UNINDEXED,
  title,
  description,
  tags,
  body,
  tokenize='trigram'
);

CREATE TRIGGER docs_ai AFTER INSERT ON docs WHEN NEW.deleted_at IS NULL BEGIN
  INSERT INTO docs_fts(doc_id, owner, title, description, tags, body)
  VALUES (
    NEW.id,
    NEW.owner,
    NEW.title,
    NEW.description,
    (SELECT group_concat(value, ' ') FROM json_each(NEW.tags_json)),
    NEW.body_md
  );
END;

CREATE TRIGGER docs_au AFTER UPDATE ON docs BEGIN
  DELETE FROM docs_fts WHERE doc_id = OLD.id;
  INSERT INTO docs_fts(doc_id, owner, title, description, tags, body)
  SELECT NEW.id, NEW.owner, NEW.title, NEW.description,
    (SELECT group_concat(value, ' ') FROM json_each(NEW.tags_json)),
    NEW.body_md
  WHERE NEW.deleted_at IS NULL;
END;

CREATE TRIGGER docs_ad AFTER DELETE ON docs BEGIN
  DELETE FROM docs_fts WHERE doc_id = OLD.id;
END;