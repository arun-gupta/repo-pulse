# CLI Contracts

## C1. `scripts/claude-worktree.sh <issue-number> [slug]`

**Unchanged**. Creates `../forkprint-<N>-<slug>/` on branch `<N>-<slug>`, picks a free port, runs `npm install`, starts `next dev`, launches Claude. The earlier `gh<N>-` naming attempt has been reverted — bare `<N>-` matches upstream SpecKit conventions.

## C2. `scripts/claude-worktree.sh --cleanup-merged <issue-number>` / `--remove` / `--approve-spec` / `--revise-spec`

**Unchanged**. Matches worktree paths via `-<issue>-`. Since `claude-worktree.sh` always created the worktree with the bare issue number, this awk pattern has always been correct.

## C3. `.specify/scripts/bash/create-new-feature.sh`

**Before (the bug)**:
- Always scanned `specs/` for next free sequential number.
- Always ran `git checkout -b "$BRANCH_NAME"`, erroring if the branch existed.
- Silently produced a branch/spec-dir number different from the worktree's issue number.

**After**:
- **Reuse path** (when current branch matches `^[0-9]{8}-[0-9]{6}-.+$` or `^[0-9]+-.+$`, and neither `--number` nor `--timestamp` is supplied):
  - `BRANCH_NAME = current branch`, verbatim.
  - `FEATURE_NUM = prefix extracted from branch` (unpadded for `^[0-9]+-` matches, literal timestamp for timestamp matches).
  - **No** `git checkout -b`.
  - **No** scan of `specs/` for next sequential.
- **Sequential path** (when no match on current branch AND no `--number`): unchanged — compute next free number, `git checkout -b`.
- **`--number N` path**: validates `N` is a positive integer; uses `printf "%03d"` for < 1000 (zero-padded), verbatim for ≥ 1000; runs `git checkout -b`.
- **Collision checks** (in all paths):
  - Branch exists but not current HEAD → exit 1 with a clear error listing accepted forms.
  - `$SPEC_FILE` already exists with non-empty content → exit 1 with an error naming the directory.

**Inputs**: positional feature description, optional `--number N`, `--short-name <slug>`, `--timestamp`, `--json`.
**Outputs**: `--json` emits `{BRANCH_NAME, SPEC_FILE, FEATURE_NUM}`.
**Exit codes**:
- `0` on success (creation or silent reuse).
- `1` on: invalid `--number`; target branch exists off-HEAD; target spec.md non-empty; git operation failure.

## C4. `.specify/scripts/bash/common.sh` helpers

### `get_current_branch`

**Before**: Non-git fallback scans `^[0-9]{3}-` and `^[0-9]{8}-[0-9]{6}-` directories.
**After**: Also matches `^[0-9]+-` (strict superset — covers 1, 2, 4+ digit issue numbers).

### `check_feature_branch`

**Before**: Rejects branches not matching `^[0-9]{3}-` or `^[0-9]{8}-[0-9]{6}-`.
**After**: Accepts `^[0-9]+-` and `^[0-9]{8}-[0-9]{6}-`. Error message updated.

### `find_feature_dir_by_prefix`

**Before**: Extracts prefix via `^[0-9]{8}-[0-9]{6}` or `^[0-9]{3}`.
**After**: Extracts via `^[0-9]{8}-[0-9]{6}` (checked first, more specific) or `^[0-9]+` (any width).

## C5. `.claude/commands/speckit.specify.md`

**Unchanged in invocation**. Updated only to document that `create-new-feature.sh` auto-detects feature-prefix branches and reuses them — Claude does not need to pass `--number` in the worktree-driven flow.

## C6. `docs/DEVELOPMENT.md`

Updated to document the numbering rule: branches pre-created by `claude-worktree.sh` are reused verbatim by `/speckit.specify`; manual invocations without a recognised branch prefix fall back to sequential.
