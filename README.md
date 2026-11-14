# tameru

エージェント向け MCP（Model Context Protocol）と、人向け Web Viewer を備えた Markdown ナレッジベースです。

個人開発のサービスです。本番では [`/disclaimer`](/disclaimer)（Viewer 上）に免責があります。SLA はなく、機微情報は置かないでください。利用の目安として [GitHub リポジトリ](https://github.com/hirakawaxxx/tameru) への Star を歓迎します（任意）。

設計: `docs/superpowers/specs/` · 実装計画: `docs/superpowers/plans/`

## ローカル開発

```bash
pnpm install
pnpm migrate:local   # 初回・スキーマ変更後
pnpm dev             # wrangler dev → http://localhost:8787
```

ヘルスチェック: `GET http://localhost:8787/health` が `200 { "ok": true }`。

ブラウザ・API・MCP はローカルでは **Cloudflare Access をバイパス**し、`Host: localhost` かつ `wrangler.jsonc` の `ACCESS_AUD` が空のとき、次のデバッグヘッダーで owner を差し替えます。

```http
X-Tameru-Debug-Owner: you@example.com
```

```bash
claude mcp add --transport http tameru http://localhost:8787/mcp
# 上記ヘッダーを MCP クライアントに設定
```

### 初回のみ（Cloudflare D1）

```bash
pnpm wrangler d1 create tameru --location apac
# 出力の database_id を wrangler.jsonc の REPLACE_AFTER_d1_create に貼る
pnpm migrate:local
pnpm dev
```

## 環境変数（`wrangler.jsonc` / Workers）

| 名前 | 用途 |
|------|------|
| `DB` | D1 バインディング（`database_name`: `tameru`） |
| `ASSETS` | `public/` 静的アセット |
| `ACCESS_TEAM_DOMAIN` | Access JWT 検証用チームドメイン |
| `ACCESS_AUD` | Access アプリの AUD（本番は Dashboard のシークレット/vars。ローカルは空で可） |
| `DISCLAIMER_VERSION` | 免責文の版。上げると再同意が必要 |

本番の `ACCESS_AUD` などはリポジトリに載せず、Workers Builds の変数・シークレットで設定します（[docs/deploy.md](docs/deploy.md)）。

## design-kit（Soft Mint）

`design/` にアプリ名・モチーフを置き、隣の `design-kit` で `public/` を生成します。

```bash
node ../design-kit/bin/design-kit.mjs all
node ../design-kit/bin/design-kit.mjs check
```

`tokens.css` / `components.css` / `fonts.css` は手編集せず `sync` で揃えます。

## 本番・運用

| 項目 | 参照 |
|------|------|
| Workers Builds・D1 migrate・ドメイン | [docs/deploy.md](docs/deploy.md) |
| Cloudflare Access・MCP Portal | [docs/deploy.md](docs/deploy.md) |
| ブランチ戦略・PR | [CONTRIBUTING.md](CONTRIBUTING.md) |

### 計測（Analytics）

リクエスト数・トラフィック・利用の目安は **Cloudflare Dashboard の Analytics のみ**で確認します。アプリ内の管理画面メトリクス、`metrics_daily`、登録ユーザー数ダッシュボードなどは **作りません**。文書数・ユーザー数が必要なら D1 を `wrangler d1` や Dashboard から都度見ます。

## 開発用スクリプト

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm migrate:remote   # 本番 D1（権限・手順は deploy.md）
```