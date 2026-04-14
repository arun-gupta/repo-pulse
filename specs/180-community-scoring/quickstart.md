# Quickstart: Community Scoring

**Feature**: P2-F05 — Community scoring
**Branch**: `180-community-scoring`

This is the developer-facing "how do I verify this shipped" runbook. It doubles as the skeleton for `checklists/manual-testing.md` (to be created during `/speckit.implement`).

---

## Prerequisites

- Local dev environment running: `npm run dev`
- Authenticated via GitHub OAuth in the running app
- Tests green: `npm test` and `npm run build`

---

## Manual verification path

### Step 1 — Signal-rich repository

Analyze `facebook/react`. Expected on the scorecard:

- [ ] New **Community** tile in the score row showing a percentile label and a `N of 7 signals` detail
- [ ] Tile tooltip explains it is a completeness readout, not a weighted composite input
- [ ] Composite OSS Health Score value matches the pre-feature value (composite weights unchanged — SC-002)

Across tabs:

- [ ] **Documentation tab**: CoC, issue templates, PR template, GOVERNANCE.md (if present) rows each show a `community` pill
- [ ] **Contributors tab**: CODEOWNERS and FUNDING rows each show a `community` pill (CODEOWNERS additionally shows `governance`)
- [ ] **Activity tab**: Discussions card renders with an `Enabled · N in last 90d` state and a `community` pill

### Step 2 — Signal-poor repository

Analyze a small "hello world" repo (e.g., a personal sandbox with only a README).

- [ ] Community tile shows a low percentile in the bottom quartile of the bracket
- [ ] Documentation tab's community-pill items are mostly absent
- [ ] Contributors tab's FUNDING row shows absent (no community pill since it's not detected)
- [ ] Activity tab's Discussions card shows `Not enabled`
- [ ] Recommendations tab lists the four new community-tagged recommendations (`file:issue_templates`, `file:pull_request_template`, `file:funding`, `feature:discussions_enabled`), each citing its stable ID

### Step 3 — Window switching

On the Activity tab, change the window from 90d → 30d → 365d.

- [ ] Discussions card's count label updates to reflect the new window
- [ ] No extra network requests fire (watch Network tab — window switch recomputes locally)

### Step 4 — Private repo / limited access

Analyze a private repository where your token lacks read access to `.github/` contents:

- [ ] Community tile shows reduced denominator (e.g., `2 of 4 signals` if 3 are unknown)
- [ ] Missing-data panel lists the unknown signals
- [ ] No "estimated" or "best-effort" labels appear anywhere

### Step 5 — JSON and Markdown exports

- [ ] JSON export includes `community.signals`, `community.completeness`, `community.discussions` per repo
- [ ] JSON export structurally mirrors the shape in `contracts/community-scoring.md`
- [ ] Markdown export has a `### Community` section between Contributors and Activity with a 7-row signal table
- [ ] Shareable URL still round-trips (no token leakage)

### Step 6 — Multi-repo comparison

Compare `facebook/react` with `arun-gupta/repo-pulse`:

- [ ] Comparison tab includes a Community section with per-repo completeness and per-signal presence
- [ ] Exporting the comparison as JSON / Markdown preserves the community data for all compared repos

### Step 7 — Methodology page

Open `/baseline` (Scoring Methodology):

- [ ] Community section explains the lens model, lists the 7 signals and their host buckets, and clarifies it is not an independent composite bucket

---

## Automated verification

### Unit + component

```bash
npm test
```

Expected to pass with ~570+ tests (up from 552 pre-feature), including:

- `lib/community/completeness.test.ts` — shape invariants, edge cases (all unknown, all present, mixed)
- `lib/tags/community.test.ts` — registry coverage, disjointness
- `lib/documentation/score-config.test.ts` — new template weights, file weight sum = 1
- `lib/contributors/score-config.test.ts` — FUNDING bonus is positive-only
- `lib/activity/score-config.test.ts` — Discussions factor 3-state behavior (enabled+active / enabled+empty / disabled / unavailable)
- `lib/export/json-export.test.ts` — community shape present with 7 signal keys
- `lib/export/markdown-export.test.ts` — Community section between Contributors and Activity
- `lib/recommendations/__tests__/catalog.test.ts` — 4 new entries, tag counts updated
- Component tests for tag pill rendering on DocumentationView, ContributorsScorePane, ActivityView

### E2E

```bash
npm run test:e2e
```

- `e2e/community-scoring.spec.ts` covers the signal-rich and signal-poor repo flows from Steps 1–2.
- Existing `e2e/metric-cards.spec.ts` is updated to assert the Community tile appears in the scorecard overview.

### Build

```bash
npm run build
```

No new TypeScript errors. No new lint errors beyond the pre-existing baseline.

---

## Constitutional compliance walkthrough

Before opening the PR, verify each item:

- [ ] §II: Every new detection maps to a single GraphQL field or file-presence check. Signals unverifiable → `'unavailable'`.
- [ ] §III: One additional GraphQL call per Discussions-enabled repo (gated on `hasDiscussionsEnabled`).
- [ ] §V: No new CHAOSS category — Community is a lens.
- [ ] §VI: All weights in `lib/*/score-config.ts`, not inline in components.
- [ ] §IX (YAGNI): No speculative infrastructure. Only what FR-001 through FR-019 require.
- [ ] §XI: Every new function has a unit test; every new UI surface has a component test.
- [ ] §XII: DoD items checked, including `manual-testing.md` checklist signed off and `docs/DEVELOPMENT.md` row marked Done for P2-F05.

---

## Rollback plan

If a regression is found post-merge:

1. The feature is additive — all new fields on `AnalysisResult` are optional in practice (consumers tolerate their absence).
2. Host-bucket weight redistributions can be reverted by restoring the original weights in the three `score-config.ts` files.
3. The new `lib/tags/community.ts` and `lib/community/completeness.ts` modules are isolated; removing their imports from UI components fully hides the lens without needing to delete detection code.

No database migrations. No env-var changes. Rollback is a single revert of the feature PR.
