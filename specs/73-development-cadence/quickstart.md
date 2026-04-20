# Quickstart: Development Cadence (P2-F10 / #73)

One-page implementation map for a developer picking up the revised cadence scope mid-flight.

---

## What ships

1. A **Development Cadence** section inside the existing Activity tab.
2. Five cadence metrics:
   - commit regularity
   - active weeks ratio
   - longest gap
   - weekend-to-weekday ratio
   - recent velocity trend
3. A weekly commit-rhythm visual that makes steady versus bursty development obvious.
4. One unified trend module that combines:
   - trend direction
   - delta
   - the two compared period totals
   - selectable comparison modes
5. Three trend modes:
   - month-over-month (default)
   - week-over-week
   - day-over-day
6. Calibration-backed percentile context for:
   - active weeks ratio
   - cadence regularity
7. Long-gap highlighting via shared config threshold.

## What does NOT ship

- A new top-level tab
- A new composite score or CHAOSS category
- Recommendations driven by cadence signals
- Custom comparison ranges or arbitrary date pickers
- Export, comparison, or org-aggregation cadence surfaces in this slice
- Percentile ranking for weekend-to-weekday ratio

---

## Directory walk (implementation order)

1. `lib/analyzer/analysis-result.ts` — replace the single trend fields with nested per-mode comparison shapes.
2. `lib/activity/cadence.test.ts` — write red tests for month/week/day comparisons, including complete-day behavior and per-mode unavailable states.
3. `lib/activity/cadence.ts` — implement shared period-comparison derivation and embed it in each cadence object.
4. `lib/activity/view-model.test.ts` — write red tests for default mode selection and mode-specific labels/values.
5. `lib/activity/view-model.ts` — expose a unified trend view-model instead of disconnected trend/count fields.
6. `components/activity/DevelopmentCadenceCard.test.tsx` — write red UI tests for the merged trend module, selector behavior, and updated copy/tooltips.
7. `components/activity/DevelopmentCadenceCard.tsx` — replace the split trend area with a single mode-switching module.
8. `components/activity/ActivityView.test.tsx` — confirm cadence remains wired cleanly inside the Activity tab.
9. `e2e/activity.spec.ts` — extend Activity coverage for default month mode and local switching between trend modes.

---

## Gotchas

- **Month stays the default**: week/day are alternate lenses, not the opening state.
- **Day-over-day uses complete UTC days**: do not compare against the in-progress current day.
- **Mode switching is local UI state**: it should not rerun analysis or interfere with the Activity window selector.
- **Unavailable stays mode-specific**: one unavailable mode must not borrow counts or deltas from another.
- **Use the shared missing-data treatment**: UI should render `—`, not raw `"unavailable"`.

---

## Testing rubric

- **Unit (Vitest)**:
  - `lib/activity/cadence.ts`
  - `lib/activity/view-model.ts`
- **Component (Vitest + RTL)**:
  - `DevelopmentCadenceCard`
  - `ActivityView`
- **E2E (Playwright)**:
  - `e2e/activity.spec.ts` extended to assert the default month view and local mode switching

---

## Release sequencing

This remains one Phase 2 PR on `73-development-cadence`. On completion, `docs/DEVELOPMENT.md` flips `P2-F10` to `✅ Done`.
