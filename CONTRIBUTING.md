# Contributing

tameru は **GitHub Flow** で運用します。本番は Cloudflare Workers Builds が `main` の更新をデプロイします。

## ブランチ戦略

| 規則 | 内容 |
|------|------|
| `main` | 本番唯一のデプロイ元。**直接 push しない** |
| `feature/*` / `fix/*` | 作業ブランチ → PR → `main` へマージ |
| CI | PR では **test / typecheck / lint** がすべてグリーンであること（`.github/workflows/ci.yml`） |
| プレビュー | v1 では PR ごとの Workers プレビュー URL は使わない |
| `develop` | **置かない**（長寿命の統合ブランチは作らない） |
| リリース | `main` へのマージ = 本番反映。必要なら `v*` タグを任意で付与 |

## 作業の流れ

1. `main` から `feature/...` または `fix/...` を切る
2. 変更を push し、`main` 向け PR を開く
3. CI が通るまで修正する
4. レビュー後に `main` へマージ（マージ後、Workers Builds が本番を更新）