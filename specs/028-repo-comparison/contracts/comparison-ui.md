# Contract: Comparison UI

## Top-Level Behavior

- `Comparison` is available only when 2–4 repositories have successful analysis results.
- The workspace is derived entirely from the current `AnalysisResult[]`.
- No additional API calls occur when opening or interacting with `Comparison`.

## Controls

- **Anchor selector**
  - Defaults to the first successful repo.
  - User can change the anchor locally.

- **Section toggles**
  - `Overview`
  - `Contributors`
  - `Activity`
  - `Responsiveness`
  - `Health Ratios`
  - All enabled by default.

- **Attribute toggles**
  - Scoped to enabled sections.
  - All enabled by default.

- **Median column toggle**
  - Enabled by default.

- **Column sorting**
  - Every visible comparison column is sortable `asc` / `desc`.

## Table Semantics

- Metrics are rows.
- Repositories are columns.
- The median column appears last by default when enabled.
- Cells keep exact values visible.
- Anchor-based delta interpretation is more visually prominent than the raw values.
- Unavailable values render as `—`.

## Cap Messaging

- The input/comparison flow must clearly communicate that no more than 4 repositories can be compared.
- If the user exceeds the cap, the UI must explain why the extra repo is excluded.
