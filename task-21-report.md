# Task 21 report

## CI follow-up

- **Important (addressed):** GitHub Actions ran `pnpm test` without applying local D1 migrations, so integration tests failed on fresh runners. `.github/workflows/ci.yml` now runs `pnpm migrate:local` after `pnpm install` and before `pnpm test`.