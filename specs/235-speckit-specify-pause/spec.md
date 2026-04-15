# Feature Specification: Workflow Pause After /speckit.specify

**Feature Branch**: `235-workflow-pause-after-speckit-specify-for`
**Created**: 2026-04-15
**Status**: Draft
**Input**: GitHub issue #235 — Workflow: pause after `/speckit.specify` for manual validation before continuing the SpecKit lifecycle.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Mandatory pause after spec generation (Priority: P1)

When Claude is launched via `scripts/claude-worktree.sh` (interactive or `--headless`) and runs the SpecKit lifecycle for an issue, it must halt after `/speckit.specify` completes. Claude reports the generated spec path and waits for explicit user approval before invoking `/speckit.plan`. The user reviews the spec, requests any revisions, and then types an approval phrase (e.g. "proceed", "approved", "go to plan") to release the workflow.

**Why this priority**: The spec is the highest-leverage artifact and the moment where **human-in-the-loop review delivers the most value**. Specs encode intent, scope, and acceptance — judgment calls that require a human to validate before autonomous downstream work compounds on top of them. Revisions applied after plan and tasks already exist invalidate that downstream work, forcing Claude to re-derive plan and tasks against the corrected spec (as happened in the #212 session across ~7 spec revision rounds). A mandatory pause after `/speckit.specify` inserts the human checkpoint at exactly the point where it cuts the most wasted work, aligning the SpecKit loop with the constitution's "On Ambiguity → stop and ask" principle and preserving human authority over intent before Claude proceeds autonomously.

**Independent Test**: Launch `scripts/claude-worktree.sh <issue>` against any issue. Confirm Claude runs `/speckit.specify`, prints the spec path, and stops — it must not invoke `/speckit.plan` until the user replies with an approval phrase.

**Acceptance Scenarios**:

1. **Given** a fresh worktree spawned by `scripts/claude-worktree.sh`, **When** Claude completes `/speckit.specify`, **Then** Claude reports the spec file path, explicitly states it is waiting for user approval before continuing, and does not run `/speckit.plan`.
2. **Given** Claude is paused after `/speckit.specify`, **When** the user replies with "proceed" (or "approved", or "go to plan"), **Then** Claude resumes the lifecycle starting with `/speckit.plan`.
3. **Given** Claude is paused after `/speckit.specify`, **When** the user replies with spec revision requests instead of an approval phrase, **Then** Claude updates the spec and re-enters the paused state until an approval phrase is received.

---

### User Story 2 — Headless runs halt at the spec pause with a documented release path (Priority: P2)

When `scripts/claude-worktree.sh --headless <issue>` is used, the spawned `claude -p` process halts at the same pause point. The repository documentation tells the user exactly how to release a paused headless session (for example, by attaching to the session, or by resuming it through the claude CLI with a follow-up message).

**Why this priority**: Without explicit documentation, users batching multiple headless worktrees will not know the spec-review handoff exists, and will either wait indefinitely or discover the pause through surprise. Documenting this keeps the batch-worktree workflow tractable.

**Independent Test**: Run `scripts/claude-worktree.sh --headless <issue>`. Inspect `claude.log` in the worktree: the log must show the pause notice after `/speckit.specify`, and the documentation must tell the user how to send a follow-up "proceed" message to release it.

**Acceptance Scenarios**:

1. **Given** a headless worktree spawn, **When** `/speckit.specify` completes, **Then** `claude.log` records the pause notice with the spec path, and the process remains alive awaiting further input.
2. **Given** the headless pause has been logged, **When** the user reads `docs/DEVELOPMENT.md`, **Then** they find a step-by-step description of how to release the paused session.

---

### Edge Cases

- User replies with ambiguous feedback (not clearly an approval, not clearly a revision): Claude asks for explicit confirmation rather than guessing.
- User asks to skip the pause for a specific run: not supported in this change; the pause is unconditional. Explicitly out of scope here — a flag-gated override can be a follow-up.
- Spec generation completes but the spec file is empty or the command errored: Claude reports the failure and does not enter the pause state; the user handles the error path normally.
- Secondary pause after `/speckit.plan`: optional per the issue. Treated as out of scope for this feature unless trivially additive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `scripts/claude-worktree.sh` kickoff prompt MUST instruct Claude to halt after `/speckit.specify` and wait for explicit user approval before invoking `/speckit.plan`.
- **FR-002**: The kickoff prompt MUST list the specific approval phrases that will release the pause (e.g. "proceed", "approved", "go to plan") so Claude recognises user intent unambiguously.
- **FR-003**: `CLAUDE.md` Feature Selection Order MUST document the mandatory pause between `/speckit.specify` and `/speckit.plan` as part of the canonical workflow, so the rule applies even when Claude is launched outside `claude-worktree.sh`.
- **FR-004**: Documentation (`docs/DEVELOPMENT.md`, in the `scripts/claude-worktree.sh` section) MUST describe how `--headless` worktree spawns behave at the pause point and how the user releases a paused headless session.
- **FR-005**: The pause MUST be unconditional — it applies on every SpecKit lifecycle run launched via the kickoff prompt or documented in `CLAUDE.md`, regardless of feature size or headless mode.
- **FR-006**: When paused, Claude MUST surface the spec file path so the user can open and review it directly without searching.
- **FR-007**: After receiving an approval phrase, Claude MUST resume with `/speckit.plan` and continue the remaining lifecycle (`/speckit.tasks`, `/speckit.implement`) without a second mandatory pause (unless a secondary pause is explicitly added as part of this change).
- **FR-008**: If the user provides spec revision requests during the pause, Claude MUST apply the revisions and re-enter the paused state rather than continuing to `/speckit.plan`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of worktrees spawned via `scripts/claude-worktree.sh` (interactive or headless) halt after `/speckit.specify` and wait for explicit user approval.
- **SC-002**: The kickoff prompt and `CLAUDE.md` together contain the pause instruction — a reviewer reading either document alone can identify the pause rule without cross-referencing the other.
- **SC-003**: `docs/DEVELOPMENT.md` documents the headless release path in a way that a user can follow without consulting the script source.
- **SC-004**: For a feature whose spec requires revision, zero `/speckit.plan` or `/speckit.tasks` invocations occur before the revised spec is approved (measured by lifecycle command sequence in the session log).

## Assumptions

- The existing SpecKit command set (`/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`) remains unchanged. This feature is purely a workflow/prompting change.
- Users launching Claude outside `scripts/claude-worktree.sh` will honour the `CLAUDE.md` documented workflow, so documenting the pause there is sufficient enforcement for the non-worktree path.
- "Explicit user approval" is satisfied by a free-form text phrase the user types (e.g. "proceed", "approved"); a formal approval UI or multi-reviewer mechanism is out of scope.
- A secondary pause between `/speckit.plan` and `/speckit.tasks` is not required for this release; the issue flags it as optional and only if trivially additive.
- Existing in-flight worktrees (already past `/speckit.specify`) are unaffected by this change; the rule applies to sessions launched after the change merges.
