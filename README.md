# tameru

エージェント向け MCP（Model Context Protocol）と、人向け Web Viewer を備えた Markdown ナレッジベースです。

個人開発のサービスです。本番では `/disclaimer` に免責があります。SLA はなく、機微情報は置かないでください。

## 現状

設計は `docs/superpowers/specs/`、実装計画は `docs/superpowers/plans/` に置きます。

## 開発メモ

- ローカル: `wrangler dev` とローカル D1
- 本番デプロイ: GitHub の `main` を Cloudflare Workers Builds に連携（日常の本番 ship は `wrangler deploy` に依存しない）

### 初回のみ（Cloudflare D1）

```bash
pnpm wrangler d1 create tameru --location apac
# 出力の database_id を wrangler.jsonc に貼る
pnpm migrate:local
pnpm dev
```

`GET http://localhost:8787/health` が 200 なら OK。
