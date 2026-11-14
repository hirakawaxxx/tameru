# Deploy

本番は **GitHub `main` + Cloudflare Workers Builds** が正本です。日常の本番反映にローカルから `wrangler deploy` しない運用を想定しています。

対象リポジトリ: [hirakawaxxx/tameru](https://github.com/hirakawaxxx/tameru)（public GitHub）

## Workers Builds（本番の正本）

1. GitHub で public リポジトリを作成し `main` を push
2. Cloudflare Dashboard → Workers & Pages → tameru → Settings → Builds
3. Connect GitHub → リポジトリ選択 → Production branch: `main`
4. Build command: `pnpm install --frozen-lockfile && pnpm exec wrangler deploy`
   （または Dashboard の Build configuration: `pnpm install --frozen-lockfile` + Deploy: `pnpm exec wrangler deploy`）
5. Build variables / secrets: **`ACCESS_AUD`**（本番の Access Application AUD）を Workers の **vars またはシークレット**として Dashboard で設定する。リポの `wrangler.jsonc` には載せない（空文字も置かない）。API token も Dashboard 側のみ。
6. **Preview deployments: Disabled**（v1・Access 無し URL を出さない）
7. `workers.dev` は wrangler.jsonc で `false` — カスタムドメインのみ
8. D1 migrate: 本番反映は merge 前または Build の Deploy command 先頭で
   `pnpm migrate:remote`（Build トークンに D1 Edit 権限）

初回セットアップ後、`main` への merge が Build をトリガーすることを Dashboard で確認してください（手動・一回）。

## Cloudflare Access（ブラウザ + Worker 全体）

- [ ] Zero Trust → Access → Applications → Add `tameru`
- [ ] Domain: `tameru.hirakawaxxx.com`（全体、Bypass パスなし）
- [ ] Policy: Allow — メール `...@...`（owner ポリシー）
- [ ] Application AUD をコピー → Workers シークレット/vars `ACCESS_AUD`（Dashboard のみ）
- [ ] `ACCESS_TEAM_DOMAIN=hirakawaxxx.cloudflareaccess.com`（`wrangler.jsonc` の vars で可）
- [ ] Service Token / Service Auth 利用時: JWT の `email` が Service Token 名になり得る — owner ポリシーはメール許可リストと整合させる

## MCP Portal

- [ ] Access controls → MCP Portals → MCP server
  - URL: `https://tameru.hirakawaxxx.com/mcp`
  - 認証: Service Auth（`CF-Access-Client-Id` / `CF-Access-Client-Secret`）
  - Policy: owner（ログインユーザーに紐づく）
- [ ] Portal ホスト例: `tameru-mcp.hirakawaxxx.com` → 上記 server を登録
- [ ] クライアント登録 URL: `https://tameru-mcp.hirakawaxxx.com/mcp`
- [ ] Service Token 用 Service Auth ポリシーを `tameru` Access アプリに追加

## ローカル MCP

```bash
claude mcp add --transport http tameru http://localhost:8787/mcp
# ヘッダー: X-Tameru-Debug-Owner: you@example.com
```