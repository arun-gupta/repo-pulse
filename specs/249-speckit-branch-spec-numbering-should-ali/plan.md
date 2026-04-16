# Implementation Plan: SpecKit branch/spec numbering aligned with GitHub issue number

**Branch**: `249-speckit-branch-spec-numbering-should-ali` | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/249-speckit-branch-spec-numbering-should-ali/spec.md`

## Summary

Fix the decoupling between worktree/branch and spec directory identifiers by teaching `create-new-feature.sh` to detect a pre-existing feature-branch pattern on the current HEAD and reuse it verbatim — instead of scanning `specs/` for the next free number. Branch naming stays on the upstream SpecKit convention `<N>-<slug>` (no custom prefix), which keeps this fix portable and aligned with future SpecKit upstream changes. The rare collision between manual sequential and issue-number namespaces is handled by a loud-error contract (reject, name the conflict, suggest resolution) rather than a custom prefix.

**Technical approach**: Four tooling-layer files change. `create-new-feature.sh` gains a reuse-current-branch check and collision-handling. `common.sh`'s three prefix-parsing helpers widen their regex to accept issue numbers of any width. `claude-worktree.sh` is unchanged beyond what it already does (creates `forkprint-<N>-<slug>/` and `<N>-<slug>` branch). `docs/DEVELOPMENT.md` documents the rule.

## Technical Context

**Language/Version**: Bash (POSIX-compatible for portable bits, bash-specific features already in use: `[[ ... ]]`, `set -euo pipefail`, `${BASH_REMATCH}`)
**Primary Dependencies**: `git`, `gh` (GitHub CLI, already required by surrounding tooling), `uuidgen`
**Storage**: N/A (state in git + local filesystem)
**Testing**: Manual regression via `quickstart.md`; no bash-script test harness exists in this repo
**Target Platform**: macOS (primary) and Linux
**Project Type**: CLI/tooling layer — no application-code changes
**Performance Goals**: N/A (interactive lifecycle scripts, <10s per invocation)
**Constraints**: No new deps; no upstream SpecKit fork; stay on `<N>-<slug>` so a future upstream change can be absorbed cleanly
**Scale/Scope**: 4 tooling files modified, ~60 lines added/changed. No new files outside `specs/249-.../`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pure tooling change: no product runtime, no analyzer, no scoring, no UI, no data source change.

| Gate | Result |
|---|---|
| I. Technology Stack | ✅ No new deps |
| II. Accuracy Policy (NON-NEGOTIABLE) | ✅ N/A |
| III. Data Source Rules | ✅ N/A |
| IV. Analyzer Boundary | ✅ Untouched |
| V–VIII. Scoring / Ecosystem / Contributors | ✅ N/A |
| IX. YAGNI / KISS | ✅ Reverted the `gh<N>-` prefix precisely because it added complexity for a rare collision case |
| X. Security & Hygiene | ✅ No secrets, no new shell commands beyond the existing allowlist |
| XI. Testing | ✅ Manual-regression scope acknowledged |
| XII. Definition of Done | ✅ PR test plan will cover acceptance scenarios |
| XIII. Development Workflow | ✅ Feature-branch PR, test plan, DEVELOPMENT.md updated |

No violations. Complexity Tracking table empty.

## Project Structure

### Documentation (this feature)

```text
specs/249-speckit-branch-spec-numbering-should-ali/
├── spec.md              # User-facing spec
├── plan.md              # This file
├── research.md          # Decisions & alternatives
├── data-model.md        # Naming grammar
├── contracts/
│   └── cli-contracts.md # Script-level contracts
├── quickstart.md        # Regression walkthrough
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
scripts/
└── claude-worktree.sh                   # No change (already creates <N>-<slug> branch and forkprint-<N>-<slug>/ worktree path)

.specify/
└── scripts/
    └── bash/
        ├── create-new-feature.sh        # MODIFIED — reuse-current-branch detection; --number validation; populated-spec.md collision check; improved branch-exists error
        └── common.sh                    # MODIFIED — find_feature_dir_by_prefix, check_feature_branch, get_current_branch accept ^[0-9]+- (any width)

.claude/
└── commands/
    └── speckit.specify.md               # MODIFIED — note on auto-detection of feature-prefix branches

docs/
└── DEVELOPMENT.md                       # MODIFIED — document the numbering rule; no custom prefix
```

**Structure Decision**: Tooling-only — no product surface. Four files modified, diff ~60 lines.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations — intentionally empty.*
