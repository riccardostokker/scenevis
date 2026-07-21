# Repository guidance

- Run project commands through the `mise` task surface; use `mise tasks` to discover it.
- Manage Python dependencies with uv and commit `uv.lock`.
- Keep the package vertically organized around the `scene/`, `analysis/`, and `report/`
  narrative anchors; mirror those owners under `tests/` where useful.
- Keep measurement data linear and independent from display-adjusted previews. Reporting may
  consume results but must never become a measurement input.
- Keep `format`, `lint`, and `check` read-only. Use explicit `:fix`, `:sync`, or `:release`
  tasks for mutations.
- Use typed public APIs, Conventional Commits, and git-cliff for release notes and versions.
- Never commit `.agents/` or local assistant/runtime state.
