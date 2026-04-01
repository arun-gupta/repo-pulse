# UI Contract: Ecosystem Map

## Inputs

- Uses `AnalyzeResponse.results` from the existing client analysis state
- Uses no new API calls

## Required UI States

### No successful repos

- The ecosystem map section is hidden or replaced with a concise empty-state message
- Failed repositories remain displayed by earlier feature behavior

### Single successful repo

- Visible stars, forks, and watchers are shown for the repo
- The repo may still appear on the bubble chart if stars, forks, and watchers are all available
- A note explains that ForkPrint ecosystem classification is skipped because at least two successful repositories are required

### Multiple successful repos

- Visible stars, forks, and watchers are shown for each successful repo
- Plot one bubble per plot-eligible successful repo
- Show ForkPrint ecosystem classification labels derived from the median split

## Tooltip Content

- Repo name
- Exact stars
- Exact forks
- Exact watchers
- ForkPrint ecosystem classification when available

## Unavailable Ecosystem Metrics

- If stars, forks, or watchers are `"unavailable"`, the visible metric row keeps the `"unavailable"` value explicit
- The chart does not invent a coordinate or bubble size for that repo
- The UI provides a concise note that the repo could not be plotted because ecosystem metrics were incomplete
