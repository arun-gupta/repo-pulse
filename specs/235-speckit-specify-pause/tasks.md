# Tasks: Workflow Pause After /speckit.specify

**Feature**: 235-workflow-pause-after-speckit-specify-for
**Spec**: `specs/235-speckit-specify-pause/spec.md`
**Plan**: `specs/235-speckit-specify-pause/plan.md`

## Overview

Documentation-and-prompt-string change. Three files are touched. No code, no tests, no migrations. Manual verification replaces automated testing per the plan.

## Phase 1: Setup

None. No project scaffolding required.

## Phase 2: Foundational

None. No shared prerequisites.

## Phase 3: User Story 1 — Mandatory pause after spec generation (P1)

**Goal**: Every SpecKit lifecycle run halts after `/speckit.specify` and requires explicit user approval before `/speckit.plan`.

**Independent test**: Launch `scripts/claude-worktree.sh <issue>` against any open issue. Claude must generate the spec, surface the spec path, and stop. Typing "proceed" must release it.

- [X] T001 [US1] Update the `KICKOFF` prompt string in `scripts/claude-worktree.sh` (the `KICKOFF="..."` assignment near line 177) so Claude is instructed to (a) run `/speckit.specify` first, (b) halt and report the spec file path, (c) wait for an explicit approval phrase from the set {"proceed", "approved", "go to plan"} before running `/speckit.plan`, (d) apply any revision requests and re-enter the paused state rather than continuing, (e) after approval, run `/speckit.plan`, `/speckit.tasks`, and `/speckit.implement` in sequence, then push and open a PR without merging.
- [X] T002 [US1] Update the "Feature Selection Order" section in `CLAUDE.md` to insert an explicit "Pause for spec review" step between `/speckit.specify` and `/speckit.plan`. Include the approval phrases and a one-line rationale ("human-in-the-loop at the highest-leverage artifact — the spec encodes intent and must be validated before autonomous downstream work compounds on top of it").

## Phase 4: User Story 2 — Headless release path documented (P2)

**Goal**: A user running `--headless` worktrees can find, in `docs/DEVELOPMENT.md`, how the pause surfaces in `claude.log` and how to release the paused session.

**Independent test**: A new user reads `docs/DEVELOPMENT.md`, spawns `scripts/claude-worktree.sh --headless <issue>`, and follows the documented steps end-to-end without opening the script source.

- [X] T003 [US2] Extend the "Spawning worktrees with `scripts/claude-worktree.sh`" subsection of `docs/DEVELOPMENT.md` to document: (a) that headless runs halt after `/speckit.specify`, (b) how to observe the pause (`tail -f claude.log` in the worktree), (c) how to release the paused session by resuming the `claude` CLI session for that worktree and replying with an approval phrase, (d) that the pause applies per worktree, so batch spawns require a release per worktree.

## Phase 5: Polish

- [ ] T004 Manual verification — interactive: spawn a disposable test worktree via `scripts/claude-worktree.sh` against a test issue, confirm Claude halts after `/speckit.specify`, confirm "proceed" releases it, confirm revision requests re-enter the paused state. Clean up the test worktree afterwards.
- [ ] T005 Manual verification — headless: spawn `scripts/claude-worktree.sh --headless <issue>`, confirm `claude.log` records the pause notice with the spec path, confirm the process remains alive, confirm the documented release steps work end-to-end. Clean up afterwards.
- [ ] T006 Populate the PR `## Test plan` section with the manual verification steps from T004 and T005 so they are signed off before merge per constitution §XIII.3.

## Dependencies

- T001 and T002 can be authored in parallel but must both land together (either source instructs Claude; divergence is a bug).
- T003 can be authored in parallel with T001/T002.
- T004 depends on T001 being merged (or running against the edited worktree script).
- T005 depends on T001 + T003.
- T006 is the final step before PR merge.

## Parallel Opportunities

- T001, T002, T003 are edits to three distinct files with no logical ordering between them. All three can be drafted in a single pass.

## MVP Scope

US1 alone is the MVP — the pause itself. US2 (headless documentation) is a usability polish that is trivially additive and ships in the same PR because the deliverable list in the issue explicitly includes it.

## Format Validation

All tasks use the `- [ ] Tnnn [P?] [USn?] description with path` form. Setup/Foundational/Polish phases carry no `[USn]` label. File paths are named explicitly in every task.
