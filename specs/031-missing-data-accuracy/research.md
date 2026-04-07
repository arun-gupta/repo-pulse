# Research: Missing Data & Accuracy (P1-F12)

## Current State Audit

Full inventory of how `"unavailable"` is currently rendered across every metric display surface.

### Surface-by-surface breakdown

| Surface | Current treatment | Compliant? |
|---|---|---|
| `MetricCard` summary stats (stars, forks, watchers) | `formatMetric()` returns string `"unavailable"`; rendered bold `text-slate-900` | ❌ |
| `MetricCard` details list (commits, PRs, issues, contributors) | Same `formatMetric()` / `formatText()` returns string `"unavailable"`; unstyled | ❌ |
| `ActivityView` per-metric values | `formatHours()` / `formatPercentage()` return string `"unavailable"`; rendered `text-base font-semibold text-slate-900` | ❌ |
| `ActivityView` missing data | Aggregate amber callout panel listing all missing metrics for the window | ❌ (panel, not inline) |
| `ResponsivenessView` per-metric values | Same format functions, same bold styling | ❌ |
| `ResponsivenessView` missing data | Aggregate amber callout panel | ❌ (panel, not inline) |
| `SustainabilityPane` missing data | Amber callout panel "Missing data" listing absent contributor fields | ❌ (panel, not inline) |
| `ContributionBarChart` empty state | `emptyText="unavailable"` rendered as `text-sm text-slate-600` prose | ❌ (wrong text, no muted style) |
| `HealthRatiosView` cell values | View model already converts to `"—"`; rendered `text-xs text-slate-500` (reasonably muted) | ✅ (already correct) |
| `ComparisonTable` cell values | View model already converts to `"—"`; rendered `text-xs text-slate-500` | ✅ (already correct) |

### Format function audit

| Function | Location | Returns for `"unavailable"` |
|---|---|---|
| `formatMetric()` | `lib/metric-cards/view-model.ts` | string `"unavailable"` |
| `formatText()` | `lib/metric-cards/view-model.ts` | string `"unavailable"` or fallback |
| `formatHours()` | `lib/activity/score-config.ts` | string `"unavailable"` |
| `formatPercentage()` | `lib/activity/score-config.ts` | string `"unavailable"` |
| `formatHours()` | `lib/responsiveness/score-config.ts` | string `"unavailable"` |
| `formatPercentage()` | `lib/responsiveness/score-config.ts` | string `"unavailable"` |
| `formatCount()` | `lib/responsiveness/score-config.ts` | string `"unavailable"` |
| `formatHours()` (view model) | `lib/health-ratios/view-model.ts` | `"—"` ✅ |
| `formatValue()` | `lib/comparison/view-model.ts` | `"—"` ✅ |

---

## Decisions

### Decision 1: Canonical unavailable marker

**Chosen**: `"—"` (em-dash) with `text-slate-400` styling.

**Rationale**: Health Ratios and Comparison already use `"—"` and it is already the de facto standard in data tables. `text-slate-400` is visually muted without being invisible — clearly not a real value, clearly not the same as `0` rendered in standard `text-slate-900`. Amber would suggest a warning or action needed; slate muted is neutral and accurate ("not there" rather than "something is wrong").

**Alternatives rejected**:
- `"N/A"` — more characters, less conventional in data tables
- `"unavailable"` as display text — too verbose, looks like a label, currently confusable with real text values
- Amber `text-amber-600` — implies actionability; the data is simply not available, not broken

### Decision 2: Where conversion happens

**Chosen**: In format functions (`formatMetric`, `formatHours`, `formatPercentage`, `formatCount`, `formatText`). Each format function returns `"—"` when given `"unavailable"` input, instead of returning the string `"unavailable"`.

**Rationale**: Format functions are the single, correct place for this transform — they already handle the `number | Unavailable` → `string` conversion. Centralizing here means no component needs to check for `"unavailable"` strings; they only ever receive either a real formatted value or `"—"`.

**Alternatives rejected**:
- Detecting `"unavailable"` string in rendering components — adds duplication across every `<dd>` / `<p>` that renders a value
- Converting in view models — view models already delegate to format functions; adding a second conversion layer adds indirection

### Decision 3: Rendering — shared MetricValue component

**Chosen**: Create `components/shared/MetricValue.tsx` — a small component that receives `value: string` and applies `text-slate-400` when `value === '—'`, and standard `text-slate-900 font-semibold` otherwise. Used wherever a formatted metric string is rendered in a `<dd>` or stat cell.

**Rationale**: Avoids repeating `value === '—' ? 'text-slate-400' : 'text-slate-900'` inline at every rendering site. Three or more call sites justifies the component. Keeps the muted-styling rule in one place so it's easy to change globally.

**Alternatives rejected**:
- Inline conditional at each site — repetitive, drift-prone
- CSS class on format output — format functions return plain strings, not JSX

### Decision 4: Aggregate amber callout panels

**Chosen**: Remove `missingDataCallout` from Activity and Responsiveness view models. Remove "Missing data" panel from `SustainabilityPane`. The inline `"—"` markers at each field communicate the same information at the right location.

**Rationale**: Aggregate panels are the previous (conflicting) approach. With every field inline-marked, the panel duplicates information and creates visual noise. `score.missingInputs` for score computation context is already surfaced via `ActivityScoreHelp` and `ResponsivenessScoreHelp` tooltips — those remain unchanged.

**Alternatives rejected**:
- Keeping panels alongside inline markers — doubles up the missing-data signal, adds clutter
- Converting panels to inline but keeping them — panels are inherently aggregate; the right surface is the field itself

### Decision 5: Scope boundary

**In scope**: All `AnalysisResult`-driven metric surfaces — metric cards, activity, responsiveness, contributors, health ratios, comparison.

**Out of scope**: Org inventory (`OrgInventoryView`, `OrgInventorySummary`, `OrgInventoryTable`) — these use a different data type (`OrgInventoryResult`) and are covered by P1-F16. No changes to org inventory in this feature.

**Out of scope**: `RepoInputClient` rate-limit display — not a metric value, different context.
