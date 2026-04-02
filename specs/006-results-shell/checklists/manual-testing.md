# Manual Testing Checklist: Results Shell (P1-F15)

**Purpose**: Verify shell behaviour manually before PR submission  
**Feature**: [spec.md](../spec.md)

## Setup

- [x] Run `npm run dev` and confirm the app starts
- [x] Open `http://localhost:3000` in a browser

## US1 — Submit once, navigate views

- [x] Submit one valid public repository and confirm analysis completes once
- [x] Switch between tabs after analysis and confirm no new analysis request is triggered
- [x] Confirm the analysis panel remains available while switching tabs

## US2 — Header and structure

- [x] Confirm the header/banner is visible and intentional on desktop
- [x] Confirm the GitHub repo link is visible in the top-right area of the header on desktop
- [x] Confirm the header, link, and analysis panel remain usable on a narrow/mobile viewport

## US3 — Tabs and placeholders

- [ ] Confirm tabs exist for `Overview`, `Contributors`, `Metrics`, `Responsiveness`, and `Comparison`
- [ ] Confirm implemented tabs show meaningful content
- [ ] Confirm placeholder tabs show intentional placeholder or coming-soon content rather than empty space

## Notes

_Sign off below when all items are verified:_

**Tested by**: Arun Gupta  **Date**: 2026-03-31
