# Feature Specification: Throwaway Test PR #248 Headless Approve

**Feature Branch**: `98889-throwaway-test-pr-248-headless-approve`  
**Created**: 2026-04-15  
**Status**: Draft  
**Input**: User description: "Throwaway issue to verify test plan items 4-6 on PR #248 (headless spawn + --approve-spec)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify headless spawn completes Stage 1 (Priority: P1)

A maintainer spawns a headless Claude worktree session for a GitHub issue. The session runs the SpecKit lifecycle Stage 1 (`/speckit.specify`), generates a spec, and pauses — waiting for explicit approval before proceeding.

**Why this priority**: This is the core precondition for the entire headless workflow. If Stage 1 does not complete and pause correctly, the `--approve-spec` and `--revise-spec` release commands have nothing to act on.

**Independent Test**: Can be verified by running `scripts/claude-worktree.sh --headless <issue>` and confirming a spec file exists in the worktree and `claude.log` shows the session is paused awaiting approval.

**Acceptance Scenarios**:

1. **Given** a valid GitHub issue number and the repo's permission allowlist, **When** the maintainer runs a headless spawn for that issue, **Then** the session creates a worktree, starts a dev server, runs the specify step, generates a spec file under `specs/`, and halts with a message requesting approval.
2. **Given** the headless session has paused after Stage 1, **When** the maintainer inspects the session log in the worktree, **Then** the log contains the generated spec file path and an explicit pause message.

---

### User Story 2 - Release paused session with approve-spec (Priority: P1)

A maintainer releases a paused headless session by running the approve-spec command, which resumes the session with an approval prompt so it continues through Stage 2 (plan, tasks, implement, PR).

**Why this priority**: This validates the fire-and-forget release mechanism that allows batch approval of multiple worktrees without attaching a terminal.

**Independent Test**: After a paused headless session exists, run the approve-spec command and confirm the session resumes, completes Stage 2, and opens a PR.

**Acceptance Scenarios**:

1. **Given** a paused headless session with a valid session ID and at least one spec file, **When** the maintainer runs the approve-spec command for that issue, **Then** the command returns control to the shell within 5 seconds and the session resumes in the background.
2. **Given** the approve-spec command has been issued, **When** the resumed session completes Stage 2, **Then** a PR is opened on GitHub with a test plan section and the branch is pushed.

---

### User Story 3 - Send revision feedback with revise-spec (Priority: P2)

A maintainer reviews the generated spec, finds it needs changes, and sends revision feedback to the paused session. The session applies the revisions and re-enters the paused state.

**Why this priority**: This validates the iterative revision loop before approval, ensuring maintainers can refine specs without attaching a terminal.

**Independent Test**: After a paused headless session exists, run the revise-spec command with feedback text and confirm the spec is updated and the session re-pauses.

**Acceptance Scenarios**:

1. **Given** a paused headless session, **When** the maintainer runs the revise-spec command with feedback text, **Then** the session resumes, applies the revision to the spec, and re-enters the paused state awaiting approval.
2. **Given** the revise-spec command is invoked with empty feedback, **When** the command runs, **Then** it exits with a non-zero status and a clear error message, and does not resume the session.

---

### Edge Cases

- What happens when approve-spec is run but no worktree exists for the issue? The command exits non-zero with a clear error.
- What happens when approve-spec is run but the session ID file is missing or empty? The command exits non-zero with a clear error.
- What happens when approve-spec is run but no spec file exists (Stage 1 not yet complete)? The command exits non-zero with a clear error.
- What happens when revise-spec is run multiple times in succession? Each round applies revisions to the spec as it stands after the previous round; revisions accumulate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The headless spawn MUST complete Stage 1 (specify) and pause without manual intervention, relying on the project-scoped permission allowlist.
- **FR-002**: The approve-spec command MUST locate the worktree for the given issue, read the session UUID, verify at least one spec file exists, and resume the session with an approval prompt.
- **FR-003**: The approve-spec command MUST return control to the caller's shell within 5 seconds (fire-and-forget), running the resumed session as a detached background process.
- **FR-004**: The revise-spec command MUST reject empty feedback with a non-zero exit and a descriptive error message.
- **FR-005**: The revise-spec command MUST resume the paused session with the revision feedback, causing the session to update the spec and re-enter the paused state.
- **FR-006**: Both approve-spec and revise-spec MUST exit non-zero with clear error messages when preconditions are unmet (no worktree, no session ID, no spec file).
- **FR-007**: The resumed session (after approve-spec) MUST complete Stage 2 and open a PR on GitHub without merging it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A headless spawn for a valid issue completes Stage 1 and produces a spec file within the worktree without any interactive approval prompts blocking progress.
- **SC-002**: The approve-spec command returns control to the shell in under 5 seconds and the background session opens a PR within a reasonable timeframe.
- **SC-003**: The revise-spec command with valid feedback causes the spec to be updated and the session to re-pause, verifiable via the session log.
- **SC-004**: All precondition failures (approve-spec or revise-spec with missing worktree, session ID, or spec file) produce non-zero exit codes and human-readable error messages.

## Assumptions

- The maintainer has the GitHub CLI authenticated and the Claude CLI installed.
- The repo's project-scoped permission allowlist is sufficient for headless sessions to run SpecKit commands without interactive tool-approval prompts.
- The dev server port auto-selection (3010-3100) works correctly in the test environment.
- This is a throwaway test issue — the generated artifacts (spec, plan, tasks, code) serve only to validate the headless workflow mechanics, not to deliver production functionality.
