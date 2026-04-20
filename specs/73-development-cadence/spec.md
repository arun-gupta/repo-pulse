# Feature Specification: Development Cadence

**Feature Branch**: `73-development-cadence`
**Created**: 2026-04-20
**Status**: Draft
**Input**: GitHub issue [#73](https://github.com/arun-gupta/repo-pulse/issues/73) — "Add development cadence and consistency metrics", plus branch feedback to unify the trend area and support selectable comparison modes
**Phase 2 Feature**: P2-F10

## Overview

Commit totals alone can make a repository look healthier than it is. A project that lands 100 commits in one burst and then goes quiet for months appears active by volume, but its development rhythm is fragile and unpredictable. Maintainers and adopters need to see whether work happens steadily, how often activity goes dark, and whether momentum is improving or fading.

This feature extends the existing Activity surface with a dedicated **Development Cadence** panel, a percentile-backed cadence readout, and a stronger trend module that combines the summary signal with the compared-period totals in one place. It focuses on five cadence signals for this slice: commit regularity, active weeks ratio, longest gap between commits, weekend-to-weekday ratio, and recent velocity trend. Together these signals describe whether development is steady, sporadic, accelerating, or stalled.

### Why this belongs in Activity, not a separate top-level tab

Development cadence is a deeper view into commit behavior, which RepoPulse already treats as part of Activity. Surfacing cadence in the Activity tab keeps throughput and consistency together instead of splitting one concept across multiple places. The feature adds new cadence-specific measurements and percentile context without changing the user's primary navigation model.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Cadence metrics visible in the Activity tab (Priority: P1)

A maintainer reviewing a repository can open the Activity tab and immediately see whether work happens steadily or in bursts. The tab shows cadence metrics alongside an at-a-glance visual of recent commit rhythm so the user does not need to infer consistency from raw commit totals alone.

**Why this priority**: Visibility is the core outcome in the issue acceptance criteria. Without a clear Activity-tab presentation, the cadence signals do not help users.

**Independent Test**: Analyze a repository with enough recent commit history, open the Activity tab, and confirm that Development Cadence metrics are shown with raw values, human-readable labels, and a visual trend that makes bursty vs steady patterns obvious.

**Acceptance Scenarios**:

1. **Given** a repository with verified recent commit history, **When** the user opens the Activity tab, **Then** a Development Cadence section displays commit regularity, active weeks ratio, longest gap, weekend-to-weekday ratio, recent velocity trend, and a visual representation of commit rhythm across the cadence window.
2. **Given** a repository whose commit activity is concentrated in a small number of weeks, **When** the user opens the Activity tab, **Then** the cadence section's visual representation makes the burst pattern obvious rather than presenting the repository as merely "active."
3. **Given** a repository with insufficient verified commit history for one or more cadence metrics, **When** the user opens the Activity tab, **Then** each unavailable field is shown as unavailable rather than hidden or replaced with zero.

---

### User Story 2 — Consistency score and unusual gaps are called out clearly (Priority: P1)

A user wants RepoPulse to summarize whether the repository's recent development rhythm is consistent. Instead of making them interpret raw weekly counts themselves, RepoPulse turns cadence inputs into a regularity readout and highlights unusually long maintenance gaps.

**Why this priority**: The issue explicitly asks for a regularity score and for longest gaps to be highlighted when abnormal. Those are the decision-support pieces, not just extra stats.

**Independent Test**: Compare a steady repository and a bursty repository and confirm that the steady one receives a stronger cadence readout while the bursty one is flagged for irregularity or long gaps.

**Acceptance Scenarios**:

1. **Given** a repository whose weekly commit counts are relatively even across the analysis window, **When** cadence is computed, **Then** its regularity readout indicates high consistency.
2. **Given** a repository with several inactive stretches and one or two heavy commit bursts, **When** cadence is computed, **Then** its regularity readout indicates low consistency.
3. **Given** a repository whose longest inactive period is unusually long relative to peers, **When** the Activity tab renders, **Then** that gap is visually highlighted as an outlier maintenance pause.

---

### User Story 3 — Percentile context shows how cadence compares to peers (Priority: P2)

A maintainer wants to know not just the raw cadence values, but whether those values are strong or weak compared with similar repositories. RepoPulse provides percentile context for cadence metrics so users can benchmark steadiness, not only volume.

**Why this priority**: The issue calls for percentile ranking on active weeks ratio and for calibration data to include cadence metrics. Without peer context, the raw numbers are harder to interpret.

**Independent Test**: Analyze repositories with different activity rhythms and confirm that active weeks ratio and the cadence readout show percentile context that ranks steadier repositories above more sporadic ones.

**Acceptance Scenarios**:

1. **Given** two repositories with similar commit volume but different week-to-week consistency, **When** the user compares their Activity tabs, **Then** the steadier repository receives a stronger cadence percentile outcome.
2. **Given** a repository with commits in most weeks of the analysis window, **When** the cadence section renders, **Then** active weeks ratio is shown with both the raw ratio and its percentile ranking.
3. **Given** calibration data does not support a cadence percentile for a metric, **When** the cadence section renders, **Then** the raw metric is still shown and the percentile label is omitted or marked unavailable rather than fabricated.

---

### User Story 4 — Trend module compares momentum across time scales (Priority: P3)

A user wants to know whether the repository is speeding up or losing momentum without mentally stitching together separate cards. RepoPulse presents one unified trend module that defaults to month-over-month momentum and lets the user switch to week-over-week or day-over-day comparisons when they want a shorter-term view.

**Why this priority**: Trend direction is useful context, but the feature still delivers value without it as long as visibility, consistency scoring, and percentile context are present.

**Independent Test**: Analyze repositories with changing recent commit activity, open the Activity tab, and confirm the unified trend module defaults to month-over-month comparison, updates when the user switches comparison mode, and keeps the summary and compared-period values in sync.

**Acceptance Scenarios**:

1. **Given** a repository with verified recent commit history, **When** the user opens the Development Cadence panel, **Then** the trend module defaults to a month-over-month comparison and shows both the trend summary and the two compared month windows together.
2. **Given** a repository whose most recent comparison period is more active than the immediately preceding period, **When** the selected trend mode is evaluated, **Then** the trend is labeled as accelerating and shown with a visual upward trend cue.
3. **Given** a repository whose most recent comparison period is less active than the immediately preceding period, **When** the selected trend mode is evaluated, **Then** the trend is labeled as decelerating and shown with a visual downward trend cue.
4. **Given** a user who wants a shorter-term view of momentum, **When** they switch the trend mode from month-over-month to week-over-week or day-over-day, **Then** the trend summary and compared-period values update together to reflect the newly selected mode.
5. **Given** a repository that lacks enough verified commit history for one of the shorter-term trend modes, **When** the user selects that mode, **Then** that mode shows unavailable rather than reusing another mode's value.

### Edge Cases

- **Very sparse history**: A repository with fewer than two verified commits in the cadence window cannot produce gap or regularity metrics; those fields render as unavailable and the cadence readout falls back to insufficient verified public data if necessary.
- **Perfectly steady but low-volume work**: A repository with one commit every week should read as highly regular even if the absolute commit volume is modest.
- **High-volume burst repo**: A repository with many commits in only a handful of weeks should read as irregular despite high total commit counts.
- **Weekend-heavy automation or volunteer projects**: Weekend-to-weekday ratio is shown as descriptive context and highlighted in the panel, but it must not be framed as inherently positive or negative by itself.
- **No commits in one comparison period**: Velocity trend still renders if one of the periods is zero and the other is non-zero; it becomes unavailable only when the selected comparison mode lacks enough verified data to determine direction.
- **Long dormant repositories**: Longest gap can dominate the cadence story; the UI should still show the other cadence metrics instead of collapsing them into a single warning.
- **Short-term mode noise**: Day-over-day comparisons can change sharply between adjacent days; the UI should still keep month-over-month as the default view so short-term noise does not replace the broader signal.

## Requirements *(mandatory)*

### Functional Requirements

#### Cadence signal derivation

- **FR-001**: The system MUST derive a weekly commit-count series from verified public GitHub commit history over a shared cadence analysis window.
- **FR-002**: The system MUST compute **commit regularity** from the dispersion of weekly commit counts so that steadier week-to-week commit patterns receive a stronger regularity outcome than burstier patterns with the same total volume.
- **FR-003**: The system MUST compute **active weeks ratio** as the share of weeks in the analysis window that contain at least one verified commit.
- **FR-004**: The system MUST compute **longest gap** as the largest number of calendar days between consecutive verified commits within the cadence analysis window.
- **FR-005**: The system MUST compute **weekend-to-weekday ratio** from verified commit timestamps, distinguishing commits made on weekends from those made on weekdays.
- **FR-006**: The system MUST compute **recent velocity trend** in month-over-month mode by comparing the verified recent 30-day commit rate with the immediately preceding 30-day commit rate.
- **FR-006a**: The system MUST compute **recent velocity trend** in week-over-week mode by comparing the verified recent 7-day commit rate with the immediately preceding 7-day commit rate.
- **FR-006b**: The system MUST compute **recent velocity trend** in day-over-day mode by comparing the most recent complete day with the immediately preceding complete day from verified commit history.

#### Activity-tab presentation

- **FR-007**: The Activity tab MUST display a dedicated Development Cadence section for every successfully analyzed repository.
- **FR-008**: The Development Cadence section MUST show the raw values for commit regularity, active weeks ratio, longest gap, weekend-to-weekday ratio, and recent velocity trend whenever those values are verifiable.
- **FR-008a**: The Development Cadence section MUST include a visual representation of recent commit rhythm across the cadence analysis window so users can distinguish steady development from bursty development at a glance.
- **FR-008b**: The recent velocity trend MUST be presented as one unified module that combines the trend summary with the two compared period totals so users do not have to interpret separate areas of the panel.
- **FR-008c**: The unified trend module MUST default to month-over-month comparison when the Development Cadence section first renders.
- **FR-008d**: The unified trend module MUST allow the user to switch between month-over-month, week-over-week, and day-over-day comparison modes within the Development Cadence section.
- **FR-008e**: When the user changes the comparison mode, the trend direction, trend delta, comparison labels, and compared-period totals MUST all update together to reflect the selected mode.
- **FR-009**: The Development Cadence section MUST surface a cadence regularity readout that communicates whether development is consistent or bursty using a clear ordered scale.
- **FR-010**: The longest gap metric MUST be visually highlighted when it exceeds the configured threshold for an unusual maintenance pause or when peer calibration places it in an outlier range.
- **FR-011**: Weekend-to-weekday ratio MUST be highlighted in the Development Cadence section as part of the repository's work-pattern summary, but the system MUST NOT label weekend-heavy development as inherently better or worse on its own.

#### Peer comparison and percentile context

- **FR-012**: Active weeks ratio MUST be shown with percentile context when sufficient calibration data exists for peer comparison.
- **FR-013**: The cadence regularity readout MUST use calibration-backed peer comparison so that repositories with steadier development rank above repositories with more sporadic development in the same peer set.
- **FR-014**: Calibration data for development cadence MUST include, at minimum, the metrics needed to percentile-rank active weeks ratio and cadence regularity.
- **FR-015**: When calibration data is unavailable for a cadence metric, the system MUST continue to display the verified raw metric and mark the percentile context unavailable rather than inventing a percentile.

#### Missing-data behavior and boundaries

- **FR-016**: Every cadence metric displayed or exported by this feature MUST originate from verified public GitHub data or a direct formula over that data, consistent with the constitution's accuracy policy.
- **FR-017**: When verified data is insufficient to compute a cadence metric, that metric MUST render as `"unavailable"` and MUST NOT be substituted with another activity signal.
- **FR-017a**: If one trend comparison mode is unavailable while another is verifiable, the unavailable mode MUST remain unavailable and the verifiable mode MUST remain selectable.
- **FR-018**: When the cadence regularity readout cannot be computed because the required verified inputs are missing, the system MUST display `"Insufficient verified public data"` rather than a score or label.
- **FR-019**: Development Cadence MUST extend the existing Activity experience; it MUST NOT require a new top-level navigation tab.

### Key Entities *(include if feature involves data)*

- **Cadence analysis window**: The fixed recent time range over which weekly commit counts, active weeks ratio, longest gap, weekend-to-weekday ratio, and recent velocity trend are derived.
- **Weekly commit series**: The ordered count of verified commits per week inside the cadence analysis window; used to measure regularity and active weeks ratio.
- **Development cadence metrics**: The five verified cadence outputs for a repository: commit regularity, active weeks ratio, longest gap, weekend-to-weekday ratio, and recent velocity trend.
- **Cadence regularity readout**: A percentile-backed interpretation of development consistency derived from the cadence metrics and shown in the Activity tab.
- **Trend comparison mode**: The user-selectable momentum lens for the unified trend module: month-over-month, week-over-week, or day-over-day.
- **Trend comparison summary**: The combined trend direction, delta, and paired period totals for the currently selected trend comparison mode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every successful repository analysis shows a Development Cadence section in the Activity tab.
- **SC-001a**: The Development Cadence section includes an at-a-glance visual that allows a reviewer to distinguish a steady weekly commit pattern from a bursty one without reading only the numeric metrics.
- **SC-002**: A repository with steadier week-to-week commit activity ranks higher on cadence regularity than a repository with the same total commits concentrated into bursts.
- **SC-003**: Active weeks ratio is shown with both a raw ratio and percentile context whenever the calibration dataset supports peer comparison.
- **SC-004**: Repositories whose longest inactive gap falls into an outlier range are visibly flagged in the Activity tab.
- **SC-005**: Repositories with insufficient verified commit history show cadence fields as unavailable and never display fabricated percentile or score outputs.
- **SC-006**: The Development Cadence panel defaults to a month-over-month trend view and shows the trend summary and compared-period totals together in a single module for every repository with sufficient verified recent history.
- **SC-007**: Users can switch between month-over-month, week-over-week, and day-over-day trend modes without leaving the Development Cadence panel, and each mode updates the visible trend interpretation on the same analysis result.
- **SC-008**: Recent velocity trend correctly distinguishes accelerating and decelerating repositories when consecutive periods in the selected comparison mode have materially different verified commit rates.

## Assumptions

- **Cadence lives inside Activity**: This feature deepens the Activity tab rather than introducing a separate navigation destination.
- **Fixed analysis window**: A single recent window is used for cadence calculations so weekly consistency metrics are comparable across repositories.
- **Percentile coverage is selective**: Active weeks ratio and the overall cadence regularity readout are the required percentile-backed outputs; other cadence metrics may remain raw-value-first unless calibration is added.
- **Weekend ratio is highlighted but informational**: It should be visible in the Cadence panel because it helps characterize project rhythm, but it does not independently define project quality and should not trigger a recommendation by itself.
- **Month-over-month remains the default**: The panel should open on the broader month-over-month comparison even when shorter-term views are available.
- **Shorter trend modes reuse the same analysis result**: Switching between month-over-month, week-over-week, and day-over-day compares different verified recent periods from the same analyzed repository rather than requiring a fresh analysis run.
- **No custom comparison builder**: Users can switch only among the three predefined trend modes in this feature revision.
