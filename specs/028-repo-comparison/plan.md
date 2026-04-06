# Implementation Plan: Repo Comparison

**Branch**: `028-repo-comparison` | **Date**: 2026-04-06 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/028-repo-comparison/spec.md`

## Summary

Implement `P1-F06 Repo Comparison` as the first real replacement for the current placeholder `Comparison` tab. This slice adds a dedicated comparison workspace for 2–4 successfully analyzed repositories, introduces an anchor-based comparison model with the first successful repo selected by default, and emphasizes meaningful differences more strongly than raw spreadsheet values. The view supports clearly labeled metric sections, section-level and attribute-level visibility controls, a median column that is enabled by default, local sorting on every visible comparison column, and explicit unavailable states — all derived from the already-fetched `AnalysisResult[]` payload with no additional API calls.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16.2 (App Router)  
**Primary Dependencies**: Next.js 16.2, Tailwind CSS 4, Vitest 4, React Testing Library 16, Playwright 1.58  
**Storage**: Stateless; no database or persistent server storage  
**Testing**: Vitest + React Testing Library (unit/integration), Playwright (E2E), manual verification  
**Target Platform**: Vercel-hosted Next.js web app, modern desktop/mobile browsers  
**Project Type**: Web application with server-side API routes and client-side analysis UI  
**Performance Goals**: Opening `Comparison`, changing the anchor repo, toggling sections or attributes, sorting any visible column, and enabling/disabling the median column must remain local UI work with no additional analysis request or API calls  
**Constraints**: Reuse the shared `AnalysisResult[]` contract; preserve exact unavailable states as `—`; respect the 4-repo comparison cap and communicate it clearly; keep comparison semantics deterministic for metrics where lower is better; do not fork metric definitions away from Overview / Contributors / Activity / Responsiveness / Health Ratios; prepare the comparison data model for later `Export` reuse  
**Scale/Scope**: comparison view-model design, `Comparison` tab implementation, anchor selection, section and attribute controls, median-column support, column sorting, 4-repo cap behavior, tests/manual checklist/docs

## Constitution Check

| Rule | Status | Notes |
|------|--------|-------|
| I / Phase 1 stack | PASS | Remains within the existing Next.js / React / Tailwind stack |
| II / Honest data only | PASS | Comparison reuses verified values or explicit unavailable states only |
| III / Shared analyzer outputs | PASS | Uses the existing `AnalysisResult[]` payload and does not add another fetch path |
| V / CHAOSS alignment | PASS | Comparison groups shipped metrics by the same domain families already used elsewhere in the app |
| VI / Config-driven thresholds | PASS | No new score thresholds introduced; directional semantics and labels remain centralized in shared helpers |
| IX / Feature scope rules | PASS | Scope is limited to the `Comparison` workspace and reusable comparison shaping logic |
| XI — TDD mandatory | PASS | View-model logic, sorting, anchor behavior, and cap behavior will require focused tests |
| XII / XIII — DoD and workflow | PASS | Manual checklist and follow-on tasks will be created before implementation begins |

**Gate result**: PASS — no constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/028-repo-comparison/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── comparison-ui.md
│   └── comparison-view-props.ts
├── checklists/
│   ├── requirements.md
│   └── manual-testing.md
└── tasks.md
```

### Source Code

```text
components/
├── comparison/
│   ├── ComparisonView.tsx                 ← NEW: top-level `Comparison` tab content
│   ├── ComparisonView.test.tsx            ← NEW: anchor, section, attribute, median, and sort behavior coverage
│   ├── ComparisonControls.tsx             ← NEW: anchor picker, section toggles, attribute toggles, median toggle
│   └── ComparisonTable.tsx                ← NEW: grouped table rendering and visible-column sorting UI
├── app-shell/
│   ├── ResultsShell.test.tsx              ← MODIFIED: `Comparison` no longer uses placeholder-only behavior
│   └── ResultsTabs.test.tsx               ← MODIFIED: comparison visibility based on result count
└── repo-input/
    ├── RepoInputClient.tsx                ← MODIFIED: routes successful multi-repo analysis into the real `Comparison` view
    └── RepoInputClient.test.tsx           ← MODIFIED: integration coverage for multi-repo comparison workflows and 4-repo cap messaging

lib/
├── comparison/
│   ├── sections.ts                        ← NEW: shared section and attribute definitions
│   ├── view-model.ts                      ← NEW: anchor-aware row shaping, median computation, sorting, and section filtering
│   └── view-model.test.ts                 ← NEW: deterministic comparison helpers and unavailable handling
├── results-shell/
│   └── tabs.ts                            ← MODIFIED: `Comparison` becomes implemented instead of placeholder
└── analyzer/
    └── analysis-result.ts                 ← REUSED: comparison consumes existing fields only; schema stays export-ready

e2e/
└── comparison.spec.ts                     ← NEW: tab visibility, anchor switching, controls, and sorting scenarios
```

## Implementation Sequence

### Phase 0 — Research

1. Confirm which shipped metric families must appear in comparison and how to reuse their existing labels/help text instead of redefining them
2. Decide the anchor-delta semantics for directional metrics where lower is better (`stale issue ratio`, response times, etc.)
3. Decide the simplest section/attribute control model that works cleanly for 2–4 repositories without overwhelming the view
4. Confirm how the 4-repo cap should be communicated in the input flow and what happens when more than four repos are analyzed successfully

### Phase 1 — Design

5. Define the comparison data model for sections, attributes, cells, median values, anchor deltas, and visible/sort state
6. Define the `Comparison` UI contract, including section headings, anchor selector, section toggles, attribute toggles, median-column toggle, and per-column sorting affordances
7. Define deterministic sort behavior for unavailable values, median cells, and directional metrics
8. Create the manual testing checklist for 2-repo, 4-repo, over-cap, unavailable-data, anchor-switching, and sorting scenarios

### Phase 2 — Implementation Preview

9. Add shared comparison section and attribute definitions so the comparison feature stays aligned with existing metric families
10. Build the comparison view-model from `AnalysisResult[]`, including default anchor selection, median computation, section filtering, attribute filtering, and local sorting
11. Implement the `Comparison` tab UI with grouped sections and controls that make comparison-focused deltas more prominent than raw values
12. Replace the current placeholder `Comparison` tab content and update results-shell behavior for single-repo vs multi-repo analysis
13. Add clear 4-repo cap messaging in the relevant input/comparison workflows
14. Add unit/integration/E2E coverage for anchor behavior, visible sections/attributes, median column toggling, sorting, unavailable states, and no-extra-fetch behavior

## Complexity Tracking

No constitution violations. No complexity justification required.
