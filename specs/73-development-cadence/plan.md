# Implementation Plan: Development Cadence

**Branch**: `73-development-cadence` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/73-development-cadence/spec.md`

## Summary

Revise the existing Development Cadence panel so the current split trend presentation becomes one unified momentum module. The module will default to month-over-month comparison, expose week-over-week and day-over-day modes from the same verified commit-history source, and keep the analyzer, view-model, and Activity UI aligned without introducing a new navigation surface or speculative abstractions.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js App Router  
**Primary Dependencies**: Next.js, React, Tailwind CSS, Vitest, React Testing Library, Playwright  
**Storage**: N/A (stateless, derived from verified GitHub commit timestamps already present in analysis results)  
**Testing**: Vitest, React Testing Library, Playwright  
**Target Platform**: Web app in modern desktop/mobile browsers  
**Project Type**: Next.js web application with a framework-agnostic analyzer module  
**Performance Goals**: Trend mode changes stay local to the rendered analysis result and do not trigger a new analysis request  
**Constraints**: Verified GitHub data only; unavailable stays explicit; analyzer remains framework-agnostic; no new top-level tab; no hardcoded thresholds in components; keep the design bounded to the three approved comparison modes  
**Scale/Scope**: One cadence panel per analyzed repository, one weekly rhythm chart, and one unified trend module with month/week/day modes derived from the same recent commit-history window

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **II. Accuracy Policy — PASS**: All planned trend modes derive only from verified commit timestamps already captured for cadence; missing or partial periods remain `unavailable`.
- **III. Data Source Rules — PASS**: No new source is introduced; the design stays on GitHub GraphQL-derived commit history.
- **IV. Analyzer Module Boundary — PASS**: Trend comparison derivation remains in shared activity/analyzer code, while the UI consumes formatted view-model output.
- **VI. Scoring Thresholds — PASS**: Existing long-gap/config behavior remains in shared config; no new inline scoring thresholds are introduced.
- **IX. Feature Scope / YAGNI — PASS**: The revision is limited to replacing the split trend area with one module and adding only the three spec-approved comparison modes.
- **XI. Testing — PASS**: The plan keeps TDD at analyzer, view-model, component, and Activity flow layers.

**Post-Design Re-check**: PASS — the Phase 1 artifacts below keep trend-mode logic in the cadence domain model and contracts, with no constitution violations introduced by the revised scope.

## Project Structure

### Documentation (this feature)

```text
specs/73-development-cadence/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── development-cadence.md
└── tasks.md
```

### Source Code (repository root)

```text
components/
└── activity/
    ├── ActivityView.tsx
    ├── ActivityView.test.tsx
    ├── DevelopmentCadenceCard.tsx
    ├── DevelopmentCadenceCard.test.tsx
    └── development-cadence-chart.tsx

e2e/
└── activity.spec.ts

lib/
├── activity/
│   ├── cadence.ts
│   ├── cadence.test.ts
│   ├── view-model.ts
│   └── view-model.test.ts
├── analyzer/
│   └── analysis-result.ts
└── scoring/
    └── config-loader.ts
```

**Structure Decision**: Keep the current single-project Next.js structure. Revise the shared cadence domain files in `lib/activity/` to model selectable trend comparisons, then thread the new view-model shape through `components/activity/` and the existing Activity tests.

## Complexity Tracking

No constitution exceptions or extra complexity waivers are required for this revision.
