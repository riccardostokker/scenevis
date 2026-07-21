# Repository guidance

- Run project commands through the `mise` task surface; use `mise tasks` to discover it.
- Manage Python dependencies with uv and frontend dependencies with pnpm; commit both lockfiles.
- Keep the Python package vertically organized around `scene/`, `analysis/`, and the thin `api/`
  boundary. Keep browser workflow ownership under `app/src/features/scene-analysis/`.
- Keep measurement data linear and independent from display-adjusted previews. Reporting may
  consume results but must never become a measurement input.
- Keep selected files, regions, previews, and results in browser memory. Backend uploads are
  bounded and temporary; do not add persisted region sidecars or image state.
- Keep `format`, `lint`, and `check` read-only. Use explicit `:fix`, `:sync`, or `:release`
  tasks for mutations.
- Derive frontend API types from the FastAPI OpenAPI contract with `mise run contract:sync`.
- Use typed public APIs, Conventional Commits, and git-cliff for release notes and versions.
- Never commit `.agents/` or local assistant/runtime state.
