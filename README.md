# tameru

エージェント向け MCP（Model Context Protocol）と、人向け Web Viewer を備えた Markdown ナレッジベースです。

個人開発のサービスです。本番では `/disclaimer` に免責があります。SLA はなく、機微情報は置かないでください。

## 現状

設計は `docs/superpowers/specs/`、実装計画は `docs/superpowers/plans/` に置きます。

## design-kit（Soft Mint）

`design/` にアプリ名・モチーフを置き、隣の `design-kit` で `public/` を生成します。

```bash
node ../design-kit/bin/design-kit.mjs all
node ../design-kit/bin/design-kit.mjs check
```

`tokens.css` / `components.css` / `fonts.css` は手編集せず `sync` で揃えます。

## 開発メモ

- ローカル: `wrangler dev` とローカル D1
- 本番デプロイ・Access・MCP: [docs/deploy.md](docs/deploy.md)（Workers Builds、Cloudflare Access、MCP Portal）
- ブランチ戦略・PR ルール: [CONTRIBUTING.md](CONTRIBUTING.md)

### 初回のみ（Cloudflare D1）

```bash
pnpm wrangler d1 create tameru --location apac
# 出力の database_id を wrangler.jsonc に貼る
pnpm migrate:local
pnpm dev
```

`GET http://localhost:8787/health` が 200 なら OK。
