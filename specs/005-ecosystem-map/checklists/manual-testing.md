# Manual Testing Checklist: Ecosystem Map (P1-F05)

**Purpose**: Verify ecosystem-map behaviour manually before PR submission  
**Feature**: [spec.md](../spec.md)

## Setup

- [ ] Confirm an available token source exists (`.env.local` with `GITHUB_TOKEN` or a valid PAT entered in the UI)
- [ ] Run `npm run dev` and confirm the app starts
- [ ] Open `http://localhost:3000` in a browser

## US1 — Visible ecosystem metrics

- [ ] Submit one valid public repository and confirm stars, forks, and watchers are visible outside the tooltip
- [ ] Submit multiple valid public repositories and confirm each successful repo has visible stars, forks, and watchers
- [ ] Confirm failed repositories do not produce fabricated visible ecosystem metrics

## US2 — Bubble chart visualization

- [ ] Confirm one successful repo can still render as a useful plotted bubble when ecosystem metrics are available
- [ ] Confirm multiple successful repos render one bubble per successful, plot-eligible repository
- [ ] Confirm the chart uses stars on the X axis, forks on the Y axis, and watchers for bubble size

## US3 — ForkPrint ecosystem classification

- [ ] Confirm multi-repo analyses show ForkPrint ecosystem classifications (`Leaders`, `Buzz`, `Builders`, `Early`) derived from the current successful input set
- [ ] Confirm changing the set of successful repos changes the derived classifications when the medians change
- [ ] Confirm the UI does not present the quadrant labels as official CHAOSS terminology

## US4 — Tooltip and single-repo behavior

- [ ] Confirm tooltip/focus details show repo name, exact stars, exact forks, exact watchers, and classification when available
- [ ] Confirm single-repo analyses explain why classification is skipped
- [ ] Confirm repos with unavailable ecosystem metrics are not plotted with fabricated coordinates or bubble sizes

## Notes

_Sign off below when all items are verified:_

**Tested by**: ____________________  **Date**: ____________________
