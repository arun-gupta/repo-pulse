# Research: Repo Comparison

## Decision 1: Use an anchor-based comparison model by default

- **Decision**: The comparison workspace will default to the first successful analyzed repo as the anchor and allow the user to change it locally.
- **Rationale**: Anchor-based deltas are easier to interpret than a neutral spreadsheet when 2–4 repositories are shown together.
- **Alternatives considered**:
  - Fully symmetric comparison only: rejected because it makes "better or worse than what?" unclear.
  - Fixed first-column baseline with no user control: rejected because users often need to compare against a different repository later.

## Decision 2: Treat sections as first-class controls

- **Decision**: `Overview`, `Contributors`, `Activity`, `Responsiveness`, and `Health Ratios` will be explicit sections and users can enable/disable whole sections.
- **Rationale**: Section-level control reduces cognitive load much faster than a long attribute checklist.
- **Alternatives considered**:
  - Attribute-only filtering: rejected because it becomes noisy once many rows are available.
  - Passive section headings only: rejected because the user asked for section-level control.

## Decision 3: Keep all comparison work local to the existing analysis payload

- **Decision**: The comparison workspace will consume only the already-fetched `AnalysisResult[]`.
- **Rationale**: This preserves the current architecture, keeps tab switching instant, and avoids creating a second fetch path.
- **Alternatives considered**:
  - Dedicated comparison API: rejected as unnecessary complexity for Phase 1.

## Decision 4: Median column is derived locally and enabled by default

- **Decision**: A derived median column is included for visible metrics and can be toggled off.
- **Rationale**: It gives users a quick midpoint reference across the compared repos without hiding the raw values.
- **Alternatives considered**:
  - No aggregate column: rejected because it makes "how unusual is this repo?" harder to judge.
  - Mean/average instead of median: rejected because median is more stable in small sets and less distorted by outliers.

## Decision 5: Cap comparison at 4 successful repositories

- **Decision**: Comparison is limited to 4 repositories and the UI must communicate this clearly.
- **Rationale**: The user explicitly requested the cap, and it keeps the desktop layout practical without degrading into a giant spreadsheet.
- **Alternatives considered**:
  - Support 6 repositories as originally drafted: rejected in favor of a cleaner, more readable first implementation.

## Decision 6: Sort all visible comparison columns locally

- **Decision**: Every visible comparison column is sortable in ascending or descending order.
- **Rationale**: Sorting is expected in comparison-heavy UIs and fits the existing local-only interaction model.
- **Alternatives considered**:
  - Sort by rows only: rejected because it is less intuitive once columns become the main comparison surface.
  - No sorting: rejected because users explicitly asked for it.

## Decision 7: Keep comparison-focused copy stronger than raw numeric display

- **Decision**: Comparison cells will keep exact values visible, but anchor-based delta copy and directional cues will be emphasized more strongly.
- **Rationale**: The user prefers interpretation over just raw numbers.
- **Alternatives considered**:
  - Raw spreadsheet first: rejected because it under-delivers on insight.
