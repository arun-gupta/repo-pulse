# Tasks: Development Cadence

**Input**: Design documents from `/specs/73-development-cadence/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD is required for this repo and the feature spec includes independent test criteria for each story.  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align existing feature artifacts and fixtures with the revised trend contract

- [x] T001 Update cadence fixture shapes in `lib/analyzer/analysis-result.ts` to replace single trend fields with per-mode trend comparisons
- [x] T002 [P] Refresh cadence design docs references in `specs/73-development-cadence/quickstart.md` and `specs/73-development-cadence/contracts/development-cadence.md` if implementation details diverge during coding

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain changes that block all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Write red multi-mode cadence derivation tests in `lib/activity/cadence.test.ts`
- [x] T004 Implement shared month/week/day trend comparison derivation in `lib/activity/cadence.ts`
- [x] T005 [P] Write red view-model tests for default month mode, mode labels, and unavailable handling in `lib/activity/view-model.test.ts`
- [x] T006 Update `lib/activity/view-model.ts` to expose the nested unified trend view model and revised weekend display formatting

**Checkpoint**: Cadence domain and view-model support the revised trend contract

---

## Phase 3: User Story 1 - Cadence metrics visible in the Activity tab (Priority: P1) 🎯 MVP

**Goal**: Show a clearer Development Cadence panel with one unified trend module and a more intuitive weekend metric

**Independent Test**: Open the Activity tab for a repo with cadence data and confirm the cadence panel shows the weekly rhythm chart, the `Weekend Flow` value as weekend share, and a single trend module that defaults to month-over-month with matching summary and counts.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Add component coverage for the unified month-over-month trend module and weekend-share display in `components/activity/DevelopmentCadenceCard.test.tsx`
- [x] T008 [P] [US1] Extend Activity tab integration coverage for the revised cadence card copy in `components/activity/ActivityView.test.tsx`
- [x] T009 [P] [US1] Extend Activity flow assertions for the default month-over-month trend module in `e2e/activity.spec.ts`

### Implementation for User Story 1

- [x] T010 [US1] Update weekend-flow value formatting and trend labels in `lib/activity/view-model.ts`
- [x] T011 [US1] Replace the split trend tile and comparison block with a unified default month-over-month module in `components/activity/DevelopmentCadenceCard.tsx`
- [x] T012 [US1] Adjust trend helper copy, tooltip text, and visible labels in `components/activity/DevelopmentCadenceCard.tsx`

**Checkpoint**: User Story 1 is fully functional and testable independently with month-over-month as the default view

---

## Phase 4: User Story 2 - Consistency score and unusual gaps are called out clearly (Priority: P1)

**Goal**: Preserve the existing cadence rhythm, regularity, and long-gap signals while landing the trend redesign safely

**Independent Test**: Compare steady and bursty cadence fixtures and confirm the regularity label, longest-gap highlighting, and weekly rhythm chart still render correctly alongside the new trend module.

### Tests for User Story 2 ⚠️

- [x] T013 [P] [US2] Expand cadence chart and long-gap regression coverage in `components/activity/DevelopmentCadenceCard.test.tsx`
- [x] T014 [P] [US2] Add cadence-domain regression cases for unchanged regularity and long-gap behavior in `lib/activity/cadence.test.ts`

### Implementation for User Story 2

- [x] T015 [US2] Reconcile `components/activity/development-cadence-chart.tsx` with the revised cadence card so zoom, count toggles, and timeline copy still behave correctly
- [x] T016 [US2] Preserve long-gap highlighting and regularity presentation in `components/activity/DevelopmentCadenceCard.tsx` after the trend refactor

**Checkpoint**: User Story 2 remains independently testable and the redesigned panel does not regress regularity or gap behavior

---

## Phase 5: User Story 3 - Percentile context shows how cadence compares to peers (Priority: P2)

**Goal**: Keep active-weeks percentile and cadence regularity percentile intact while the trend data shape changes

**Independent Test**: Render cadence data with calibration-backed values and confirm active-weeks and regularity percentile labels still appear correctly with the redesigned trend module.

### Tests for User Story 3 ⚠️

- [x] T017 [P] [US3] Add view-model assertions that percentile context survives the trend-shape revision in `lib/activity/view-model.test.ts`
- [x] T018 [P] [US3] Add component assertions that percentile labels still render with the redesigned module in `components/activity/DevelopmentCadenceCard.test.tsx`

### Implementation for User Story 3

- [x] T019 [US3] Thread percentile-backed cadence values through the revised `DevelopmentCadenceCardViewModel` in `lib/activity/view-model.ts`
- [x] T020 [US3] Keep percentile presentation stable in `components/activity/DevelopmentCadenceCard.tsx`

**Checkpoint**: User Story 3 remains independently testable and peer-comparison context is unchanged

---

## Phase 6: User Story 4 - Trend module compares momentum across time scales (Priority: P3)

**Goal**: Let users switch the unified trend module between month-over-month, week-over-week, and day-over-day views without rerunning analysis

**Independent Test**: Open a cadence card with multi-mode trend data, verify month is selected by default, switch to week and day modes, and confirm the direction, delta, labels, and period totals all update together while unavailable modes remain honest.

### Tests for User Story 4 ⚠️

- [x] T021 [P] [US4] Add component interaction tests for switching month/week/day trend modes in `components/activity/DevelopmentCadenceCard.test.tsx`
- [x] T022 [P] [US4] Add cadence-domain tests for complete-day handling and per-mode unavailable states in `lib/activity/cadence.test.ts`
- [x] T023 [P] [US4] Extend Activity E2E coverage for local trend-mode switching in `e2e/activity.spec.ts`

### Implementation for User Story 4

- [x] T024 [US4] Add local trend-mode state and selector UI to `components/activity/DevelopmentCadenceCard.tsx`
- [x] T025 [US4] Implement mode-specific labels, helper text, and inaccessible-state rendering in `components/activity/DevelopmentCadenceCard.tsx`
- [x] T026 [US4] Ensure `lib/activity/view-model.ts` emits month/week/day comparison labels and values from `trendComparisons`

**Checkpoint**: All approved trend modes are independently functional inside the cadence panel

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup across stories

- [x] T027 [P] Run focused cadence unit/component checks for `lib/activity/cadence.test.ts`, `lib/activity/view-model.test.ts`, `components/activity/DevelopmentCadenceCard.test.tsx`, and `components/activity/ActivityView.test.tsx`
- [x] T028 [P] Run `npm run lint` and targeted `e2e/activity.spec.ts` validation for the revised cadence panel
- [x] T029 Update `docs/DEVELOPMENT.md` when P2-F10 is complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational and delivers the MVP cadence-panel redesign
- **US2 (P1)**: Depends on US1’s card refactor because it preserves chart and long-gap behavior around that redesign
- **US3 (P2)**: Depends on Foundational and can land after US1; it only preserves percentile behavior in the revised view model
- **US4 (P3)**: Depends on US1 because it extends the unified trend module with additional modes

### Within Each User Story

- Tests MUST be written and fail before implementation
- Domain changes before component wiring
- Component wiring before Activity integration and E2E assertions

### Parallel Opportunities

- `T003` and `T005` can proceed in parallel across cadence domain and view-model tests
- `T007`, `T008`, and `T009` can be written in parallel once Foundational work is stable
- `T017` and `T018` can run in parallel for percentile preservation
- `T021`, `T022`, and `T023` can run in parallel for multi-mode trend coverage

---

## Parallel Example: User Story 4

```bash
# Launch multi-mode trend tests together:
Task: "Add component interaction tests for switching month/week/day trend modes in components/activity/DevelopmentCadenceCard.test.tsx"
Task: "Add cadence-domain tests for complete-day handling and per-mode unavailable states in lib/activity/cadence.test.ts"
Task: "Extend Activity E2E coverage for local trend-mode switching in e2e/activity.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE** the unified default month-over-month module

### Incremental Delivery

1. Finish domain/view-model groundwork
2. Ship the clearer default month-over-month module
3. Preserve regularity, gap, and percentile behaviors
4. Add week-over-week and day-over-day switching
5. Finish lint, focused tests, and docs

### Parallel Team Strategy

With multiple developers:

1. One developer handles domain/view-model (`lib/activity/`)
2. One developer handles cadence card UI/tests (`components/activity/`)
3. One developer handles Activity E2E coverage (`e2e/activity.spec.ts`)

---

## Notes

- [P] tasks = different files, no dependencies
- Each user story remains independently testable
- Keep all trend math grounded in verified commit timestamps
- Do not add custom date-range controls or extra trend surfaces
