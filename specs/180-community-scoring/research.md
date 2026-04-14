# Phase 0 Research: Community Scoring

**Feature**: P2-F05 — Community scoring (issue #70)
**Branch**: `180-community-scoring`
**Date**: 2026-04-14

This document resolves the three open questions captured in `spec.md` and locks in the approaches the implementation will take. Each question follows the Decision / Rationale / Alternatives format.

---

## Q1 — Per-signal weights in host buckets

**Context**: Five net-new signals (issue templates, PR template, FUNDING.yml, Discussions enabled, Discussions activity) are scored inside their host buckets (Documentation, Contributors, Activity). How heavily should each contribute, before calibration refresh (#152)?

### Decision

**Small fixed weights, conservative. Each net-new signal contributes at approximately half the weight of the smallest existing peer signal in its host bucket.**

- **Documentation — Issue templates**: 5% of the File presence sub-score (peer: CODE_OF_CONDUCT at 10%)
- **Documentation — PR template**: 5% of the File presence sub-score
- **Contributors — FUNDING.yml**: bonus multiplier ≤ 0.05 applied to the bucket percentile; never negative when absent
- **Activity — Discussions enabled**: 5% of the Activity sub-score (added as a sixth factor alongside the existing PR flow 25% / Issue flow 20% / Completion speed 15% / Sustained activity 25% / Release cadence 15%)
- **Activity — Discussions activity** (only when enabled): additional 5% merged with Discussions enabled so the combined Discussions factor caps at 10%

The remaining Activity factors are rescaled proportionally so the five existing + Discussions weights sum to 100% with Discussions capped at 10%.

### Rationale

1. **Conservatism before calibration.** Constitution §VI requires thresholds in config, and the constitution's spirit (§IX YAGNI) prefers the smallest change that satisfies the spec. Small weights mean shipping doesn't destabilize existing bucket scores for already-analyzed repos.
2. **Symmetry with the Activity precedent.** `lib/activity/score-config.ts` already uses linear approximations for `sustainedActivity` and `releaseCadence` (signals not yet calibrated). Treating the community signals the same way is consistent.
3. **Explicit sunset hook.** Issue #152 is a downstream consumer. Keeping these weights fixed and small is a clean handoff: once calibration covers these signals, `interpolatePercentile()` calls replace the linear fallback without having to rewrite the bucket math.
4. **FR-010 compliance.** The spec explicitly requires weights to be "deliberately modest so that introducing these signals does not destabilize existing bucket scores."

### Alternatives considered

- **Equal weight to existing peer signals.** Rejected — would shift every repo's Documentation score by several percentiles overnight just from template presence.
- **Detect-but-do-not-score until calibration lands.** Rejected — ships a dead path and doesn't satisfy FR-007/FR-008/FR-009 (signals must contribute positively).
- **Complex dynamic weights (e.g., weight by confidence).** Rejected on YAGNI grounds — unwarranted complexity before any calibration data exists.

---

## Q2 — Discussions activity metric

**Context**: When GitHub Discussions is enabled, what indicator represents "activity" without incurring expensive GraphQL pagination?

### Decision

**Total discussion count, bounded to the `CONTRIBUTOR_WINDOW_DAYS` window already selected in the UI (default 90 days).**

Expose a single numeric field `discussionsCountWindow` (or `unavailable`) on `AnalysisResult`, populated only when `hasDiscussionsEnabled === true`.

### Rationale

1. **Cheapest signal that still answers the underlying question.** "How much conversation is happening here right now?" is faithfully represented by a window-bounded count.
2. **Single GraphQL call.** GitHub's GraphQL Discussions connection supports `createdAt` filtering; a first-page count (or `totalCount` aggregate via the connection) resolves in one request. SC-007 is preserved (≤ 1 additional call per Discussions-enabled repo).
3. **Consistency with existing window semantics.** Activity and Responsiveness already honor the `CONTRIBUTOR_WINDOW_DAYS` selector (30/60/90/180/365). Using the same window for Discussions means window switches locally recompute this signal too — no separate re-fetch.
4. **Three-state interpretation** matches FR-012 edge case: Discussions disabled → "not enabled"; enabled with zero recent count → "enabled, no activity yet"; enabled with positive count → "enabled with activity." Downstream scoring maps these three states to 0 / small positive / larger positive.

### Alternatives considered

- **Total discussions (lifetime)**: Rejected — not recency-sensitive. A two-year-old project with 50 discussions and zero recent activity would score the same as a thriving one.
- **Response-rate computation** (percentage of discussions with a maintainer reply): Rejected — requires paginating individual discussions and their reply threads. Violates SC-007's bounded-call constraint. Could be revisited as a Phase 3+ enhancement.
- **Answered-question ratio** (for Q&A-category discussions): Rejected — category-specific metric that doesn't generalize across projects that use Discussions for announcements, feedback, or general chat.

---

## Q3 — Community completeness denominator

**Context**: The "Community completeness" readout on the scorecard summarizes how many community signals are present. Equal weighting of all seven signals, or tiered weighting?

### Decision

**Equal weighting across all seven signals.** Completeness is `present_signal_count / known_signal_count` expressed as a percentile against the peer bracket.

The seven signals:

1. `CODE_OF_CONDUCT.md`
2. Issue templates
3. PR template
4. `CODEOWNERS`
5. `GOVERNANCE.md`
6. `FUNDING.yml`
7. Discussions enabled

Each is a binary present/missing/unknown detection. Unknown signals are excluded from both numerator and denominator (FR-016), so a repo where one signal cannot be determined is scored as `m / 6` instead of `m / 7`.

### Rationale

1. **Simplicity and auditability.** A single count-based metric is trivially explainable in the methodology page and trivially verifiable in tests.
2. **Avoids unearned precision.** Without calibration data for individual signal importance, any tiering (e.g., "CoC is more important than FUNDING") encodes opinion as precision. Equal weighting is honestly less precise but defensible.
3. **FR-015 compliance.** This is explicitly a derived summary, not a composite-weighted input. Equal weights keep the readout structurally distinct from the real scoring — which lives in the host buckets.
4. **Monotonic behavior (SC-002).** Equal weighting trivially guarantees that adding a signal never lowers the percentile, matching the spec's "monotonically increases (or stays flat)" requirement.

### Alternatives considered

- **Tiered weighting** (e.g., CoC + templates + Discussions as "must-haves" at 2×; CODEOWNERS + GOVERNANCE + FUNDING as "nice-to-haves" at 1×): Rejected — encodes opinion without data. Can be revisited after #152 produces calibration on community-signal prevalence.
- **Prevalence-based weighting** (rare signals score higher): Rejected — inverts the usual intuition ("more signals is better") and would need a clear UX explanation.
- **Exclude experimental signals from the denominator**: N/A — none of the seven signals are experimental. Elephant Factor and single-vendor ratio (constitution §VIII narrow exception) stay out of this readout.

---

## Summary of Resolved Questions

| Question | Decision |
|---|---|
| Q1 weights | Small fixed weights (≤5% per signal in each host bucket); revisited after #152 calibration. |
| Q2 Discussions activity | Total count within the user-selected window (30/60/90/180/365d); single GraphQL call gated on `hasDiscussionsEnabled`. |
| Q3 completeness denominator | Equal weighting across 7 signals; unknowns excluded from both numerator and denominator. |

All spec `[NEEDS CLARIFICATION]` markers (there were none, only Open Questions) are resolved. The implementation can proceed to Phase 1 design.
