# Deploy

本番は **GitHub `main` + Cloudflare Workers Builds** が正本です。日常の本番反映にローカルから `wrangler deploy` しない運用を想定しています。

対象リポジトリ: [hirakawaxxx/tameru](https://github.com/hirakawaxxx/tameru)（public GitHub）

## Workers Builds（本番の正本）

1. GitHub で public リポジトリを作成し `main` を push
2. Cloudflare Dashboard → Workers & Pages → tameru → Settings → Builds
3. Connect GitHub → リポジトリ選択 → Production branch: `main`
4. Build command: `pnpm install --frozen-lockfile && pnpm exec wrangler deploy`
   （または Dashboard の Build configuration: `pnpm install --frozen-lockfile` + Deploy: `pnpm exec wrangler deploy`）
5. Build variables / secrets: `ACCESS_AUD`（本番 AUD）、API token は Dashboard 側（リポに置かない）
6. **Preview deployments: Disabled**（v1・Access 無し URL を出さない）
7. `workers.dev` は wrangler.jsonc で `false` — カスタムドメインのみ
8. D1 migrate: 本番反映は merge 前または Build の Deploy command 先頭で
   `pnpm migrate:remote`（Build トークンに D1 Edit 権限）

初回セットアップ後、`main` への merge が Build をトリガーすることを Dashboard で確認してください（手動・一回）。