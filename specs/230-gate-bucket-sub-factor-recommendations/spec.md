# Gate bucket sub-factor recommendations by percentile

Issue: #230

## Problem

Bucket sub-factor recommendations emit regardless of the sub-factor's
percentile. A repo scoring 95th percentile on PR flow still gets "Reduce PR
backlog and speed up review throughput to improve merge rate" — the advice
reads as a scolding when the repo is actually outperforming.

Verified on `arun-gupta/repo-pulse` (from #214 testing): the repo closes
issues quickly and merges PRs promptly, yet "Triage and close stale issues"
(ACT-2) and "Reduce PR backlog" still surfaced as Activity recommendations.

The root cause is explicit in `lib/scoring/health-score.ts`:

```ts
// Generate recommendations for all buckets — no percentile gate.
```

## Solution

Introduce a single global recommendation gate, defined in configuration per
constitution §VI:

```ts
export const RECOMMENDATION_PERCENTILE_GATE = 50
```

A sub-factor recommendation is emitted only when its percentile is
**strictly below** the gate. At or above the gate, the recommendation is
suppressed — silent-when-good.

### Scope of the gate

Applied to:

- `getActivityRecommendations` — PR flow, Issue flow, Completion speed,
  Sustained activity (gated per sub-factor percentile).
- `getResponsivenessRecommendations` — Response time, Resolution,
  Backlog health (gated per sub-factor percentile).
- `getContributorsRecommendations` — Concentration, Maintainer depth,
  Repeat-contributor ratio, New-contributor inflow, Contribution breadth
  (gated per sub-factor percentile).
- `getDocumentationScore` recommendations — gated by the **bucket**
  percentile (`documentation.percentile`). Each recommendation is tied to a
  missing file or README section; when the overall documentation bucket is
  already at or above the gate, the few missing items do not warrant a
  scold.
- `getSecurityScore` recommendations — gated by the **bucket** percentile
  (`security.percentile`), same reasoning.

Not affected (these are presence-based community-lens signals, not
percentile-driven scolds):

- `file:funding` (CTR-3, missing `FUNDING.yml`)
- `feature:discussions_enabled` (ACT-5, Discussions disabled)
- `no_maintainers` (missing CODEOWNERS/MAINTAINERS)

These fire on a verified boolean absence of the artifact, not on a
percentile comparison. They stay as-is.

## Acceptance

- [x] Sub-factor recommendation emitters read a percentile threshold from
      shared config (`RECOMMENDATION_PERCENTILE_GATE`).
- [x] Recommendations at or above the threshold are suppressed.
- [x] Documentation entry for the threshold (in `docs/scoring-and-calibration.md`).
- [x] Unit tests: top-percentile sub-factors do NOT emit recs; below-gate
      sub-factors still do.
- [x] Manual verification on `arun-gupta/repo-pulse` — no false-positive
      Activity recommendations.

## Out of scope

- Celebratory "great job" copy above a high percentile (stretch in the issue).
- Per-bracket recalibration of the gate — one global threshold is enough.
- Gating presence-based community-lens recs (FUNDING, Discussions, CODEOWNERS).
