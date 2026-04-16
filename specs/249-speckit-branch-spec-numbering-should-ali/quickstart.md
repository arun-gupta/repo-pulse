# Quickstart: Regression tests

## T1. Worktree-driven happy path (User Story 1)

```bash
# Simulate what scripts/claude-worktree.sh does for an issue:
git worktree add ../forkprint-99999-demo -b 99999-demo
cd ../forkprint-99999-demo
git branch --show-current       # expect: 99999-demo

# Simulate /speckit.specify:
.specify/scripts/bash/create-new-feature.sh "Demo feature" --short-name any --json
# expect JSON with BRANCH_NAME=99999-demo, FEATURE_NUM=99999 (unpadded)
git branch --show-current       # expect: still 99999-demo (no branch switch)
[ -s specs/99999-demo/spec.md ] # expect: true
```

**Pass criterion**: branch reused, spec dir matches branch, no decoy numbered directory.

## T2. Manual sequential fallback (User Story 2)

```bash
# From main, no issue context:
cd <repo>
git checkout main
.specify/scripts/bash/create-new-feature.sh "exploratory refactor" --short-name refactor --json
```

**Pass criterion**: spec dir `<NNN>-refactor/` uses next free sequential number; branch `<NNN>-refactor` created.

## T3. Explicit `--number` override (User Story 2, scenario 2)

```bash
.specify/scripts/bash/create-new-feature.sh --number 9999 --short-name test-override "override" --json
```

**Pass criterion**: branch `9999-test-override`, spec dir `specs/9999-test-override/`. `--number` remains a raw-numeric override.

## T4. Reuse when current branch matches (User Story 3, scenario 1)

Covered by T1 — worktree spawn pre-creates the branch and `/speckit.specify` reuses it silently.

## T5. Loud error on populated spec.md (User Story 3, scenario 2)

```bash
# From a branch where specs/<prefix>-<slug>/spec.md is populated:
.specify/scripts/bash/create-new-feature.sh "anything" --short-name any --json
echo "exit=$?"
```

**Pass criterion**: exit 1, error names the existing path, suggests resolution.

## T6. Loud error on branch collision (User Story 3, scenario 3)

```bash
git checkout main
git branch 88888-phantom          # create a conflicting branch off-HEAD
.specify/scripts/bash/create-new-feature.sh --number 88888 --short-name phantom "phantom" --json
echo "exit=$?"
git branch -D 88888-phantom
```

**Pass criterion**: exit 1 with an error naming the conflicting branch.

## T7. `--cleanup-merged` finds the worktree

Covered by running `scripts/claude-worktree.sh --cleanup-merged <N>` after the corresponding PR merges. Awk pattern `-<N>-` matches `forkprint-<N>-<slug>`. Same behaviour as before this fix — no change to `claude-worktree.sh`.

## T8. Invalid `--number`

```bash
.specify/scripts/bash/create-new-feature.sh --number abc "bad" --json   # expect exit 1
.specify/scripts/bash/create-new-feature.sh --number 0   "bad" --json   # expect exit 1
.specify/scripts/bash/create-new-feature.sh --number -5  "bad" --json   # expect exit 1
```

## T9. Downstream commands resolve the spec dir

```bash
# From a branch `99999-demo` with populated specs/99999-demo/spec.md:
.specify/scripts/bash/setup-plan.sh --json | grep '^{' | jq -r .FEATURE_SPEC
# expect: .../specs/99999-demo/spec.md
```

**Pass criterion**: `/speckit.plan`, `/speckit.tasks`, `/speckit.implement` all resolve the same spec directory via `common.sh` helpers.

## Cleanup

```bash
git worktree remove ../forkprint-99999-demo
git branch -D 99999-demo
```
