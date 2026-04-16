# Feature Specification: SpecKit branch/spec numbering aligned with GitHub issue number

**Feature Branch**: `249-speckit-branch-spec-numbering-should-ali`
**Created**: 2026-04-16
**Status**: Draft
**Input**: GitHub issue #249 — "SpecKit branch/spec numbering should align with GitHub issue number"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Worktree-driven spec reuses the pre-created branch and issue number (Priority: P1)

A maintainer runs `scripts/claude-worktree.sh 238` to spawn a worktree for GitHub issue #238. The worktree script creates the directory `../forkprint-238-<slug>/` and the branch `238-<slug>`. When Claude runs `/speckit.specify` inside that worktree, the SpecKit helper **detects the pre-existing `238-<slug>` branch, reuses it verbatim**, and writes the spec to `specs/238-<slug>/`. No `243-*` (or any other) spec directory is created. The branch the code lives on, the spec directory, and the GitHub issue number all agree.

**Why this priority**: This is the bug fix. Today, `/speckit.specify` inside a worktree scans `specs/` for the next free sequential number and creates a new branch with that number — decoupling everything from the GitHub issue. The fix is a one-line change in philosophy: if the current branch already has a recognised feature-prefix pattern, reuse it instead of renumbering.

**Independent Test**: Spawn a worktree for any issue N (e.g. `scripts/claude-worktree.sh 999 demo`), run `/speckit.specify` inside, and verify three things: (a) `git branch --show-current` → `999-demo` (unchanged), (b) `specs/999-demo/spec.md` exists, (c) no other numbered spec directory was created by this run.

**Acceptance Scenarios**:

1. **Given** a worktree spawned for issue #238 (so branch `238-some-slug` is already checked out), **When** `/speckit.specify` runs inside, **Then** the spec directory `specs/238-some-slug/` is created, the checked-out branch remains `238-some-slug`, and no `NNN-*` decoy spec directory or branch is created.
2. **Given** the same worktree, **When** downstream commands `/speckit.plan`, `/speckit.tasks`, `/speckit.implement` run, **Then** they resolve `specs/238-some-slug/` unambiguously.
3. **Given** the worktree is merged, **When** the maintainer runs `scripts/claude-worktree.sh --cleanup-merged 238`, **Then** the script finds `forkprint-238-*` and `238-*`, verifies `MERGED`, and cleans both.

---

### User Story 2 - Manual `/speckit.specify` outside the worktree flow keeps auto-sequential numbering (Priority: P2)

A maintainer runs `/speckit.specify` directly from `main` (no worktree, no issue number). The sequential-numbering fallback scans `specs/` and picks the next free number, creating `specs/<NNN>-<slug>/` and branch `<NNN>-<slug>` exactly as before.

**Why this priority**: The manual path is a small but important fallback for non-issue-driven work (exploratory specs, pre-issue design). It must continue to work unchanged.

**Independent Test**: From `main`, invoke `/speckit.specify <description>` with no issue context. Verify a spec directory with the next free sequential number is created and a matching branch is checked out.

**Acceptance Scenarios**:

1. **Given** checkout on `main`, no issue context, **When** `/speckit.specify` runs, **Then** the spec directory and branch use the next free sequential number, matching pre-change behaviour.
2. **Given** explicit `--number 350` override and no existing `specs/350-*`, **When** `/speckit.specify` runs, **Then** both use the `350-<slug>` form, overriding auto-detection.

---

### User Story 3 - Loud, non-silent collision handling (Priority: P2)

When `/speckit.specify` is asked to use a number whose branch already exists on a different HEAD, or whose spec directory already contains a populated `spec.md`, it fails loudly with a clear error. It never silently renumbers. Reuse of a branch that is already the current HEAD is the expected case (worktree spawn) and proceeds without error. Invalid `--number` inputs (non-numeric, zero, negative) are rejected up front.

**Why this priority**: The original bug was a silent renumbering (asked for 238, got 243, no warning). The loud-error contract replaces that. The rare remaining collision scenario — manual sequential claims slot N just before issue #N is filed — surfaces as a clear, actionable error rather than silent wrong behavior.

**Independent Test**: Exercise each collision path in a sandbox: branch-already-HEAD (silent OK), populated spec.md (exit 1 with clear message), branch-exists-elsewhere (exit 1 with clear message), invalid `--number` (exit 1 with clear message).

**Acceptance Scenarios**:

1. **Given** target branch equals current HEAD, **When** `/speckit.specify` runs, **Then** the branch is reused silently (no `git checkout -b` attempted), and the spec directory is created.
2. **Given** `specs/238-existing-slug/` exists with populated `spec.md`, **When** `/speckit.specify` is asked to reuse that prefix, **Then** it exits non-zero with an error naming the directory and suggesting resolution.
3. **Given** target branch exists but is not current HEAD, **When** `/speckit.specify` runs, **Then** it exits non-zero with an error naming the conflicting branch. No silent renumbering.
4. **Given** `--number abc`, `--number 0`, or `--number -5`, **When** `/speckit.specify` runs, **Then** it exits non-zero with a clear "--number must be a positive integer" error before any filesystem or git mutation.

---

### Edge Cases

- **Leading zeros on `--number`**: `--number 007` is rejected (decodes to 0 in base 10 via the `[1-9][0-9]*` validator, ensuring consistency with "positive integer"). Users supply `7` without padding.
- **Worktree slug differs from the spec's derived short-name**: The currently checked-out branch is the source of truth. `/speckit.specify` reuses it verbatim and ignores the `--short-name` flag when a recognised prefix is detected. This guarantees spec dir and branch always agree.
- **Manual invocation inside a worktree** (not via the kickoff prompt): The helper auto-detects the branch pattern `^[0-9]+-` or `^[0-9]{8}-[0-9]{6}-` and reuses it. No explicit flag needed.
- **Rare collision: manual spec claims slot N, issue #N later spawned**: This produces a branch-or-spec-dir collision that User Story 3's loud-error path handles cleanly. Resolution: rename/remove the conflicting entity, or pick a different `--number` / issue number. No silent fallback.
- **Legacy entities** (`001-*`–`032-*` Phase 1 specs): unaffected; their sequential form is a valid recognised pattern and continues to work.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the currently checked-out branch matches `^[0-9]+-.+$` or `^[0-9]{8}-[0-9]{6}-.+$`, the spec-generation helper MUST reuse that branch verbatim (no `git checkout -b`) and derive the spec directory name from it. This is the core "don't renumber an issue-driven branch" behavior.
- **FR-002**: When reusing the current branch, the helper MUST NOT scan `specs/` or `git branch -a` to pick a different number.
- **FR-003**: When the current branch does NOT match a recognised feature-prefix pattern AND no `--number` is supplied, the helper MUST fall back to the pre-existing sequential-numbering behaviour (compute next free `<NNN>-<slug>`, `git checkout -b`).
- **FR-004**: When `--number N` is explicitly supplied, the helper MUST use `<NNN>-<slug>` (zero-padded to 3 digits for `N < 1000`, verbatim for `N >= 1000`), regardless of current branch.
- **FR-005**: Invalid `--number` inputs (non-numeric, zero, negative, or any value that decodes to < 1) MUST be rejected with a clear error before any filesystem or git mutation.
- **FR-006**: When the target branch exists but is not the currently checked-out branch, the helper MUST exit non-zero with an error that names the conflicting branch and lists accepted feature-branch forms.
- **FR-007**: When `specs/<target>/spec.md` already exists and is non-empty, the helper MUST exit non-zero with an error naming the existing path. It MUST NOT overwrite authored spec content. Empty or missing `spec.md` is treated as a fresh run (allows worktree-spawn reuse after a partial prior run).
- **FR-008**: `.specify/scripts/bash/common.sh` helpers (`find_feature_dir_by_prefix`, `check_feature_branch`, `get_current_branch`) MUST recognise the broader `^[0-9]+-` pattern (not just the legacy `^[0-9]{3}-`) so issue numbers of any width (1-digit, 4+ digit) resolve correctly downstream. Timestamp and legacy 3-digit forms remain accepted.
- **FR-009**: `docs/DEVELOPMENT.md` MUST document the numbering rule: branches pre-created by `claude-worktree.sh` are reused by `/speckit.specify`; manual invocations without a recognised branch prefix fall back to sequential auto-numbering.
- **FR-010**: The `/speckit.specify` command template (`.claude/commands/speckit.specify.md`) MUST reflect that the helper auto-detects feature-prefix branches — Claude does not need to pass `--number` explicitly.

### Key Entities

- **Spec Directory**: Filesystem location under `specs/` holding `spec.md`, `plan.md`, `tasks.md`, and checklists. Named `<prefix>-<slug>` where `<prefix>` is the GitHub issue number (issue-driven flow) or the next sequential number (manual flow).
- **Feature Branch**: Git branch for the feature; same `<prefix>-<slug>` shape as the spec directory. The prefix is the shared identifier that binds the two together.
- **Issue Number**: Positive integer issued by GitHub when an issue is filed. When a worktree is spawned for it, the issue number becomes the branch/spec-dir prefix.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For 100% of worktrees spawned by `scripts/claude-worktree.sh <N>`, the resulting spec directory prefix, checked-out branch prefix, and worktree path prefix all equal `<N>` after `/speckit.specify` completes.
- **SC-002**: 0 instances of silent renumbering in the issue-driven flow. Every deviation from the pre-created branch is either a loud non-zero-exit error or deliberate silent reuse of the matching HEAD.
- **SC-003**: Manual `/speckit.specify` on `main` without issue context continues to produce the next sequential `<NNN>-<slug>`.
- **SC-004**: `scripts/claude-worktree.sh --cleanup-merged <N>` successfully locates and cleans a worktree created by `scripts/claude-worktree.sh <N>` followed by `/speckit.specify`, with no manual prefix translation.
- **SC-005**: Invalid `--number` inputs fail in under 1 second with a clear, actionable error before mutating anything.
- **SC-006**: A maintainer reading `docs/DEVELOPMENT.md` can, in under 60 seconds, identify the rule that governs which number appears on a spec directory and why.

## Assumptions

- GitHub issue numbers are positive integers; issue number 0 does not exist.
- The GitHub issue number is known at worktree-spawn time — `scripts/claude-worktree.sh` already takes it as its first positional argument.
- `/speckit.specify` is the only code path that creates numbered spec directories and branches. Fixing it end-to-end covers the lifecycle.
- Branch naming stays on the upstream SpecKit convention (`<N>-<slug>`) — no custom prefix. Adoption portability and future upstream alignment outweigh the marginal protection a custom prefix would add against the rare manual-vs-issue collision scenario (which the loud-error contract handles).
- The rare collision case (manual sequential claims slot N just before issue #N is filed) surfaces as a loud error and is resolved by the maintainer renaming/removing the conflicting entity. Acceptable tradeoff given its low frequency.
- Legacy 3-digit-padded sequential specs (`001-*`–`032-*`) and issue-number specs of any width (`128-*`, `249-*`) coexist via the same `<N>-<slug>` grammar — no migration needed.
- The fix is scoped to `scripts/claude-worktree.sh`, `.specify/scripts/bash/create-new-feature.sh`, `.specify/scripts/bash/common.sh`, `.claude/commands/speckit.specify.md`, and `docs/DEVELOPMENT.md`. No application-code, analyzer, scoring, or UI changes.
