# Quickstart: Ecosystem Map

## Goal

Verify that successful analysis results now render visible ecosystem metrics and the first bubble-chart visualization without additional fetching.

## Scenarios

### 1. Single successful repo

1. Run `npm run dev`
2. Analyze one public repository with a valid token source
3. Confirm:
   - stars, forks, and watchers are visible outside the tooltip
   - the repo is plotted if all ecosystem metrics are available
   - the UI explains that ForkPrint ecosystem classification is skipped for one successful repo

### 2. Multiple successful repos

1. Analyze two or more public repositories
2. Confirm:
   - each successful repo has visible ecosystem metrics
   - each successful, plot-eligible repo appears as a bubble
   - ForkPrint ecosystem classification is shown using the median split of the current successful input set

### 3. Incomplete ecosystem metrics

1. Simulate or mock a successful result with `"unavailable"` for stars, forks, or watchers
2. Confirm:
   - the visible metric row keeps `"unavailable"` explicit
   - the chart does not fabricate a plotted position for that repo
   - the UI explains why the repo could not be plotted
