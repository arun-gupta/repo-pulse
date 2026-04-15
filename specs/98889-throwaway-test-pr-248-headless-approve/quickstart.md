# Quickstart: Throwaway Test PR #248 Headless Approve

**Date**: 2026-04-15

## Overview

This throwaway feature validates the headless SpecKit lifecycle: spawn → specify → pause → approve-spec → plan → tasks → implement → PR.

## How to verify

1. Check that the PR exists and contains the spec artifacts under `specs/98889-throwaway-test-pr-248-headless-approve/`.
2. Confirm the PR body includes a `## Test plan` section.
3. Verify `placeholder.md` exists in the spec directory — this proves the implement step ran.

## Cleanup

After verifying, use `scripts/claude-worktree.sh --cleanup-merged <issue>` (post-merge) or `scripts/claude-worktree.sh --remove <issue>` (to discard).
