# Manual Testing Checklist: Export (P1-F13)

## Setup

- [ ] Dev server running (`npm run dev`)
- [ ] Signed in with GitHub OAuth
- [ ] At least one analysis completed

---

## JSON Export

- [ ] "Download JSON" button appears above the result tabs after analysis
- [ ] "Download JSON" button is disabled (or absent) before analysis
- [ ] Clicking "Download JSON" downloads a file named `repopulse-YYYY-MM-DD-HHmmss.json`
- [ ] Downloaded JSON contains `results`, `failures`, and `rateLimit` keys
- [ ] All analyzed repos appear in the `results` array
- [ ] `"unavailable"` fields are preserved as the string `"unavailable"` (not null or 0)
- [ ] Downloading multiple times produces files with different timestamps

---

## Markdown Export

- [ ] "Download Markdown" button appears above the result tabs after analysis
- [ ] Clicking "Download Markdown" downloads a file named `repopulse-YYYY-MM-DD-HHmmss.md`
- [ ] Report has a top-level heading and generated timestamp
- [ ] One `##` section per analyzed repo
- [ ] Each section includes Activity, Sustainability, and Responsiveness scores
- [ ] `"unavailable"` fields appear as `N/A` in the report
- [ ] Multiple repos each have their own section in the same file

---

## Shareable URL

- [ ] "Copy link" button appears above the result tabs
- [ ] Clicking "Copy link" copies the URL to the clipboard
- [ ] Copied URL contains `?repos=owner/repo1,owner/repo2` (comma-separated)
- [ ] Copied URL does NOT contain the OAuth token
- [ ] Pasting the URL in a new tab pre-populates the repo input textarea
- [ ] After pre-population, the user can sign in and run analysis independently
- [ ] When clipboard API is unavailable, a fallback text field appears with the URL

---

## Signoff

| Item | Status | Notes |
|------|--------|-------|
| All automated tests pass (`npm test`) | | |
| All E2E tests pass (`npx playwright test e2e/export.spec.ts`) | | |
| Manual checklist reviewed | | |
| Reviewed by | | |
