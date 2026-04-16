# Phase 1 Data Model: Naming grammar

No runtime data structures. The "model" is the grammar of the three filesystem/git entities that must agree.

## Entity grammars

### Feature triple

```
worktree-dir  := "forkprint-" prefix "-" slug
branch        := prefix "-" slug
spec-dir      := "specs/" prefix "-" slug

prefix        := sequential | timestamp
sequential    := [0-9]+                                     ; issue number or legacy padded
timestamp     := [0-9]{8} "-" [0-9]{6}                      ; YYYYMMDD-HHMMSS
slug          := [a-z0-9] ([a-z0-9-]* [a-z0-9])?            ; kebab-case, 1-40 chars
```

All three entities for a single feature share the same `prefix` and same `slug`.

Examples:
- Issue-driven (new): `forkprint-238-align-numbering`, `238-align-numbering`, `specs/238-align-numbering/`
- Legacy sequential (unchanged): `015-responsiveness`, `specs/015-responsiveness/` (worktree-dir not applicable)
- Timestamp (opt-in, unchanged): `20260416-143022-exploratory`, `specs/20260416-143022-exploratory/`

## Why one `sequential` grammar for both issue-driven and manual

Both paths produce the same shape: `<digits>-<slug>`. The distinction is where `<digits>` comes from:

| Source | Digits |
|---|---|
| `scripts/claude-worktree.sh <N>` | The GitHub issue number (`<N>` as passed, any width) |
| `/speckit.specify` manual (sequential mode) | Next free `max+1` across existing `specs/` and branches, zero-padded to 3 digits for legacy readability |

They share a namespace — collisions are possible in principle but rare in practice, and handled by the loud-error contract (see contracts/cli-contracts.md).

## Validation rules

1. **Issue / `--number` input**: positive integer (`^[0-9]+$` AND decodes to ≥ 1). Validated up front.
2. **Slug input**: `[a-z0-9-]+`, 1-40 chars, no leading/trailing hyphens. Enforced by existing `clean_branch_name` logic in `create-new-feature.sh` and the slug derivation in `claude-worktree.sh`.
3. **Prefix derivation from current HEAD**: if `^[0-9]{8}-[0-9]{6}-` or `^[0-9]+-`, extract the full prefix literally. Otherwise use sequential fallback.
4. **Prefix-to-spec-dir consistency**: spec directory name must equal branch name (same prefix, same slug) for `find_feature_dir_by_prefix()` to resolve without ambiguity. Enforced by the branch-reuse path (spec dir derived from branch) and the creation path (branch derived from spec dir target).

## State transitions

None. Entities are created once per feature and do not change state during a feature's lifetime.
