# Data Model: Missing Data & Accuracy (P1-F12)

No new data entities are introduced. This feature is a display-layer and format-function change only.

## Affected types (no schema changes)

### `AnalysisResult` (unchanged)
Fields typed as `number | Unavailable` or `string | Unavailable` remain exactly as-is. The `missingFields: string[]` array already exists. No changes to the data model.

### `MetricCardViewModel` (unchanged)
`missingFields: string[]` already threaded through. No new fields needed — the callout-panel approach is dropped; inline marking happens at the rendering level via format functions.

### `ActivityViewModel` (view model change only)
Remove `missingDataCallout` field from the section type. Format functions now return `"—"` so the callout is not needed.

### `ResponsivenessViewModel` (view model change only)
Remove `missingDataCallout` field from the section type. Same rationale.

## New shared component

### `MetricValue` — `components/shared/MetricValue.tsx`

```
Props:
  value: string        — the formatted metric string, e.g. "1,234" or "—"
  className?: string   — optional additional classes for the wrapper element

Behaviour:
  - If value === "—": renders with text-slate-400 (muted, visually absent)
  - Otherwise: renders with text-slate-900 font-semibold (standard metric styling)
```

Used at every rendering site that displays a formatted metric value — `<dd>` elements in Activity, Responsiveness, and MetricCard detail rows; summary stat values in MetricCard.

## Format function changes (return value only)

All existing format functions change their `"unavailable"` return branch from returning the string `"unavailable"` to returning `"—"`:

| Function | File | Change |
|---|---|---|
| `formatMetric()` | `lib/metric-cards/view-model.ts` | `return 'unavailable'` → `return '—'` |
| `formatText()` | `lib/metric-cards/view-model.ts` | fallback `'unavailable'` → `'—'` |
| `formatDate()` | `lib/metric-cards/view-model.ts` | `return value` when unavailable → `return '—'` |
| `formatHours()` | `lib/activity/score-config.ts` | `return value` → `return '—'` |
| `formatPercentage()` | `lib/activity/score-config.ts` | `return value` → `return '—'` |
| `formatHours()` | `lib/responsiveness/score-config.ts` | `return value` → `return '—'` |
| `formatPercentage()` | `lib/responsiveness/score-config.ts` | `return value` → `return '—'` |
| `formatCount()` | `lib/responsiveness/score-config.ts` | `return value` → `return '—'` |

No changes to `lib/health-ratios/view-model.ts` or `lib/comparison/view-model.ts` — these already return `"—"`.
