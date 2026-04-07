# Implementation Plan: Missing Data & Accuracy

**Branch**: `031-missing-data-accuracy` | **Date**: 2026-04-06 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/031-missing-data-accuracy/spec.md`

## Summary

Replace all inconsistent `"unavailable"` rendering across every `AnalysisResult`-driven metric surface with a uniform `"—"` (em-dash) in `text-slate-400`. The fix has two parts: (1) update format functions to return `"—"` instead of the string `"unavailable"`, and (2) add a shared `MetricValue` component that applies muted styling for `"—"` and standard styling otherwise, used at every rendering site. Remove aggregate amber callout panels from Activity, Responsiveness, and Contributors views — they are superseded by the inline markers.

## Technical Context

**Language/Version**: TypeScript 5, React 19  
**Primary Dependencies**: Next.js 16.2 (App Router), Tailwind CSS 4  
**Storage**: N/A — ephemeral browser state only  
**Testing**: Vitest 4, React Testing Library 16, Playwright 1.58  
**Target Platform**: Web (Vercel)  
**Project Type**: Web application  
**Performance Goals**: No performance impact — display-only change  
**Constraints**: No new dependencies. No changes to `AnalysisResult` schema. Analyzer module must remain runtime-agnostic (constitution §IV).  
**Scale/Scope**: 8 format functions updated, 1 new shared component, ~8 rendering components updated

## Constitution Check

| Rule | Status | Notes |
|---|---|---|
| §I Technology Stack | ✅ | No new dependencies |
| §II Accuracy Policy — fields marked `"unavailable"`, never hidden/zeroed | ✅ | This feature enforces rule 3 explicitly |
| §IV Analyzer Module Boundary | ✅ | No changes to analyzer module |
| §IX YAGNI / Keep It Simple | ✅ | Smallest change: format functions + one shared component |
| §XI TDD mandatory | ✅ | Tests written before implementation |
| §XII Definition of Done | ✅ | Manual testing checklist required |

## Project Structure

### Documentation (this feature)

```text
specs/031-missing-data-accuracy/
├── plan.md              ← this file
├── research.md          ← surface audit and decisions
├── data-model.md        ← affected types and new component contract
├── contracts/
│   └── metric-value-props.ts
├── checklists/
│   ├── requirements.md
│   └── manual-testing.md  ← created during implementation
└── tasks.md             ← /speckit.tasks output
```

### Source Code — affected files

```text
components/
├── shared/
│   └── MetricValue.tsx              ← NEW: renders "—" with text-slate-400
├── metric-cards/
│   └── MetricCard.tsx               ← UPDATE: SummaryStat + detail rows use MetricValue
├── activity/
│   └── ActivityView.tsx             ← UPDATE: <dd> values use MetricValue; remove missingDataCallout panel
├── responsiveness/
│   └── ResponsivenessView.tsx       ← UPDATE: <dd> values use MetricValue; remove missingDataCallout panel
├── contributors/
│   ├── SustainabilityPane.tsx       ← UPDATE: remove "Missing data" amber panel
│   └── ContributionBarChart.tsx     ← UPDATE: emptyText="—" with text-slate-400
├── health-ratios/
│   └── HealthRatiosView.tsx         ← UPDATE: add text-slate-400 when cell.displayValue === "—"
└── comparison/
    └── ComparisonTable.tsx          ← UPDATE: add text-slate-400 when cell.displayValue === "—"

lib/
├── metric-cards/
│   └── view-model.ts                ← UPDATE: formatMetric, formatText, formatDate → return "—"
├── activity/
│   ├── score-config.ts              ← UPDATE: formatHours, formatPercentage → return "—"
│   └── view-model.ts                ← UPDATE: remove missingDataCallout generation
└── responsiveness/
    ├── score-config.ts              ← UPDATE: formatHours, formatPercentage, formatCount → return "—"
    └── view-model.ts                ← UPDATE: remove missingDataCallout generation
```

**Structure Decision**: Follows the existing project layout. New `MetricValue` goes in `components/shared/` alongside the existing `HelpLabel` shared component.

## Implementation Phases

### Phase A — Format functions (lib layer)

Update 8 format functions to return `"—"` instead of the string `"unavailable"`. No behavior change for valid values. Update all unit tests that currently assert the return value `"unavailable"` to assert `"—"`.

Files:
- `lib/metric-cards/view-model.ts` — `formatMetric`, `formatText`, `formatDate`
- `lib/activity/score-config.ts` — `formatHours`, `formatPercentage`
- `lib/responsiveness/score-config.ts` — `formatHours`, `formatPercentage`, `formatCount`

### Phase B — Shared MetricValue component

Create `components/shared/MetricValue.tsx`:
- Props: `value: string`, optional `className?: string`
- Renders `"—"` with `text-slate-400`
- Renders all other values with `text-slate-900 font-semibold`
- Unit test: renders muted dash for `"—"`, standard styling for `"123"` and `"0"`

### Phase C — MetricCard

Update `MetricCard.tsx`:
- `SummaryStat`: replace `<p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>` with `<MetricValue value={value} className="mt-1 text-lg" />`
- Detail rows (if rendered — confirm `details` array is displayed): same treatment

Update `lib/metric-cards/view-model.test.ts`: assert that `starsLabel`, `forksLabel`, `watchersLabel` return `"—"` (not `"unavailable"`) when the input is `"unavailable"`.

### Phase D — Activity view

`lib/activity/view-model.ts`:
- Remove `missingDataCallout` field and its generation logic from the section type and `buildActivitySection()`

`components/activity/ActivityView.tsx`:
- Remove the `{section.missingDataCallout ? <div>...</div> : null}` amber panel block
- Update `<dd>` elements rendering `formatHours`/`formatPercentage` output to use `<MetricValue>`

Update affected tests.

### Phase E — Responsiveness view

`lib/responsiveness/view-model.ts`:
- Remove `missingDataCallout` field and its generation logic

`components/responsiveness/ResponsivenessView.tsx`:
- Remove amber callout panel block
- Update `<dd className="text-base font-semibold text-slate-900">{metric.value}</dd>` to use `<MetricValue value={metric.value} className="text-base" />`

Update affected tests.

### Phase F — Contributors

`components/contributors/SustainabilityPane.tsx`:
- Remove the "Missing data" amber panel block (`section.missingData.length > 0 ? ...`)

`components/contributors/ContributionBarChart.tsx`:
- Change `emptyText` prop to `"—"` at all call sites
- Update rendering of `emptyText` to use `text-slate-400`

Update affected tests.

### Phase G — Health Ratios and Comparison

`components/health-ratios/HealthRatiosView.tsx`:
- Line `{cell?.displayValue ?? '—'}` already shows `"—"`. Add conditional styling: `className={cell?.displayValue === '—' ? 'text-slate-400' : ''}`

`components/comparison/ComparisonTable.tsx`:
- `cell.displayValue` already `"—"` for unavailable. Add `text-slate-400` class when value is `"—"`.

Update affected tests.

### Phase H — E2E verification

Update or add E2E test asserting:
- A repo result with `missingFields` non-empty renders `"—"` (not `"unavailable"` string) at the metric card level
- No `"unavailable"` string appears anywhere in rendered output for `AnalysisResult` metric values

## Complexity Tracking

No constitution violations. No complexity justification needed.
