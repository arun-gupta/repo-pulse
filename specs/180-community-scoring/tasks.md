---

description: "Task list for Community scoring (P2-F05, issue #70)"
---

# Tasks: Community Scoring

**Input**: Design documents from `/specs/180-community-scoring/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/community-scoring.md`, `quickstart.md`

**Tests**: Tests are **required** per Constitution §XI (TDD NON-NEGOTIABLE). Every task that adds logic has a corresponding test task that must be written first and fail before implementation.

**Organization**: Tasks are grouped by user story. Each story is independently testable and corresponds to a story from `spec.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to user stories from spec.md (US1, US2, US3, US4). Setup/Foundational/Polish phases have no story label.
- Paths are repo-root-relative.

## Path Conventions

Single Next.js app at repo root. Sources under `lib/`, `components/`, `app/`. Tests co-located with sources (`*.test.ts`, `*.test.tsx`) or under `lib/*/__tests__/` / `e2e/`.

---

## Phase 1: Setup

**Purpose**: Confirm branch and prerequisites.

- [ ] T001 Confirm on branch `180-community-scoring` with spec + plan + research + data-model + contracts committed (already done prior to this task list)
- [ ] T002 Create empty `specs/180-community-scoring/checklists/manual-testing.md` as a placeholder so the DoD check (Constitution §XII.6) has a file to sign off later

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Detection infrastructure and tag registry. Every user story depends on this.

**⚠️ CRITICAL**: No user story work can begin until Phase 2 is complete.

### Type + fixture groundwork

- [ ] T003 Extend `AnalysisResult` in `lib/analyzer/analysis-result.ts` with `hasIssueTemplates`, `hasPullRequestTemplate`, `hasFundingConfig`, `hasDiscussionsEnabled`, `discussionsCountWindow`, `discussionsWindowDays` per data-model.md §1
- [ ] T004 [P] Add the six new fields (all set to `'unavailable'`) to every existing `AnalysisResult` test fixture in `lib/**/*.test.ts` and `components/**/*.test.tsx` — this unblocks compilation after T003

### Analyzer detection (TDD — tests first, fail, then implement)

- [ ] T005 [P] Write unit test for issue-template detection in `lib/analyzer/github-graphql.test.ts` (covers `.github/ISSUE_TEMPLATE/` directory with one file, directory with yml-only file, legacy `ISSUE_TEMPLATE.md`, absent, API failure → `'unavailable'`)
- [ ] T006 [P] Write unit test for PR-template detection in `lib/analyzer/github-graphql.test.ts` (root, `.github/`, `docs/` locations; absent; API failure → `'unavailable'`)
- [ ] T007 [P] Write unit test for `.github/FUNDING.yml` detection in `lib/analyzer/github-graphql.test.ts`
- [ ] T008 [P] Write unit test for `hasDiscussionsEnabled` via GraphQL `repository.hasDiscussionsEnabled` in `lib/analyzer/github-graphql.test.ts`
- [ ] T009 [P] Write unit test for `discussionsCountWindow` in `lib/analyzer/github-graphql.test.ts` asserting: fetched only when enabled === true, gated by `windowDays`, zero result when empty, `'unavailable'` on API failure (FR-008, SC-003)
- [ ] T010 Extend the GraphQL query in `lib/analyzer/github-graphql.ts` to fetch all five signals in a single pass (respecting Constitution §III: 1–3 requests per repo); make T005–T009 pass

### Tag registry (TDD)

- [ ] T011 [P] Write unit test for `lib/tags/community.ts` in `lib/tags/community.test.ts` asserting: three domain sets disjoint, `isCommunityItem(k, d)` correct per data-model.md §3
- [ ] T012 Implement `lib/tags/community.ts` mirroring `lib/tags/governance.ts` pattern (new file); make T011 pass

### Export type skeleton

- [ ] T013 [P] Extend `JsonExportResult.results[i]` type shape in `lib/export/json-export.ts` with the `community` field from contracts/community-scoring.md §5; leave values as `'unknown'` stubs for now (filled in Polish phase)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 - Community signals visible via lens (Priority: P1) 🎯 MVP

**Goal**: A `community` tag pill renders on every community-relevant row across Documentation, Contributors, and Activity tabs. The lens is interpretable; the score composition does not yet change (that's US2).

**Independent Test**: Analyze `facebook/react`, open Documentation / Contributors / Activity tabs, confirm community pills appear on CoC, issue templates, PR template, CODEOWNERS, FUNDING.yml, and the Discussions card. Composite OSS Health Score is unchanged from before the feature.

### Tests for User Story 1 (write first, confirm red)

- [ ] T014 [P] [US1] Component test for community pill on CoC, issue templates, PR template, GOVERNANCE.md rows in `components/documentation/DocumentationView.test.tsx`
- [ ] T015 [P] [US1] Component test for community pill on CODEOWNERS and FUNDING.yml rows in `components/contributors/ContributorsScorePane.test.tsx`
- [ ] T016 [P] [US1] Component test for Discussions card (enabled-with-count / enabled-empty / not-enabled / hidden-when-unavailable) with community pill in `components/activity/ActivityView.test.tsx`
- [ ] T017 [P] [US1] Component test for dual-pill rendering (governance + community) on CODEOWNERS row in `components/contributors/ContributorsScorePane.test.tsx` per data-model.md tag co-occurrence note

### Implementation for User Story 1

- [ ] T018 [US1] Add community tone/color to `TagPill` tag-color map in `components/tags/TagPill.tsx` (distinct from emerald governance pill per data-model.md §3)
- [ ] T019 [P] [US1] Render community pill on Documentation rows in `components/documentation/DocumentationView.tsx` using `isCommunityItem(key, 'doc_file')`
- [ ] T020 [P] [US1] Render community pill on Contributors rows (CODEOWNERS, Funding disclosure metric) in `components/contributors/ContributorsScorePane.tsx` using `isCommunityItem(key, 'contributors_metric')`
- [ ] T021 [US1] Create the Discussions card component in `components/activity/DiscussionsCard.tsx` with three visual states (enabled+count, enabled+empty, not enabled) + community pill
- [ ] T022 [US1] Integrate the Discussions card into `components/activity/ActivityView.tsx` (hidden when `hasDiscussionsEnabled === 'unavailable'` per contracts/community-scoring.md §6); surface `'unavailable'` state in the missing-data panel

**Checkpoint**: US1 is shippable as an MVP. Users see the lens, understand which items feed Community, and can verify composite weights haven't moved.

---

## Phase 4: User Story 2 - Net-new signals scored in host buckets (Priority: P1)

**Goal**: Issue templates and PR template contribute to Documentation; FUNDING.yml contributes to Contributors as a bonus; Discussions enabled + activity contribute to Activity. Each host-bucket percentile shifts monotonically when the signal is added. Composite weights (Activity 25%, Responsiveness 25%, Contributors 23%, Documentation 12%, Security 15%) are unchanged.

**Independent Test**: Construct a test fixture repo with and without each new signal; assert the host-bucket percentile increases (or stays flat) when the signal is added; assert the composite OSS Health Score output object has unchanged `WEIGHTS` constants.

### Tests for User Story 2 (write first, confirm red)

- [ ] T023 [P] [US2] Unit test for Documentation score with issue templates present / absent / unavailable in `lib/documentation/score-config.test.ts`; verify file weights sum to 1.0
- [ ] T024 [P] [US2] Unit test for Documentation score with PR template present / absent / unavailable in `lib/documentation/score-config.test.ts`
- [ ] T025 [P] [US2] Unit test for Contributors score with FUNDING.yml as bonus (never penalizes when absent — FR-008) in `lib/contributors/score-config.test.ts`
- [ ] T026 [P] [US2] Unit test for Activity score 3-state Discussions behavior (disabled → percentile 0 / enabled+empty → small positive / enabled+count → higher) and fourth state (unavailable → factor excluded) in `lib/activity/score-config.test.ts`
- [ ] T027 [P] [US2] Regression test in `lib/scoring/health-score.test.ts` asserting `WEIGHTS` constants exactly equal `{ activity: 0.25, responsiveness: 0.25, contributors: 0.23, documentation: 0.12, security: 0.15 }` (SC-002)

### Implementation for User Story 2

- [ ] T028 [P] [US2] Extend `FILE_WEIGHTS` and file-presence composite logic in `lib/documentation/score-config.ts` to include `issue_templates` (5%) and `pull_request_template` (5%); renormalize file weights to sum to 1.0 per research.md Q1
- [ ] T029 [P] [US2] Extend `getContributorsScore` in `lib/contributors/score-config.ts` with `fundingPresent` bonus factor per data-model.md §2; ensure absence never lowers the percentile
- [ ] T030 [P] [US2] Extend `ACTIVITY_FACTORS` and `getActivityScore` in `lib/activity/score-config.ts` with `discussions` factor at 8% weight; redistribute existing five factors proportionally to maintain 100% sum
- [ ] T031 [US2] Update existing Activity / Documentation / Contributors snapshot tests where pre-feature percentile values change (document each intentional shift in the test diff)

**Checkpoint**: US1 + US2 together deliver the scoring story. Scorecard tiles still show Activity/Contributors/Documentation/Responsiveness/Security; no new tile yet.

---

## Phase 5: User Story 3 - Community completeness readout (Priority: P2)

**Goal**: A new **Community** tile appears in the scorecard score row showing a percentile and `N of M signals` detail. It is a derived summary, **not** a composite-weighted bucket.

**Independent Test**: Analyze a signal-rich repo; Community tile shows top quartile. Analyze a signal-poor repo; tile shows bottom quartile. Composite OSS Health Score value is the same it would be without the Community tile (SC-002).

### Tests for User Story 3 (write first, confirm red)

- [ ] T032 [P] [US3] Unit test for `computeCommunityCompleteness` in `lib/community/completeness.test.ts` covering: all 7 present, all 7 missing, all 7 unknown, mixed (e.g., 3 present / 2 missing / 2 unknown → `ratio = 3/5`), boundary cases
- [ ] T033 [P] [US3] Unit test asserting the invariants from contracts/community-scoring.md §2 (present + missing + unknown = 7; ratio in [0,1]; null ratio when denominator zero)
- [ ] T034 [P] [US3] Component test for the Community tile in `components/metric-cards/MetricCard.test.tsx` — renders percentile label, `N of M signals` detail, min-height consistent with other score tiles, tooltip present

### Implementation for User Story 3

- [ ] T035 [P] [US3] Implement `computeCommunityCompleteness` in `lib/community/completeness.ts` (new file) matching the contract in contracts/community-scoring.md §2
- [ ] T036 [US3] Extend `ScoreBadgeDefinition` and `getScoreBadges` in `lib/metric-cards/score-config.ts` with a `Community` badge populated from `computeCommunityCompleteness`
- [ ] T037 [US3] Add the Community tile to the score row in `components/metric-cards/MetricCard.tsx` (maintain the 4-column grid; completeness becomes a 5th tile so the grid becomes 5 columns — or keep 4-column with Community as a narrower companion tile, to be decided at implementation time within the `sm:grid-cols-*` convention already in use)
- [ ] T038 [US3] Update methodology text in `components/baseline/BaselineView.tsx` to describe Community as a lens with its seven signals and host-bucket mapping per FR-017

**Checkpoint**: Full scorecard presentation of Community completeness. US1 + US2 + US3 deliver visibility, scoring, and a summary metric.

---

## Phase 6: User Story 4 - Actionable recommendations for missing community signals (Priority: P3)

**Goal**: Missing community signals generate recommendations surfaced in the existing per-bucket recommendations UI, with stable reference IDs and the `community` tag.

**Independent Test**: Analyze a repo missing issue templates, PR template, FUNDING, and Discussions. Open Recommendations tab. Confirm four new recommendations appear, each with a `community` tag filter option, each tagged under its host bucket.

### Tests for User Story 4 (write first, confirm red)

- [ ] T039 [P] [US4] Update recommendation-count assertions in `lib/recommendations/__tests__/catalog.test.ts` to expect two new Documentation entries, one Contributors entry, one Activity entry; update tag-count assertions for `community` (new tag: 4), `contrib-ex` (+3), `governance` (+1)
- [ ] T040 [P] [US4] Update `lib/recommendations/__tests__/reference-id.test.ts` with tests for the four new catalog keys (`file:issue_templates`, `file:pull_request_template`, `file:funding`, `feature:discussions_enabled`)
- [ ] T041 [P] [US4] Test in `lib/scoring/health-score.test.ts` that the four new recommendations are emitted when the corresponding signals are missing, each carrying its host-bucket label and stable reference ID

### Implementation for User Story 4

- [ ] T042 [US4] Add four new entries to `lib/recommendations/catalog.ts` per contracts/community-scoring.md §7 with the `community` tag applied; assign next available IDs in DOC, CTR, ACT buckets
- [ ] T043 [US4] Emit the four new recommendations from the appropriate host-bucket recommendation paths in `lib/scoring/health-score.ts` (templates + FUNDING from Documentation/Contributors bucket paths, Discussions from Activity path)
- [ ] T044 [US4] Verify the Recommendations tab already filters by the `community` tag (it should — tag filtering is existing infra); add to the recommendations UI test in `components/recommendations/RecommendationsView.test.tsx`

**Checkpoint**: All four user stories complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Exports, documentation, E2E coverage, and DoD artifacts.

### Exports

- [ ] T045 [P] Populate the `community` object in `lib/export/json-export.ts` per data-model.md §4 (signals, completeness, discussions)
- [ ] T046 [P] Add assertions in `lib/export/json-export.test.ts` for the full community shape (7 signal keys, discussion window null-when-disabled invariants)
- [ ] T047 [P] Add a new `### Community` section in `lib/export/markdown-export.ts` between the existing `### Contributors` and `### Activity` sections per data-model.md §4
- [ ] T048 [P] Add test in `lib/export/markdown-export.test.ts` asserting section ordering, header line format, and 7-row signal table

### End-to-end coverage

- [ ] T049 Create `e2e/community-scoring.spec.ts` covering: analyze a signal-rich repo → Community tile top quartile + community pills across tabs + Discussions card enabled; analyze a signal-poor repo → tile bottom quartile + relevant recommendations surfaced
- [ ] T050 Update `e2e/metric-cards.spec.ts` to include `await expect(overview).toContainText('Community')` in the dimension-label assertion list

### Documentation + DoD

- [ ] T051 [P] Update `docs/PRODUCT.md` Phase 2 table row for `P2-F05 | Community scoring | #70` — change status column to note this ships without a new composite bucket
- [ ] T052 [P] Update `docs/DEVELOPMENT.md` Phase 2 table row for `P2-F05 | Community scoring | #70` — mark ✅ Done
- [ ] T053 Fill `specs/180-community-scoring/checklists/manual-testing.md` using the Phase 5 and Step 1–7 checklist skeleton from `quickstart.md`; sign off each item before opening the PR
- [ ] T054 Run the quickstart walkthrough from `specs/180-community-scoring/quickstart.md` end-to-end against the live dev server; capture any discrepancies as follow-up tasks or fixes

### Final verification

- [ ] T055 Run `npm test` — all tests green (expected ~580+ tests, up from 552)
- [ ] T056 Run `npm run lint` — no new errors introduced
- [ ] T057 Run `npm run build` — production build passes
- [ ] T058 Run `npm run test:e2e` — all existing + new E2E specs pass
- [ ] T059 Constitution compliance walkthrough per `quickstart.md` — tick each §II / §III / §V / §VI / §IX / §XI / §XII gate

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories.
- **User Story 1 (Phase 3, MVP)**: Depends on Foundational. Independent of US2/3/4.
- **User Story 2 (Phase 4)**: Depends on Foundational. Independent of US1/3/4.
- **User Story 3 (Phase 5)**: Depends on Foundational. Prefers US2 to have landed so percentile data exists, but the completeness readout itself only reads the raw detections from Foundational.
- **User Story 4 (Phase 6)**: Depends on Foundational. Prefers US2 so recommendations tie to real scoring gaps, but the catalog entries and emission logic stand alone.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### Within each user story

- Tests MUST be written first and observed red before implementation (Constitution §XI).
- Models / types before consumers.
- Services / scoring logic before UI.

### Parallel opportunities

- T004–T009 (fixture prep + analyzer detection tests) all [P] — different files.
- T011 + T013 (tag registry test + export skeleton) [P] — different files.
- T014–T017 (US1 component tests) all [P] — different test files.
- T019 + T020 (Documentation + Contributors pill implementations) [P] — different files.
- T023–T027 (US2 tests) all [P] — different files.
- T028–T030 (US2 score-config implementations) [P] — different files.
- T032–T034 (US3 tests) [P] — different files.
- T039–T041 (US4 tests) [P] — different files.
- T045–T048 (export pair) [P] — different files, though T045 and T046 share concerns; T047 and T048 also paired.
- T051 + T052 (docs updates) [P] — different files.

### Cross-story integration

US3's scorecard tile (T037) and US2's scoring changes (T028–T030) should be QA'd together before shipping — the composite stability invariant is the load-bearing one.

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests in parallel (after Foundational completes):
Task: "Component test for Documentation community pills in components/documentation/DocumentationView.test.tsx"
Task: "Component test for Contributors community pills in components/contributors/ContributorsScorePane.test.tsx"
Task: "Component test for Activity Discussions card with community pill in components/activity/ActivityView.test.tsx"
Task: "Component test for dual governance+community pill on CODEOWNERS in components/contributors/ContributorsScorePane.test.tsx"
```

Then serialize the implementation tasks that read the tag registry (T018 before T019/T020/T021/T022).

---

## Implementation Strategy

### MVP (US1 only)

1. Phase 1 + Phase 2 (foundation)
2. Phase 3 (lens tagging)
3. **STOP and validate**: Composite OSS Health Score still unchanged; community pills visible across tabs.
4. Deploy / demo.

### Incremental delivery

1. MVP (US1) → Ship. Users see the lens.
2. Add US2 → Ship. Signals now move scores.
3. Add US3 → Ship. Scorecard gets the Community tile.
4. Add US4 → Ship. Recommendations surface missing gaps.
5. Polish → Exports, E2E, DoD artifacts.

### Parallel team strategy (not applicable — single developer)

With one developer, serialize US1 → US2 → US3 → US4. Within each, run [P] tasks concurrently.

---

## Notes

- Task IDs are T001 through T059; 59 tasks total.
- Tests are mandatory per Constitution §XI — each test task is paired with an implementation task that follows it.
- `[P]` tasks can run in parallel (different files, no blocking dependencies).
- Commit after each logical group (typically after each story's checkpoint).
- Verify each test fails before implementing its paired task.
- `specs/180-community-scoring/checklists/manual-testing.md` must be signed off before PR merge.
- PR body must check off every item under "Test plan" (per `CLAUDE.md` PR merge rule).
