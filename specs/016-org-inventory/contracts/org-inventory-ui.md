# UI Contract: Org-Level Repo Inventory (P1-F16)

## Top-Level Behavior

- User can submit a GitHub org slug or org URL
- Successful response renders:
  - org summary section
  - filter/sort/selection controls
  - repo inventory table
- Invalid, empty, and rate-limited org states render explicitly

## Summary Section

- Shows:
  - total public repos
  - total stars
  - most-starred repos
  - most recently active repos
  - language distribution
  - archived vs active repo count

## Controls

- Repo-name text filter
- Language filter
- Archived-status filter
- Bulk-selection limit slider
- `Analyze selected` action

## Table

- One row per public repo
- Visible columns:
  - repository name
  - description
  - primary language
  - stars
  - forks
  - watchers
  - open issues
  - last pushed
  - archived
  - repo URL / analyze action
- Every visible sortable column supports asc/desc sorting
- Sorting and filtering are local only

## Analysis Handoff

- Row-level action launches existing repo analysis for that repo
- Bulk action launches existing repo analysis for selected repos
- Selection cannot exceed the current slider limit
