# Contract: Development Cadence

**Feature**: P2-F10 — Development Cadence (issue #73)  
**Branch**: `73-development-cadence`

This contract locks the module interfaces that cross analyzer, scoring, and Activity-tab rendering for the revised cadence panel.

---

## 1. Analyzer output — cadence fields on `AnalysisResult`

```ts
// lib/analyzer/analysis-result.ts
export type TrendComparisonMode = 'month' | 'week' | 'day'

export interface TrendComparisonMetrics {
  currentPeriodCommitCount: number | Unavailable
  previousPeriodCommitCount: number | Unavailable
  delta: number | Unavailable
  direction: 'accelerating' | 'decelerating' | 'flat' | Unavailable
}

export interface ActivityCadenceMetrics {
  totalWeeks: number | Unavailable
  weeklyCommitCounts: number[] | Unavailable
  activeWeeksRatio: number | Unavailable
  commitRegularity: number | Unavailable
  longestGapDays: number | Unavailable
  weekendToWeekdayRatio: number | Unavailable
  weekendCommitCount: number | Unavailable
  weekdayCommitCount: number | Unavailable
  trendComparisons: Record<TrendComparisonMode, TrendComparisonMetrics> | Unavailable
}

export interface AnalysisResult {
  // ...existing fields...
  commitTimestamps365d?: string[] | Unavailable
  activityCadenceByWindow?: Record<ActivityWindowDays, ActivityCadenceMetrics>
}
```

**Contract**:

- Fresh analyses emit either a cadence object or per-field `'unavailable'`; older fixtures may still leave cadence fields `undefined`.
- `weeklyCommitCounts` always includes zero-commit weeks when present.
- `trendComparisons` contains exactly the three approved modes (`month`, `week`, `day`) when present.

---

## 2. Pure cadence derivation — `lib/activity/cadence.ts`

```ts
export interface BuildCadenceInput {
  commitTimestamps: string[]
  now: Date
  windowDays: ActivityWindowDays
}

export function buildActivityCadenceMetrics(input: BuildCadenceInput): ActivityCadenceMetrics
```

**Contract**:

- Pure function: no network, no `Date.now()` reads, no UI dependencies.
- Input timestamps may be unsorted; implementation normalizes to chronological order.
- Returns per-field `'unavailable'` when the selected window lacks sufficient verified commits for a cadence metric or trend mode.
- Day-over-day uses complete UTC days only; the in-progress current day is excluded.

---

## 3. Calibration contract — `lib/scoring/config-loader.ts`

```ts
export interface BracketCalibration {
  // ...existing fields...
  activeWeeksRatio: PercentileSet
  commitRegularity: PercentileSet
}

export const ACTIVITY_LONG_GAP_ALERT_DAYS: number
```

**Contract**:

- `activeWeeksRatio` percentiles are interpreted normally (higher is healthier).
- `commitRegularity` percentiles are interpreted with `inverted = true` because lower dispersion is healthier.
- `ACTIVITY_LONG_GAP_ALERT_DAYS` is shared config, not hardcoded in components.

---

## 4. Activity view-model contract — `lib/activity/view-model.ts`

```ts
export interface TrendComparisonViewModel {
  label: string
  helperText: string
  trendLabel: 'Accelerating' | 'Decelerating' | 'Flat' | 'Insufficient verified public data'
  trendDeltaValue: string | null
  currentPeriodLabel: string
  currentPeriodValue: string
  previousPeriodLabel: string
  previousPeriodValue: string
}

export interface DevelopmentCadenceCardViewModel {
  repo: string
  chartBars: WeeklyCommitBar[] | null
  regularityLabel: string
  regularityPercentileLabel: string | null
  activeWeeksValue: string
  activeWeeksPercentileLabel: string | null
  longestGapValue: string
  longestGapHighlighted: boolean
  weekendWeekdayValue: string
  defaultTrendMode: TrendComparisonMode
  trendModes: Record<TrendComparisonMode, TrendComparisonViewModel>
}

export function buildDevelopmentCadenceCard(
  result: AnalysisResult,
  windowDays: ActivityWindowDays,
): DevelopmentCadenceCardViewModel | null
```

**Contract**:

- Returns `null` only when the feature is completely absent from the analysis result.
- Unavailable metric values are preformatted for UI consumption and use the same missing-data conventions as the rest of the Activity tab.
- The default selected trend mode is `month`.

---

## 5. Activity-tab rendering contract — `components/activity/DevelopmentCadenceCard.tsx`

```ts
interface DevelopmentCadenceCardProps {
  result: AnalysisResult
  windowDays: ActivityWindowDays
}
```

**Contract**:

- Renders one main weekly cadence visual and one unified trend module.
- The unified trend module defaults to month-over-month and allows switching to week-over-week and day-over-day.
- Does not fetch data or derive cadence formulas itself beyond trivial UI state and formatting.
- Uses the shared missing-data treatment (`—`) rather than raw `"unavailable"` strings.

---

## 6. Calibration script contract — `scripts/calibrate.ts`

The calibration pipeline must emit percentile anchors for:

```ts
activeWeeksRatio: number | null
commitRegularity: number | null
```

**Contract**:

- Metrics are computed from the same verified commit-history source used by the analyzer.
- Calibration output updates `lib/scoring/calibration-data.json` with the two percentile sets per bracket.
- If a sampled repo lacks enough commit history, the metric is `null` and excluded from percentile aggregation.

---

## 7. Constitution compliance

| # | Rule | How this contract upholds it |
|---|---|---|
| II | Accuracy | All cadence and trend-mode values derive from verified commit timestamps or direct formulas; unavailable states stay explicit |
| III | Data Sources | No new source beyond GitHub GraphQL and the existing calibration pipeline |
| IV | Analyzer Boundary | Cadence and trend-mode derivation stay in shared library code; UI consumes a view model |
| V | CHAOSS | No new score category; Activity is extended in place |
| VI | Thresholds | Long-gap alerting and percentile anchors live in shared config/calibration data |
| IX | YAGNI | Only the three approved comparison modes are modeled; no custom range builder or extra trend surfaces are introduced |
| XI | Testing | Every pure function and view-model contract remains testable before UI wiring |
