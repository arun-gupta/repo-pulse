# Research: Org-Level Repo Inventory (P1-F16)

## Decisions

### 1. Use a dedicated lightweight org inventory fetch path

- **Decision**: Implement a separate org inventory fetch helper and API route that only requests lightweight public repository metadata.
- **Rationale**: `P1-F16` is explicitly not full per-repo CHAOSS analysis. A dedicated lightweight fetch keeps the feature fast, predictable, and aligned with the product contract.
- **Alternatives considered**:
  - Reusing the full repo-analysis endpoint for every org repo: rejected because it is too expensive and violates the feature scope.
  - Client-side direct GitHub calls: rejected because the existing app uses server-side API routes and shared token rules.

### 2. Keep all table filtering and sorting local after the response returns

- **Decision**: Repo-name search, language filtering, archived filtering, and all asc/desc column sorting happen locally in client state once the org inventory payload is available.
- **Rationale**: The table behavior should feel instantaneous and should not trigger repeat org fetches.
- **Alternatives considered**:
  - Server-driven filtering and sorting: rejected because it adds unnecessary roundtrips for Phase 1.

### 3. Support asc/desc sorting on every visible column

- **Decision**: Every visible column in the inventory table is sortable in both ascending and descending directions.
- **Rationale**: This is now part of the product contract, and it keeps the table behavior consistent rather than making users guess which columns sort.
- **Alternatives considered**:
  - Restrict sorting to structured numeric/date columns only: rejected because it does not satisfy the requested feature contract.

### 4. Use a slider-controlled bulk-selection limit capped by config

- **Decision**: The UI exposes a slider for the current bulk-analysis selection limit, and a shared config module provides the default and maximum allowed cap, with Phase 1 defaulting to `5`.
- **Rationale**: This gives the user control while still protecting the existing repo-analysis flow from arbitrarily large selections.
- **Alternatives considered**:
  - Fixed hard cap only: rejected because the user requested a slider-driven limit.
  - Free-form numeric input: rejected because it is less guided and more error-prone than a slider.

### 5. Lowering the slider below the current selected count blocks the new limit

- **Decision**: If the user lowers the slider below the current selected count, the UI keeps the selection as-is but blocks applying the lower limit until the user deselects enough repositories.
- **Rationale**: This is less surprising than automatically deselecting repositories for the user.
- **Alternatives considered**:
  - Auto-trim the selected set: rejected because it silently mutates user choices.

### 6. Reuse the existing repo-analysis flow for row-level and bulk analyze actions

- **Decision**: Row-level `Analyze repo` and bulk `Analyze selected` actions feed repository slugs into the existing repo-analysis flow instead of building a second analysis system.
- **Rationale**: This preserves the current results shell, tabs, and comparison workflow with minimal duplication.
- **Alternatives considered**:
  - Separate inventory-specific analysis results page: rejected because it duplicates the Phase 1 analysis flow unnecessarily.

### 7. Use explicit empty/error/rate-limit states rather than partial guesswork

- **Decision**: Invalid orgs, empty orgs, and throttled responses get dedicated UI states, and missing per-row values remain explicit.
- **Rationale**: This follows the product’s accuracy policy and keeps org inventory behavior consistent with the rest of the app.

## Open Follow-up Questions

- Whether the inventory should paginate first or rely on horizontal/vertical overflow for initial large-org support
- Whether the org inventory should live inside the existing results shell or as a distinct workflow mode that can hand off into the results shell after selection
