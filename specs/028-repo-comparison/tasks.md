# Tasks: Repo Comparison

## Phase 1 — Foundations

- [ ] T001 Add focused tests for anchor selection, section visibility, attribute visibility, median calculation, and sorting in `/Users/arungupta/workspaces/forkprint/lib/comparison/view-model.test.ts`
- [ ] T002 Add integration tests for the `Comparison` tab visibility and placeholder replacement in `/Users/arungupta/workspaces/forkprint/components/repo-input/RepoInputClient.test.tsx` and `/Users/arungupta/workspaces/forkprint/components/app-shell/ResultsShell.test.tsx`
- [ ] T003 Add UI tests for `ComparisonView` controls and grouped table rendering in `/Users/arungupta/workspaces/forkprint/components/comparison/ComparisonView.test.tsx`

## Phase 2 — Shared Comparison Logic

- [ ] T004 Create `/Users/arungupta/workspaces/forkprint/lib/comparison/sections.ts` with section and attribute definitions
- [ ] T005 Create `/Users/arungupta/workspaces/forkprint/lib/comparison/view-model.ts` for anchor selection, delta shaping, median values, unavailable handling, and local sorting
- [ ] T006 Ensure deterministic 4-repo cap behavior and clear cap messaging helpers in shared comparison logic

## Phase 3 — Comparison UI

- [ ] T007 Create `/Users/arungupta/workspaces/forkprint/components/comparison/ComparisonControls.tsx`
- [ ] T008 Create `/Users/arungupta/workspaces/forkprint/components/comparison/ComparisonTable.tsx`
- [ ] T009 Create `/Users/arungupta/workspaces/forkprint/components/comparison/ComparisonView.tsx`
- [ ] T010 Replace the placeholder comparison content in `/Users/arungupta/workspaces/forkprint/components/repo-input/RepoInputClient.tsx`
- [ ] T011 Update `/Users/arungupta/workspaces/forkprint/lib/results-shell/tabs.ts` so `Comparison` is marked implemented

## Phase 4 — Verification

- [ ] T012 Add browser coverage in `/Users/arungupta/workspaces/forkprint/e2e/comparison.spec.ts`
- [ ] T013 Create `/Users/arungupta/workspaces/forkprint/specs/028-repo-comparison/checklists/manual-testing.md`
- [ ] T014 Update docs if needed in `/Users/arungupta/workspaces/forkprint/README.md`, `/Users/arungupta/workspaces/forkprint/docs/PRODUCT.md`, and `/Users/arungupta/workspaces/forkprint/docs/DEVELOPMENT.md`
- [ ] T015 Run `npm test`
- [ ] T016 Run `npm run lint`
- [ ] T017 Run `npm run build`
