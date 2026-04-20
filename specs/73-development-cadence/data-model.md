# Phase 1 Data Model: Development Cadence

**Feature**: P2-F10 — Development Cadence (issue #73)  
**Branch**: `73-development-cadence`

Flat, diffable shapes per Constitution §IX.5.

---

## `TrendComparisonMode`

User-selectable momentum lens for the unified trend module.

```ts
export type TrendComparisonMode = 'month' | 'week' | 'day'
```

Semantics:

- `month` = latest 30 days versus the immediately preceding 30 days
- `week` = latest 7 days versus the immediately preceding 7 days
- `day` = most recent complete UTC day versus the immediately preceding complete UTC day

---

## `TrendComparisonMetrics`

Normalized per-mode trend payload derived from verified commit timestamps.

```ts
export interface TrendComparisonMetrics {
  currentPeriodCommitCount: number | Unavailable
  previousPeriodCommitCount: number | Unavailable
  delta: number | Unavailable
  direction: 'accelerating' | 'decelerating' | 'flat' | Unavailable
}
```

Rules:

- `delta = (current - previous) / previous` when `previous > 0`
- `delta = 1` when `previous = 0` and `current > 0`
- all fields are `unavailable` when the selected mode lacks sufficient verified data
- `flat` uses the existing cadence tolerance for materially equal periods

---

## `ActivityCadenceMetrics`

Optional field on `AnalysisResult` capturing cadence-specific raw and derived signals for the Activity tab.

```ts
export type Unavailable = 'unavailable'

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
```

`AnalysisResult` keeps:

```ts
activityCadenceByWindow?: Record<ActivityWindowDays, ActivityCadenceMetrics>
commitTimestamps365d?: string[] | Unavailable
```

- `commitTimestamps365d` remains the verified source of truth for recomputing cadence windows.
- `trendComparisons` replaces the single 30-day trend summary with mode-specific summaries kept inside each cadence object.

---

## `CadencePercentileSummary`

Derived percentile context attached to the Activity view model rather than stored in raw analyzer output.

```ts
export interface CadencePercentileSummary {
  activeWeeksPercentile: number | null
  regularityPercentile: number | null
  longestGapOutlier: boolean
}
```

Rules:

- `activeWeeksPercentile` uses direct interpolation against bracket calibration
- `regularityPercentile` uses inverted interpolation because lower dispersion is better
- `longestGapOutlier` is `true` when `longestGapDays >= ACTIVITY_LONG_GAP_ALERT_DAYS`

---

## `TrendComparisonViewModel`

Presentation-ready summary for one momentum mode.

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
```

This keeps mode-specific copy, labels, and formatted values out of the component implementation.

---

## `DevelopmentCadenceCardViewModel`

UI-facing shape consumed by the Activity-tab cadence card.

```ts
export interface WeeklyCommitBar {
  weekLabel: string
  commitCount: number
  isActive: boolean
}

export interface DevelopmentCadenceCardViewModel {
  repo: string
  chartBars: WeeklyCommitBar[] | null
  regularityLabel: 'High consistency' | 'Moderate consistency' | 'Bursty' | 'Insufficient verified public data'
  regularityPercentileLabel: string | null
  activeWeeksValue: string
  activeWeeksPercentileLabel: string | null
  longestGapValue: string
  longestGapHighlighted: boolean
  weekendWeekdayValue: string
  defaultTrendMode: TrendComparisonMode
  trendModes: Record<TrendComparisonMode, TrendComparisonViewModel>
}
```

The card remains presentation-ready, but the trend area now exposes one formatted view model per approved mode plus the default selected mode.

---

## State classification rules

- **Unavailable cadence object**:
  - no verified commit timestamps in the selected Activity window
- **Unavailable longest gap**:
  - fewer than 2 verified commits in the selected window
- **Unavailable weekend ratio**:
  - zero verified commits in the selected window
- **Unavailable trend mode**:
  - the selected mode has no verifiable commits in either compared period
- **Flat trend**:
  - both periods are verifiable and materially equal under the cadence trend tolerance
- **Insufficient verified public data**:
  - cadence readout or selected trend mode cannot be computed because the required raw cadence inputs are unavailable
