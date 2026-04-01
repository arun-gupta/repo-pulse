# Implementation Plan: Ecosystem Map

**Branch**: `005-ecosystem-map` | **Date**: 2026-03-31 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/005-ecosystem-map/spec.md`

## Summary

Add the first visual analysis layer to ForkPrint by turning successful `AnalysisResult[]` data into an ecosystem-map section on the home page. The feature will show visible ecosystem metrics for each successful repository, render a bubble chart using stars, forks, and watchers, derive ForkPrint ecosystem classifications from median splits across the current successful input set, and handle single-repo analysis honestly by skipping classification while keeping the chart useful.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16.2 (App Router)  
**Primary Dependencies**: Tailwind CSS 4, Chart.js 4 + `react-chartjs-2`, Vitest 4, React Testing Library 16, Playwright 1.58  
**Storage**: Stateless; no database or persistent server storage  
**Testing**: Vitest + React Testing Library (unit/integration), Playwright (E2E)  
**Target Platform**: Vercel-hosted Next.js web app, modern desktop/mobile browsers  
**Project Type**: Web application with a shared framework-agnostic analyzer module and client-side visualization  
**Performance Goals**: Render usable ecosystem visualization for 1–6 successful repos without extra API calls; keep chart interactions responsive at normal Phase 1 analysis sizes  
**Constraints**: Verified GitHub GraphQL data only; missing ecosystem metrics must stay explicit; quadrant thresholds must be derived from current successful input set; single-repo input must skip classification; no dashboard-level architecture that blocks later phases  
**Scale/Scope**: Home-page ecosystem-map section, chart utilities, classification helpers, and supporting tests/manual checklist for 1–6 analyzed repos

## Constitution Check

| Rule | Status | Notes |
|------|--------|-------|
| I / Phase 1 stack | PASS | Introduce Chart.js per approved Phase 1 stack |
| II — Verified data only | PASS | Chart uses already-fetched `AnalysisResult[]`; no guessed coordinates for unavailable metrics |
| IV — Shared analyzer boundary | PASS | No analyzer changes required beyond consuming existing flat results |
| V / VII — CHAOSS alignment and quadrant rules | PASS | Treat quadrant as ForkPrint ecosystem classification aligned to CHAOSS; median split only |
| VII.3 — Single-repo behavior | PASS | Single successful repo renders chart/metrics but skips classification with explanatory note |
| IX.5 — Flat `AnalysisResult` schema | PASS | Visualization consumes existing flat schema without transformation requirements leaking upstream |
| XI — TDD mandatory | PASS | Classification/chart tests are written before implementation in tasks phase |
| XII / XIII — Manual checklist required | PASS | `checklists/manual-testing.md` will be created and maintained for this feature |

**Gate result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-ecosystem-map/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ecosystem-map-props.ts
│   └── ecosystem-map-ui.md
├── checklists/
│   ├── requirements.md
│   └── manual-testing.md
└── tasks.md
```

### Source Code

```text
app/
└── page.tsx                                  ← MAY REMAIN UNCHANGED; feature stays on current home page

components/
├── ecosystem-map/
│   ├── EcosystemMap.tsx                      ← NEW: chart + visible metric display + note/legend
│   ├── EcosystemMap.test.tsx                ← NEW: rendering and interaction coverage
│   └── ecosystem-map-utils.test.ts          ← NEW: classification helper tests
└── repo-input/
    ├── RepoInputClient.tsx                  ← MODIFIED: render ecosystem map from successful results
    └── RepoInputClient.test.tsx             ← MODIFIED: end-to-end client-state coverage with map

lib/
├── analyzer/
│   └── analysis-result.ts                   ← UNCHANGED: consumed as input contract
└── ecosystem-map/
    ├── classification.ts                    ← NEW: median split + single-repo logic
    └── chart-data.ts                        ← NEW: convert successful results into chart/metric view models

e2e/
└── ecosystem-map.spec.ts                    ← NEW: visible metrics, chart rendering, single-repo note, tooltip behavior
```

## Implementation Sequence

### Phase 0 — Research

1. Confirm the charting approach that best supports 1–6 repos, tooltips, and responsive layouts with the approved stack
2. Decide how unavailable ecosystem metrics are represented without inventing chart coordinates
3. Decide how ForkPrint ecosystem classification wording appears in UI without implying official CHAOSS labels

### Phase 1 — Design

4. Define the ecosystem bubble, classification boundary, visible metric strip, and single-repo notice models
5. Define component props and chart/tooltip UI contract
6. Create the manual testing checklist for single-repo, multi-repo, tooltip, and unavailable-metric scenarios
7. Confirm source-code structure for chart utilities versus UI rendering

### Phase 2 — Implementation Preview

8. Add Chart.js dependencies and create reusable ecosystem-map utilities/components
9. Render visible stars/forks/watchers for successful repos in the ecosystem-map section
10. Render the bubble chart from existing `analysisResponse.results`
11. Add ForkPrint ecosystem classification from median splits for multi-repo runs
12. Add single-repo explanatory note and tooltip behavior
13. Add unit, component, and E2E coverage for visible metrics, plotting, classification, and single-repo handling

## Complexity Tracking

No constitution violations. No complexity justification required.
