# Scenevis

Follow the repository guidance in `AGENTS.md`.

- Use `mise run check` for fast read-only validation; run `mise run test`, `mise run test:gui`,
  and `mise run test:gui:e2e` for behavior coverage.
- Manage Python dependencies with uv and frontend dependencies with pnpm; commit both lockfiles.
- Keep Python code typed under `src/scenevis/` and React workflow code vertical under
  `app/src/features/scene-analysis/`.
- Generate frontend API types from FastAPI with `mise run contract:sync`; never hand-copy the
  wire contract.
- Use Conventional Commits; git-cliff owns changelog and version calculation.
