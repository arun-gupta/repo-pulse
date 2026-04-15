# Implementation Plan: Workflow Pause After /speckit.specify

**Branch**: `235-workflow-pause-after-speckit-specify-for` | **Date**: 2026-04-15 | **Spec**: `specs/235-speckit-specify-pause/spec.md`
**Input**: Feature specification from `/specs/235-speckit-specify-pause/spec.md`

## Summary

Insert a mandatory human-in-the-loop pause after `/speckit.specify` and before `/speckit.plan` in the RepoPulse SpecKit workflow. The change is purely documentation/prompting — no runtime code, no product surface, no tests. Three files are updated: the kickoff prompt string in `scripts/claude-worktree.sh`, the Feature Selection Order section in `CLAUDE.md`, and the headless-release guidance in `docs/DEVELOPMENT.md`.

## Technical Context

**Language/Version**: N/A — documentation and shell-string change only.
**Primary Dependencies**: None. Edits are confined to three plain-text files.
**Storage**: N/A.
**Testing**: Manual verification — spawn an interactive and a headless worktree; confirm Claude halts after `/speckit.specify`. No automated test layer (Vitest/Playwright) applies to prompt strings.
**Target Platform**: Developer workstation running `scripts/claude-worktree.sh` on macOS/Linux.
**Project Type**: Repository-level workflow change; not a Phase 1/2/3 product feature.
**Performance Goals**: N/A.
**Constraints**: The kickoff prompt must remain a single `KICKOFF` bash string. Approval phrases must be listed explicitly so Claude does not have to guess.
**Scale/Scope**: Three files touched, zero new files, zero code paths added.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reviewed `.specify/memory/constitution.md` v1.2. This change touches no product surface. Relevant gates:

- **I. Technology Stack**: No new tech introduced. Pass.
- **II. Accuracy Policy**: No metrics or data surfaces affected. Pass.
- **III. Data Source Rules**: No API calls. Pass.
- **IV. Analyzer Module Boundary**: No analyzer code touched. Pass.
- **V. CHAOSS Alignment**: No scoring surface touched. Pass.
- **IX. Feature Scope Rules** (YAGNI / Keep It Simple): Implementation is the smallest documentation change that satisfies the spec — three file edits, no helper flags, no secondary pause. Pass.
- **XI. Testing**: No code added, so no TDD obligation. Manual verification documented in the PR Test Plan per §XIII.3. Pass.
- **XII. Definition of Done**: PR Test Plan signoff required; README unchanged (no user-facing behaviour). Pass.
- **XIII. Development Workflow**: Change happens on a feature branch, PR will carry a `## Test plan` section, `docs/DEVELOPMENT.md` is updated as part of the deliverable. Pass.
- **"On Ambiguity → stop and ask"** (`CLAUDE.md`): This change operationalises that principle at the most load-bearing point in the SpecKit loop. Reinforces the constitution rather than challenging it.

**Result**: All gates pass. No complexity deviations to track.

## Project Structure

### Documentation (this feature)

```text
specs/235-speckit-specify-pause/
├── spec.md                 # /speckit.specify output (done)
├── plan.md                 # This file (/speckit.plan output)
└── tasks.md                # /speckit.tasks output (next)
```

No `research.md`, `data-model.md`, `contracts/`, or `quickstart.md` — this feature has no unknowns, no entities, no external interfaces, and no runnable surface to demo.

### Source (repository root)

Three files touched; no new directories.

```text
scripts/claude-worktree.sh   # KICKOFF prompt string — add pause instruction + approval phrases
CLAUDE.md                    # Feature Selection Order — document the pause as canonical
docs/DEVELOPMENT.md          # scripts/claude-worktree.sh section — document --headless release path
```

**Structure Decision**: Repository-level workflow edit. No application code layout changes.

## Phase 0 — Research

No NEEDS CLARIFICATION markers in the spec. No unknown technologies or integrations. Phase 0 produces no artifact.

Decisions captured inline:

- **Approval phrases**: `"proceed"`, `"approved"`, `"go to plan"`. Chosen from the issue body; short, unambiguous, and already used informally in this project. Alternatives considered: a single fixed phrase (rejected — too rigid); a structured `/approve` slash command (rejected — out of scope per the spec's "no formal approval mechanism").
- **Scope of pause**: spec-to-plan only. Plan-to-tasks pause is flagged optional in the issue; the spec marks it out of scope. Not adding it keeps the change minimal and avoids configuration surface.
- **Headless release mechanism**: describe the existing `claude` CLI session-resume mechanism (attach and type the approval phrase, or send the follow-up message via whatever mechanism the `claude` CLI already supports). No new tooling is introduced; documentation points at existing behaviour.

## Phase 1 — Design & Contracts

No data entities. No contracts. No quickstart demo.

Design boils down to three edit specifications:

1. **`scripts/claude-worktree.sh` KICKOFF string (line ~177)**
   - Current: single sentence instructing Claude to run the full lifecycle.
   - New: same single-string shape, but splits the lifecycle into two stages separated by a mandatory pause. Must include (a) the halt instruction after `/speckit.specify`, (b) the explicit approval phrases that release the pause, (c) the instruction to surface the spec file path when pausing, (d) the rule that revision requests re-enter the paused state.

2. **`CLAUDE.md` Feature Selection Order section**
   - Current: 4-step SpecKit lifecycle listed in order with no intermediate checkpoint.
   - New: insert an explicit step between `/speckit.specify` and `/speckit.plan` named "Pause for spec review". Include the rationale (human-in-the-loop at the highest-leverage artifact) and the approval phrases. This ensures the rule applies even when Claude is launched outside `claude-worktree.sh`.

3. **`docs/DEVELOPMENT.md` "Spawning worktrees" subsection**
   - Add a short paragraph under the headless spawn block explaining that headless runs halt after `/speckit.specify`, how to see the pause notice (`tail claude.log`), and how to release the session (resume via the `claude` CLI and reply with an approval phrase).

Agent context file: not updated. No new technology introduced.

## Re-evaluation After Phase 1

Constitution gates rechecked — still pass. No violations introduced by the design.

## Complexity Tracking

None. No deviations.
