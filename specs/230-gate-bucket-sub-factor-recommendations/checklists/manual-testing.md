# Manual testing — Gate bucket sub-factor recommendations (#230)

## Setup

Dev server on `http://localhost:3010`. Sign in with GitHub (or
`DEV_GITHUB_PAT`).

## Test matrix

- [ ] **Top-performing repo (Activity)** — analyze `facebook/react` or any
      repo where Activity sub-factors (PR flow, Issue flow, Completion
      speed, Sustained activity) score at or above the 50th percentile.
  - [ ] The Recommendations tab does NOT surface `Reduce PR backlog…`,
        `Triage and close stale issues…`, `Reduce time to merge PRs…`, or
        `Increase commit frequency…` for sub-factors at/above the gate.
  - [ ] Any sub-factor below the 50th percentile still surfaces its
        recommendation.

- [ ] **`arun-gupta/repo-pulse` regression check** — analyze the
      own-project repo that exposed the bug.
  - [ ] No false-positive Activity recommendations (ACT-2 "Triage and close
        stale issues" and "Reduce PR backlog" both absent, since the repo
        merges PRs and closes issues quickly).
  - [ ] If Activity sub-factors are legitimately below gate, those recs
        still appear.

- [ ] **Low-performing repo** — analyze a repo with a stale backlog.
  - [ ] Relevant sub-factor recommendations DO appear (gate only suppresses
        at/above the threshold, not below).

- [ ] **Presence-based community recs are unchanged** — on a repo without
      `.github/FUNDING.yml` or with Discussions disabled:
  - [ ] `file:funding` recommendation still fires (not gated).
  - [ ] `feature:discussions_enabled` recommendation still fires (not gated).

- [ ] **Documentation and Security bucket gating** — on a repo whose
      Documentation bucket is ≥ 50th percentile but still missing one or
      two minor files:
  - [ ] Documentation recommendations are suppressed.
  - [ ] On a repo whose Documentation bucket is < 50th percentile, the
        per-missing-file recommendations still appear.

## Signoff

- Verified by: arun-gupta
- Date: 2026-04-15
