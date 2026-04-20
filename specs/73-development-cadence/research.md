# Phase 0 Research: Development Cadence

**Feature**: P2-F10 — Development Cadence (issue #73)  
**Branch**: `73-development-cadence`  
**Date**: 2026-04-20

This document resolves the main design choices required before implementation of the revised trend module.

---

## Q1 — What is the clearest cadence visual for the main rhythm story?

**Context**: The approved spec still requires an at-a-glance rhythm visual that makes steady versus bursty development obvious, even after the trend area is consolidated.

### Decision

**Keep the compact weekly bar-strip visual as the main cadence chart.**

The rhythm chart continues to show one bucket per week across the selected cadence window, while the separate trend area is refactored into a single stronger module rather than overloaded into the weekly chart.

### Rationale

1. **It already answers the right question.** The weekly bars communicate burstiness and consistency better than a line or summary number.
2. **It avoids chart overload.** The revised feature adds mode selection to the trend module, so the rhythm chart should stay focused on cadence shape.
3. **It stays aligned with YAGNI.** No new charting system or second full-size chart is needed for the revised scope.

### Alternatives considered

- **Replace the weekly strip with a single momentum chart**: Rejected because it weakens the “steady vs bursty” story required by the cadence spec.
- **Fold trend modes directly into the weekly chart**: Rejected because mode switching answers a different question than weekly rhythm.

---

## Q2 — How should commit regularity continue to be computed?

**Context**: The revised trend module does not change the regularity requirement, but the plan still needs a stable decision for the core cadence readout.

### Decision

**Keep commit regularity based on the coefficient of variation of weekly commit counts across the selected cadence window.**

### Rationale

1. **It is already spec-aligned and volume-independent.**
2. **Zero-commit weeks still matter.** They remain essential for distinguishing truly steady work from bursty work.
3. **No redesign pressure exists here.** The new scope changes trend comparison modes, not regularity semantics.

### Alternatives considered

- **Longest active streak**: Rejected because it hides dispersion across the rest of the window.
- **Raw standard deviation**: Rejected because it overweights absolute volume.

---

## Q3 — How should the revised trend area be presented?

**Context**: The user wants the existing separate “Trend” tile and adjacent 30-day counts collapsed into one more impactful module.

### Decision

**Replace the split trend tile + comparison block with one unified momentum module.**

The module will present:

- the selected comparison mode,
- the trend direction cue,
- the signed delta,
- the two compared period totals,
- and explanatory labels/tooltips tied to the current mode.

### Rationale

1. **The current split presentation makes users reconcile two surfaces manually.**
2. **A single module is easier to scan.** The meaning of the percentage and the underlying counts stay together.
3. **It naturally supports mode switching.** Month/week/day become alternate views of the same momentum concept.

### Alternatives considered

- **Keep the current split layout and only change labels**: Rejected because it does not address the core comprehension problem.
- **Show trend only as text and leave counts below**: Rejected because it remains visually fragmented.

---

## Q4 — Which trend modes should ship, and what should be the default?

**Context**: The approved spec revision now explicitly includes selectable month-over-month, week-over-week, and day-over-day modes.

### Decision

**Ship exactly three modes: month-over-month (default), week-over-week, and day-over-day.**

- **Month-over-month** compares the latest 30 days to the immediately preceding 30 days.
- **Week-over-week** compares the latest 7 days to the immediately preceding 7 days.
- **Day-over-day** compares the most recent complete UTC day to the immediately preceding complete UTC day.

### Rationale

1. **Month-over-month is the broadest and most stable baseline.**
2. **Week-over-week provides a shorter-term operational view without excessive noise.**
3. **Day-over-day is intentionally narrow and should be opt-in rather than default.**
4. **Limiting the set to three modes keeps the UI and data model bounded to the approved contract.**

### Alternatives considered

- **Custom date ranges**: Rejected as feature expansion beyond the approved revision.
- **Rolling averages**: Rejected because the spec asks for direct period comparisons.
- **Default week-over-week**: Rejected because it is more volatile and less representative for many repos.

---

## Q5 — How should day-over-day avoid misleading partial-day comparisons?

**Context**: A same-day comparison would fluctuate as the current day is still in progress, which would undermine the accuracy story.

### Decision

**Define day-over-day using complete UTC days only.**

The comparison uses:

- **Current day window**: the most recently completed UTC day
- **Prior day window**: the UTC day immediately before it

The in-progress current day is excluded from day-over-day trend calculations.

### Rationale

1. **Avoids partial-day noise and mid-day reversals.**
2. **Preserves a clear, testable formula grounded in verified timestamps.**
3. **Matches the repo’s accuracy policy by avoiding implicit normalization or extrapolation.**

### Alternatives considered

- **Use “last 24 hours” versus previous 24 hours**: Rejected because it produces moving-window results that are harder to explain in the UI.
- **Use the current partial day**: Rejected because it creates misleading comparisons early in the day.

---

## Q6 — Where should multi-mode trend data live?

**Context**: The current cadence object stores only one 30-day trend summary. The revised scope needs three parallel comparisons while keeping the analyzer boundary intact.

### Decision

**Model trend comparisons as a nested record inside each `ActivityCadenceMetrics` object, keyed by comparison mode.**

That keeps all cadence-derived momentum data together and lets the view model choose a default mode plus preformatted labels without recomputing formulas in the component.

### Rationale

1. **Keeps trend logic in the domain layer rather than the UI.**
2. **Reuses the existing per-window cadence object instead of adding disconnected top-level fields.**
3. **Supports per-mode unavailable states honestly.**

### Alternatives considered

- **Separate top-level trend fields on `AnalysisResult`**: Rejected because they split cadence logic across multiple shapes.
- **Derive week/day modes directly in the component**: Rejected by the analyzer-boundary rule and would make testing weaker.

---

## Additional implementation decisions

### R7 — Weekend ratio presentation

**Decision**: Keep weekend activity descriptive only and continue separating the user-facing display choice from the underlying verified counts and ratio. The revised trend work does not make weekend activity a scored signal.

### R8 — Missing-data handling for trend modes

**Decision**:

- if both compared periods for a selected mode contain zero verified commits, that mode is `unavailable`
- if the prior period is zero and the current period is non-zero, delta is treated as `+100%`
- if one mode is unavailable, the other modes remain selectable and independent

This preserves Constitution §II without borrowing values across modes.

### R9 — UI interaction scope

**Decision**: Trend mode switching is local to the rendered cadence card and does not change the main Activity window selector or trigger a new repository analysis request.
