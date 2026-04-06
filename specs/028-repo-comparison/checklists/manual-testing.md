# Manual Testing Checklist: Repo Comparison (P1-F06)

## Setup

- [x] Start the dev server (`npm run dev`)
- [x] Have a GitHub PAT available (or use the server token environment)
- [x] Prepare 2–5 GitHub repository slugs with varying activity levels (e.g. `facebook/react`, `ollama/ollama`, `microsoft/typescript`, `sveltejs/svelte`)

---

## Default State

- [x] Opening the app shows all tabs (Overview, Contributors, Activity, Responsiveness, Health Ratios, Comparison) with placeholder messages
- [x] Overview, Contributors, Activity, Responsiveness, and Health Ratios tabs show "Enter repositories and click **Analyze** to get started." before any analysis
- [x] Comparison tab shows "Enter 2 or more repositories and click **Analyze** to get started."
- [x] Comparison tab shows "Enter 2 or more repositories and click **Analyze** to get started."
- [x] No Compare button is present — only **Analyze**

---

## Analyze With 1 Repo

- [x] Enter 1 repo, click **Analyze** → analysis runs, Overview tab is populated
- [x] Comparison tab shows the placeholder (not a comparison table)

---

## Analyze With 2–4 Repos

- [x] Enter exactly 2 repos, click **Analyze** → analysis runs, Overview tab opens
- [x] Switch to **Comparison** tab → comparison table is populated automatically
- [x] First analyzed repo is pre-selected as the anchor in the dropdown
- [x] Each repo appears as a column header in the table
- [x] Non-anchor columns are expanded by default via the **Compare with** checkboxes
- [x] Shared metric rows appear (e.g. Stars, PR Merge Rate, Issue First Response)
- [x] Each non-anchor cell shows a delta string with percentage (e.g. `-76,788 vs anchor (-31.4%)`)
- [x] Anchor cells show "Anchor baseline" with no delta
- [x] Enter exactly 4 repos, click **Analyze** → all 4 appear as columns in the Comparison tab

---

## Analyze With 5+ Repos

- [x] Enter 5 repos, click **Analyze** → analysis runs on all 5
- [x] Comparison tab shows the first 4 repos only (cap enforced silently by the view)
- [x] No error or blocking message prevents the analysis from running

---

## Comparison Controls

- [x] Change the anchor repo via the dropdown → all deltas update immediately, no new network request fires
- [x] Uncheck a repo in **Compare with** → that column disappears from the table
- [x] Re-check the repo in **Compare with** → column reappears
- [x] Uncheck **Show median column** → median column disappears; re-check → it returns
- [x] Click **Sections & attributes** link → sections and attribute checkboxes expand
- [x] Uncheck a section (e.g. **Activity**) → that section's heading and rows disappear
- [x] Re-check the section → rows return
- [x] Uncheck an individual attribute → that row disappears from the table
- [x] When all sections are disabled, a "no rows visible" message appears
- [x] Click **Hide options** → sections and attribute panel collapses

---

## Sorting

- [x] Click a repo column header → rows sort by that repo's value (descending first)
- [x] Click the same header again → order reverses (ascending)
- [x] Click **Median** column header → rows sort by median value

---

## Edge Cases

- [x] Analyze 2 repos where one returns a partial result (some `unavailable` fields) → unavailable cells show `—`, other cells render normally
- [x] Analyze 2 repos, then re-analyze 1 repo → Comparison tab shows placeholder again
- [x] Re-analyze same repos → Comparison tab repopulates correctly
- [x] Rate limit info shown at the bottom of the Comparison tab when available
- [x] Resize viewport to mobile width → table scrolls horizontally without layout breakage

---

## Signoff

| Item | Status | Notes |
|------|--------|-------|
| All automated tests pass (`npm test`) | Pass | 39 files, 189 tests |
| All E2E tests pass (`npx playwright test e2e/comparison.spec.ts`) | Pass | 6/6 passed |
| Manual checklist reviewed | Pass | |
| Reviewed by | arun-gupta | |
