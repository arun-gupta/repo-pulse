# Manual Testing Checklist: Community Scoring (P2-F05, #70)

**Status**: In progress — sign off before PR merge.

This checklist is the skeleton from `quickstart.md` Steps 1–7. Each item must be ticked on the live dev server before the PR is opened for review. Fill in any follow-up issues you file into the Notes section.

---

## Step 1 — Signal-rich repository (`facebook/react`)

- [ ] New **Community** tile in the scorecard score row shows a percentile label and `N of 7 signals` detail
- [ ] Tile tooltip explains it is a completeness readout, not a weighted composite input
- [ ] Composite OSS Health Score value unchanged vs. pre-feature
- [ ] Documentation tab: CoC, issue templates, PR template, GOVERNANCE.md rows each show a `community` pill
- [ ] Contributors tab: CODEOWNERS and Funding rows each show a `community` pill; CODEOWNERS additionally shows `governance`
- [ ] Activity tab: Discussions card renders, shows `Enabled · N in last 90d`, carries a `community` pill

## Step 2 — Signal-poor repository

- [ ] Community tile shows a low percentile (bottom quartile)
- [ ] Documentation tab community-pill items are mostly absent
- [ ] Contributors tab Funding row does not render (or renders as missing without a community pill)
- [ ] Activity tab Discussions card shows `Not enabled`
- [ ] Recommendations tab lists four new community-tagged recommendations, each with stable IDs

## Step 3 — Window switching

- [ ] Discussions card count updates when switching 90d → 30d → 365d
- [ ] No extra network requests fire on window switch

## Step 4 — Private / limited-access repository

- [ ] Community tile reflects reduced denominator (unknowns excluded from both numerator and denominator)
- [ ] Missing-data panel lists the unknown signals
- [ ] No estimated / best-effort labels anywhere

## Step 5 — Exports

- [ ] JSON export includes `community.signals`, `community.completeness`, `community.discussions` per repo
- [ ] JSON export structurally matches `contracts/community-scoring.md` §5
- [ ] Markdown export has a `### Community` section between Contributors and Activity with a 7-row signal table
- [ ] Shareable URL round-trips without token leakage

## Step 6 — Multi-repo comparison

- [ ] Comparison tab includes a Community section with per-repo completeness
- [ ] Exporting comparison preserves community data for all compared repos

## Step 7 — Methodology page

- [ ] `/baseline` page describes the Community lens, lists 7 signals with host buckets, and clarifies it is not an independent composite bucket

---

## Constitutional compliance

- [ ] §II: Every detection resolves from GraphQL or `'unavailable'`; no estimation
- [ ] §III: ≤3 GraphQL calls per repo; Discussions activity gated on enablement
- [ ] §V: No new CHAOSS category introduced (Community is a lens)
- [ ] §VI: All weights in config files, not inline in components
- [ ] §IX (YAGNI): No speculative infrastructure beyond FR-001–FR-019
- [ ] §XI: Every new function has a unit test; every new UI surface has a component test
- [ ] §XII: All DoD items ticked before PR merge

---

## Signoff

- **Tested by**: _____________________
- **Date**: _____________________
- **Notes / follow-ups**:
