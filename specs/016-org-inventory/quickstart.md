# Quickstart: Org-Level Repo Inventory (P1-F16)

## Goal

Verify that a user can submit a GitHub org, browse the public repo inventory, sort/filter it locally, and launch single-repo or multi-repo analysis from the selected rows.

## Manual Smoke Flow

1. Run `npm run dev`
2. Open `http://localhost:3000`
3. Provide a valid token source if prompted
4. Submit a public org slug or URL
5. Confirm the org summary area and repo inventory table render
6. Sort multiple columns ascending and descending
7. Filter by repo name, language, and archived status
8. Adjust the bulk-selection slider
9. Select one repo and trigger `Analyze repo`
10. Select multiple repos within the slider limit and trigger `Analyze selected`
11. Confirm the existing repo-analysis flow opens with the expected repos

## Verification Commands

```bash
npm test
npm run lint
npm run build
npm run test:e2e -- e2e/org-inventory.spec.ts
```
