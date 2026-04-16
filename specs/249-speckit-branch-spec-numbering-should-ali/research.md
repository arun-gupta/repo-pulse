# Phase 0 Research: Reuse detection, collision handling, and why no custom prefix

## Decision 1: Stay on the upstream `<N>-<slug>` convention — no custom prefix

**Decision**: Branch, worktree, and spec-directory names use the bare issue number as prefix (`238-some-slug`), matching upstream SpecKit's `<NNN>-<slug>` convention.

**Rationale**:
- **Portability**: upstream SpecKit and other projects adopting this worktree workflow expect `<N>-<slug>`. Custom prefixes diverge from the ecosystem.
- **Future upstream alignment**: if SpecKit adds native issue-number support, our convention converges; with a custom prefix, we'd need a breaking rename.
- **Lower cognitive load**: PR titles, branch names, and issue numbers all use the same integer. No mental translation.
- The concern a custom prefix addressed — manual-sequential-vs-issue-number collision — is **extremely rare** (requires manual sequential to claim exactly slot N just before issue #N is filed and worktree-spawned). The loud-error contract (Decision 3) handles it cleanly when it does happen.

**Alternatives considered** (and rejected, as of this revision):
- `gh<N>-<slug>` prefix: earlier iteration of this PR; removed because (a) it diverges from SpecKit ecosystem, (b) adoption by other projects becomes harder, (c) forces us to maintain a legacy-compat fallback in multiple places, (d) it looks non-idiomatic in PR titles and commit messages.
- `#<N>-<slug>`: `#` is legal in git but fragile in shells. Rejected earlier.
- `issue-<N>-<slug>`: verbose, every branch grows 6 chars. Rejected.
- High-offset sequential (manual starts at 9000+): arbitrary boundary, leaks into unrelated spec names. Rejected.

## Decision 2: Branch detection in `create-new-feature.sh`

**Decision**: Derive the spec-directory prefix from the currently checked-out branch when that branch matches `^[0-9]+-.+$` or `^[0-9]{8}-[0-9]{6}-.+$`. Reuse the current branch verbatim (no `git checkout -b`) when a match is found. Only when the current branch is a non-matching name (e.g. `main`, `feature/foo`) does the sequential-increment path run.

**Rationale**: The branch name is the source of truth — the worktree script has already created it. Detecting from HEAD means no extra flag is needed from the Claude command template; behaviour is identical whether `/speckit.specify` is invoked via kickoff prompt or manually.

**Implementation note**: Order regex checks — timestamp (`^[0-9]{8}-[0-9]{6}-`) first, then general sequential (`^[0-9]+-`). Otherwise the latter would greedily consume a timestamp's first digit-run.

**Alternatives**: add a new `--issue <N>` flag — couples the SpecKit helper to the Claude prompt and breaks if the flag is forgotten. Rejected.

## Decision 3: Collision handling — loud, never silent

**Decision**:

| Case | Behaviour |
|---|---|
| Target branch == current HEAD | Silent reuse. No `git checkout -b`. |
| Target branch exists, not current HEAD | Exit 1 with an error naming the conflict. |
| `specs/<target>/` missing or `spec.md` empty | Create / overwrite template into `spec.md`. |
| `specs/<target>/spec.md` non-empty | Exit 1 with an error naming the directory. |
| Invalid `--number` (non-numeric, 0, negative) | Exit 1 before any mutation. |

**Rationale**: The original bug was a silent renumbering. The replacement contract is "loud failure over silent wrong behaviour." Reuse of a matching HEAD is the expected case for worktree spawns. Non-empty `spec.md` is authored content and must never be overwritten.

## Decision 4: `common.sh` helpers widened to `^[0-9]+-`

**Decision**: Three functions in `.specify/scripts/bash/common.sh` change their sequential-prefix regex from `^[0-9]{3}-` to `^[0-9]+-` so any-width issue numbers resolve correctly downstream.

- `find_feature_dir_by_prefix()` — extracts the prefix from branch name to glob `specs/<prefix>-*`. With `^[0-9]+-`, issue `#7` yields prefix `7` and globs `specs/7-*`; issue `#12345` yields `12345`. Timestamp branch still takes precedence (more specific regex).
- `check_feature_branch()` — accepts `^[0-9]+-` alongside the existing timestamp pattern. Error message updated.
- `get_current_branch()` — non-git fallback scanner accepts the wider pattern when ranking "latest" spec dir.

**Rationale**: Without this widening, `/speckit.plan`, `/speckit.tasks`, and `/speckit.implement` (all of which call `get_feature_paths` → `find_feature_dir_by_prefix`) fail for issue numbers outside the 3-digit range. The regex change is a strict superset of the old behaviour (every 3-digit match still matches), so no regression.

## Decision 5: `claude-worktree.sh` is unchanged

**Decision**: `scripts/claude-worktree.sh` already creates `forkprint-<N>-<slug>/` worktrees and `<N>-<slug>` branches. The earlier `gh<N>-` attempt is reverted. No change to the awk lookup patterns in `--cleanup-merged`, `--remove`, `--approve-spec`, `--revise-spec` — they already match `-<issue>-` in worktree paths, which is exactly what the script produces.

**Rationale**: Simplest possible fix. The misalignment was never in `claude-worktree.sh` — the worktree script always used the issue number correctly. The bug was in `create-new-feature.sh` renumbering on top of it.

## Decision 6: Input validation for `--number`

**Decision**: `--number` input must satisfy `^[0-9]+$` AND decode to ≥ 1 in base 10. Validated before any filesystem or git mutation.

**Rationale**: Without validation, `printf "%03d"` accepts garbage. The validator rejects non-numeric, zero, negative, and leading-zero-only forms that decode to 0. Fails fast with a specific error message.

## Decision 7: Rare-collision resolution path is user-visible

**Decision**: Document the rare case explicitly: if manual sequential claims slot N just before issue #N is filed, `/speckit.specify` for the issue will hit the branch-or-spec-dir collision and exit 1. Resolution: maintainer renames the old directory/branch, or picks a different issue number. This is an accepted tradeoff for staying on the standard convention.

**Rationale**: Being explicit about the rare case in the spec assumptions + docs means no surprises. The user knows the failure mode and how to resolve it. Silent wrong behavior was the original bug — a loud error that a human handles once in a blue moon is strictly better.

## Out of scope (confirmed)

- Renaming existing spec directories (`001-*` through `229-*`, `128-licensing-compliance`, this feature's `249-…`): historical, immutable.
- Automated tests for bash scripts: no harness in this repo.
- Changes to analyzer, UI, API, or product surface.
- Changes to `claude-worktree.sh` beyond what was needed for this fix (the script already handled naming correctly).
