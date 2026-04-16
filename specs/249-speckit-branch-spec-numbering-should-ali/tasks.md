# Tasks: SpecKit branch/spec numbering aligned with GitHub issue number

**Input**: Design documents in `/specs/249-speckit-branch-spec-numbering-should-ali/`

## Revision history

- **v1** (commit fc11a49): introduced `gh<N>-` prefix convention. Pushed but not merged.
- **v2** (this revision): reverted the `gh` prefix — stays on upstream SpecKit's `<N>-<slug>` convention for portability. Core fix (reuse-current-branch, `--number` validation, collision handling) preserved.

## Phase 1: Setup

No setup. Modifying existing bash scripts only.

## Phase 2: Foundational (blocking prerequisites)

`common.sh` is called by `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`. It must accept `^[0-9]+-` so any-width issue numbers resolve downstream.

- [X] T001 [P] Update `.specify/scripts/bash/common.sh` `find_feature_dir_by_prefix()` — extract prefix via `^[0-9]{8}-[0-9]{6}` (first) or `^[0-9]+` (fallback). Remove the `gh[0-9]+` branch from v1. Remove the narrower `^[0-9]{3}` in favour of `^[0-9]+`.
- [X] T002 [P] Update `.specify/scripts/bash/common.sh` `check_feature_branch()` — accept `^[0-9]+-` and `^[0-9]{8}-[0-9]{6}-`. Remove `gh[0-9]+-` from v1. Update error message.
- [X] T003 [P] Update `.specify/scripts/bash/common.sh` `get_current_branch()` non-git fallback — match `^[0-9]+-` (strict superset of former `^[0-9]{3}-`). Remove `gh[0-9]+` branch from v1.

## Phase 3: User Story 1 — Worktree-driven spec reuses the pre-created branch (P1) 🎯 MVP

**Story goal**: `/speckit.specify` inside a worktree on branch `<N>-<slug>` reuses it verbatim; `specs/<N>-<slug>/` created; no renumbering.

- [X] T004 [US1] Revert `scripts/claude-worktree.sh` — `BRANCH="${ISSUE}-${SLUG}"`, `WT_PATH=".../forkprint-${ISSUE}-${SLUG}"`. Restore `print_usage()` Behavior comment. No `gh` prefix.
- [X] T005 [US1] Revert awk patterns in `remove_worktree()`, `cleanup_merged()`, `release_paused_session()` — single `-${issue}-` match. No dual-pattern compat needed.
- [X] T006 [US1] Update `.specify/scripts/bash/create-new-feature.sh` reuse-current-branch detection — match `^[0-9]{8}-[0-9]{6}-.+$` then `^[0-9]+-.+$`. Drop the `gh[0-9]+` branch. Reuse logic unchanged.
- [X] T007 [US1] Verify `FEATURE_NUM` output is the extracted numeric prefix (unpadded for bare digits, literal for timestamp).

## Phase 4: User Story 2 — Manual fallback preserved (P2)

- [X] T008 [US2] Confirm the sequential-fallback path runs unchanged when current branch matches no recognised prefix. (No code change needed — the `if REUSE_CURRENT_BRANCH = false` branch falls through to the existing logic.)
- [X] T009 [US2] Confirm `--number N` override still produces `<NNN>-<slug>` form (zero-padded for N<1000, verbatim for N≥1000). (No code change needed — preserved from v1.)

## Phase 5: User Story 3 — Loud collision handling (P2)

- [X] T010 [US3] Preserve `--number` input validation (v1's `^[0-9]+$` + decode-to-≥1 check). Unchanged from v1.
- [X] T011 [US3] Preserve populated-`spec.md` collision check. Unchanged from v1.
- [X] T012 [US3] Update the branch-exists error message to list `<NNN>-<slug>` and timestamp forms (no `gh<N>-`). Clear resolution guidance.

## Phase 6: Polish

- [X] T013 [P] Update `.claude/commands/speckit.specify.md` — revise the auto-detection note to reference `<N>-<slug>` and timestamp only (no `gh<N>-`).
- [X] T014 [P] Update `docs/DEVELOPMENT.md` — revert worktree examples to `forkprint-<issue>-<slug>` / `<issue>-<slug>`. Remove the `gh<N>-` naming-convention subsection and the `--cleanup-merged` legacy-compat note. Document the reuse rule and the rare-collision fallback briefly.
- [X] T015 Run quickstart.md regression tests T1–T9 in a sandbox + live `git worktree` against a throwaway number. Record pass/fail on the PR's Test Plan.
- [X] T016 Self-review the diff: no product code changes, no stale `gh<N>-` references, no drift.

## Dependencies

```
Foundational: T001, T002, T003 [all parallel]
    ↓
US1 (MVP): T004 → T005 (same file, sequential); T006 → T007 (same file, sequential)
    ↓
US2: T008, T009 (confirmations only, no edits)
    ↓
US3: T010, T011, T012 (preserved from v1 / error-message update)
    ↓
Polish: T013 [P], T014 [P], T015, T016
```

## Implementation Strategy

Single commit on top of the existing PR (commit fc11a49):
- Revert the `gh<N>-` attempts in `claude-worktree.sh`, `create-new-feature.sh`, `common.sh`, `speckit.specify.md`, `docs/DEVELOPMENT.md`.
- Keep all the hardening from v1 (reuse detection, input validation, collision checks, improved error messages).
- Update the spec-folder artifacts (spec.md, plan.md, research.md, data-model.md, contracts, quickstart, tasks, checklist) to reflect the simpler convention.
- Re-run the regression suite.

Total diff net: fewer lines than v1 (simpler code), different philosophy (portable > custom).
