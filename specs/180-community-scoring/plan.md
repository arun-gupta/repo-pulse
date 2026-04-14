# Implementation Plan: Community Scoring

**Branch**: `180-community-scoring` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/180-community-scoring/spec.md`

## Summary

Add a **Community lens** over the existing scored buckets, mirroring the Governance precedent in `lib/tags/governance.ts`. Five net-new signals are detected and scored inside their most appropriate existing host bucket (Documentation / Contributors / Activity) rather than forming a sixth composite-weighted dimension. A new `community` tag is applied to rows across Documentation, Contributors, and Activity views so users can trace the lens visually. A derived "Community completeness" readout on the scorecard summarizes how many of the seven community signals are present as a percentile against peers — satisfying issue #70's ranking requirement without disturbing composite weights.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 16+)
**Primary Dependencies**: Next.js (App Router), React, Tailwind CSS
**Storage**: N/A (stateless, on-demand analysis per the constitution)
**Testing**: Vitest + React Testing Library (units and components); Playwright (E2E)
**Target Platform**: Vercel serverless (web app)
**Project Type**: Web application (single Next.js app under repository root)
**Performance Goals**: Per SC-007 — no more than 10% latency regression for repositories without Discussions; at most one additional bounded GraphQL call when Discussions is enabled
**Constraints**: Constitution §II Accuracy Policy — "Insufficient verified public data" / "unavailable" for any signal that cannot be verified against GraphQL; no estimation
**Scale/Scope**: One-shot per-repo analysis; scales to 4-repo comparison sessions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Rule | Status | Notes |
|---|---|---|---|
| I | Technology Stack | ✅ Pass | No new runtime dependencies — reuses Next.js, TypeScript, Tailwind, Vitest, Playwright. |
| II | Accuracy Policy | ✅ Pass | Every net-new signal (issue templates, PR template, FUNDING.yml, Discussions enabled, Discussions activity) is derived from a single GraphQL-verifiable field or file path. FR-016 mandates "unknown" state for signals that cannot be determined. |
| III | Data Source Rules | ✅ Pass | All detection via existing GraphQL client (1–3 requests/repo). Discussions activity is gated on `hasDiscussionsEnabled` to avoid speculative fetches (FR-008, SC-003). |
| IV | Analyzer Module Boundary | ✅ Pass | Detection logic lands in `lib/analyzer/`; scoring logic in `lib/documentation/`, `lib/contributors/`, `lib/activity/`; tag logic in `lib/tags/community.ts`. No Next.js-only imports. |
| V | CHAOSS Alignment | ✅ Pass | **Community is a lens, not a CHAOSS category.** It does not introduce a new CHAOSS score — FR-015 explicitly forbids adding a composite-weighted bucket. The existing Activity / Sustainability (now Contributors) / Responsiveness mapping is unchanged. No constitution amendment required. |
| VI | Scoring Thresholds | ✅ Pass | Per-signal weights for the net-new signals live in the host bucket's existing score config (e.g., `lib/documentation/score-config.ts`). No hardcoded thresholds in components. |
| VII | Ecosystem Spectrum | ✅ N/A | Unchanged by this feature. |
| VIII | Contribution Dynamics Honesty | ✅ Pass | No claims about org affiliation. Discussions counts come from GraphQL directly. |
| IX | Feature Scope Rules (YAGNI) | ✅ Pass | Scope is strictly the 5 net-new detections + lens tagging + completeness readout. No speculative infrastructure (no new tab, no new composite bucket, no recommendations-catalog expansion beyond what hosts already emit). |
| X | Security & Hygiene | ✅ N/A | No new secrets or external services. |
| XI | Testing (TDD NON-NEGOTIABLE) | ✅ Pass | Each detection gets a unit test before implementation. Lens tagging gets a component test. Completeness readout gets a view-model test. Playwright coverage extends existing activity/documentation/contributors scenarios. |
| XII | Definition of Done | ✅ Pass | Manual testing checklist at `specs/180-community-scoring/checklists/manual-testing.md` to be created during implementation. |
| XIII | Development Workflow | ✅ Pass | Feature branch, spec-first, manual checklist, DEVELOPMENT.md update on completion. |

**Gate result**: PASS. No violations requiring the Complexity Tracking section.

## Project Structure

### Documentation (this feature)

```text
specs/180-community-scoring/
├── plan.md                             # This file
├── spec.md                             # Feature spec (committed)
├── research.md                         # Phase 0 output
├── data-model.md                       # Phase 1 output
├── quickstart.md                       # Phase 1 output
├── contracts/
│   └── community-scoring.md            # Phase 1 output
├── checklists/
│   ├── requirements.md                 # Already created
│   └── manual-testing.md               # Created during /speckit.implement
└── tasks.md                            # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
lib/
├── analyzer/
│   ├── github-graphql.ts               # Extended: issue templates, PR template, FUNDING.yml, Discussions
│   └── analysis-result.ts              # Extended: new fields on AnalysisResult
├── tags/
│   ├── governance.ts                   # Existing — reference pattern
│   └── community.ts                    # NEW — mirrors governance.ts
├── documentation/
│   └── score-config.ts                 # Extended: issue/PR template sub-signals
├── contributors/
│   └── score-config.ts                 # Extended: FUNDING.yml bonus signal
├── activity/
│   └── score-config.ts                 # Extended: Discussions enabled + activity
├── community/
│   └── completeness.ts                 # NEW — derived percentile readout
└── export/
    ├── json-export.ts                  # Extended: community signals + completeness
    └── markdown-export.ts              # Extended: community section

components/
├── tags/
│   └── TagPill.tsx                     # Existing — rendering path
├── documentation/
│   └── DocumentationView.tsx           # Extended: community tag on CoC, templates
├── contributors/
│   └── ContributorsScorePane.tsx       # Extended: community tag on CODEOWNERS, FUNDING.yml
├── activity/
│   └── ActivityView.tsx                # Extended: Discussions card with community tag
└── metric-cards/
    └── MetricCard.tsx                  # Extended: Community completeness readout

specs/008-metric-cards/contracts/
└── metric-card-props.ts                # Extended: optional Community completeness field

lib/recommendations/
└── catalog.ts                          # Extended: new CTR/DOC/ACT entries for community gaps (templates, FUNDING, Discussions)

__tests__ (co-located with sources)    # Vitest unit + component tests
e2e/
└── community-scoring.spec.ts           # NEW — Playwright E2E
```

**Structure Decision**: Single Next.js app (the existing Phase 1 structure). No new packages, no new framework boundaries — just additive extensions in the directories the constitution already permits. The analyzer module boundary (Constitution §IV) is preserved: all detection lives under `lib/analyzer/`, all scoring under the per-bucket `score-config.ts` modules, lens presentation under `components/` and `lib/tags/`.

## Complexity Tracking

No violations. Section intentionally left empty.
