# Tasks: Org-Level Repo Inventory (P1-F16)

**Branch**: `016-org-inventory`  
**Input**: `specs/016-org-inventory/` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md)  
**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required. The constitution requires TDD, so tests and verification tasks MUST be defined before implementation is considered complete.

## Phase 1: Setup

- [ ] T001 Review `/Users/arungupta/workspaces/forkprint/components/repo-input/RepoInputClient.tsx`, `/Users/arungupta/workspaces/forkprint/components/repo-input/RepoInputForm.tsx`, and `/Users/arungupta/workspaces/forkprint/lib/analyzer` touchpoints for org inventory integration
- [ ] T002 Review existing rate-limit and token-handling behavior for reuse in the new org inventory flow

## Phase 2: Foundations

- [ ] T003 Create `/Users/arungupta/workspaces/forkprint/lib/config/org-inventory.ts` for default/max bulk-selection limits
- [ ] T004 Create `/Users/arungupta/workspaces/forkprint/lib/analyzer/org-inventory.ts` for lightweight org inventory shaping
- [ ] T005 Create `/Users/arungupta/workspaces/forkprint/lib/org-inventory/filters.ts` for filtering, sort, and selection-limit helpers
- [ ] T006 Create `/Users/arungupta/workspaces/forkprint/lib/org-inventory/summary.ts` for org-level rollup calculations
- [ ] T007 Add focused tests for the new config/filter/summary helpers

## Phase 3: User Story 1 - Browse an org's public repositories (P1)

- [ ] T008 Add integration tests for submitting an org and rendering inventory results
- [ ] T009 Add analyzer/API tests for valid, invalid, empty, and rate-limited org responses
- [ ] T010 Implement `/Users/arungupta/workspaces/forkprint/app/api/analyze-org/route.ts`
- [ ] T011 Implement `/Users/arungupta/workspaces/forkprint/components/org-inventory/OrgInventorySummary.tsx`
- [ ] T012 Implement `/Users/arungupta/workspaces/forkprint/components/org-inventory/OrgInventoryTable.tsx`
- [ ] T013 Implement `/Users/arungupta/workspaces/forkprint/components/org-inventory/OrgInventoryView.tsx`
- [ ] T014 Wire org inventory submission and rendering into `/Users/arungupta/workspaces/forkprint/components/repo-input/RepoInputClient.tsx`

## Phase 4: User Story 2 - Narrow and sort the inventory (P1)

- [ ] T015 Add tests for local filtering and asc/desc sorting on every visible column
- [ ] T016 Implement repo-name, language, and archived filters
- [ ] T017 Implement asc/desc sorting across every visible inventory column

## Phase 5: User Story 3 - Drill into repo analysis from the inventory (P2)

- [ ] T018 Add tests for row-level analyze actions and bulk `Analyze selected`
- [ ] T019 Implement slider-controlled bulk-selection limit UI
- [ ] T020 Implement selection-cap enforcement using shared config
- [ ] T021 Reuse the existing repo-analysis flow for row-level and bulk handoff

## Phase 6: User Story 4 - Trust empty and error states (P2)

- [ ] T022 Add tests for invalid org, empty org, and rate-limit surfaces
- [ ] T023 Implement explicit empty/error/rate-limit states in the org inventory UI
- [ ] T024 Ensure missing row values render explicitly without fabricated substitutions

## Phase 7: Polish & Closeout

- [ ] T025 Add Playwright coverage in `/Users/arungupta/workspaces/forkprint/e2e/org-inventory.spec.ts`
- [ ] T026 Create and complete `/Users/arungupta/workspaces/forkprint/specs/016-org-inventory/checklists/manual-testing.md`
- [ ] T027 Run `npm test`
- [ ] T028 Run `npm run lint`
- [ ] T029 Run `npm run build`
- [ ] T030 Run `npm run test:e2e -- e2e/org-inventory.spec.ts`
- [ ] T031 Update `/Users/arungupta/workspaces/forkprint/README.md`, `/Users/arungupta/workspaces/forkprint/docs/PRODUCT.md`, and `/Users/arungupta/workspaces/forkprint/docs/DEVELOPMENT.md` if needed
