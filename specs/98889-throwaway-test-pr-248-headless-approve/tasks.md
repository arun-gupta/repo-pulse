# Tasks: Throwaway Test PR #248 Headless Approve

**Input**: Design documents from `/specs/98889-throwaway-test-pr-248-headless-approve/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Not requested — this is a process validation feature, not application code.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No project setup needed — repo already exists and is configured.

(No tasks — this is a throwaway feature in an existing repo.)

---

## Phase 2: Foundational

**Purpose**: No foundational work needed — the headless workflow infrastructure already exists in `scripts/claude-worktree.sh`.

(No tasks — all infrastructure is already in place from PR #238.)

---

## Phase 3: User Story 1 - Verify headless spawn completes Stage 1 (Priority: P1) MVP

**Goal**: Prove that a headless spawn runs `/speckit.specify`, generates a spec, and pauses.

**Independent Test**: Check that `specs/*/spec.md` exists in the worktree and `claude.log` shows the pause message.

### Implementation for User Story 1

- [x] T001 [US1] Create placeholder file at specs/98889-throwaway-test-pr-248-headless-approve/placeholder.md proving the SpecKit lifecycle reached the implement step

**Checkpoint**: The spec file already exists (created during `/speckit.specify`). The placeholder file proves the implement step ran.

---

## Phase 4: User Story 2 - Release paused session with approve-spec (Priority: P1)

**Goal**: Prove that `--approve-spec` resumes the session and the lifecycle completes through to PR.

**Independent Test**: After `--approve-spec`, verify the session opens a PR with a test plan section.

### Implementation for User Story 2

- [ ] T002 [US2] Push branch and open PR on GitHub with a test plan section in the body, referencing issue #250

**Checkpoint**: PR exists on GitHub, branch is pushed, test plan section present.

---

## Phase 5: User Story 3 - Send revision feedback with revise-spec (Priority: P2)

**Goal**: Prove that `--revise-spec` applies feedback and re-pauses.

**Independent Test**: Not exercised in this run — this story validates via a separate `--revise-spec` invocation.

### Implementation for User Story 3

(No implementation tasks — this story is validated by running `--revise-spec` from a separate terminal, which is outside the scope of this session's lifecycle.)

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T003 Verify all spec artifacts are committed (spec.md, plan.md, research.md, data-model.md, quickstart.md, tasks.md, checklists/requirements.md, placeholder.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 3 (US1)**: No dependencies — can start immediately
- **Phase 4 (US2)**: Depends on Phase 3 (need artifacts to push)
- **Phase 5 (US3)**: No in-session tasks — validated externally
- **Phase 6 (Polish)**: Depends on Phase 4

### User Story Dependencies

- **User Story 1 (P1)**: Independent — create placeholder file
- **User Story 2 (P1)**: Depends on US1 — needs artifacts to push and PR to open
- **User Story 3 (P2)**: External validation — no in-session dependency

### Parallel Opportunities

- T001 and T002 are sequential (T002 depends on T001 being committed)
- No parallel opportunities in this minimal task set

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Create placeholder.md (T001)
2. **STOP and VALIDATE**: Confirm spec artifacts exist

### Incremental Delivery

1. T001 → placeholder proves implement ran
2. T002 → PR proves full lifecycle completed
3. T003 → all artifacts committed cleanly

---

## Notes

- This is a throwaway test — all artifacts validate the headless workflow, not production functionality.
- Total tasks: 3
- Tasks per user story: US1=1, US2=1, Polish=1
- US3 has no in-session tasks (validated externally via `--revise-spec`)
