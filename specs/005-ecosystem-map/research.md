# Research: Ecosystem Map

## Decision 1: Use Chart.js bubble charts via `react-chartjs-2`

- **Decision**: Implement the visualization with Chart.js bubble charts and a thin React wrapper using `react-chartjs-2`.
- **Rationale**: The constitution already approves Chart.js for Phase 1, and bubble charts natively support X/Y/size encoding for stars, forks, and watchers.
- **Alternatives considered**:
  - Plain HTML/CSS scatter approximation: rejected because tooltips, scaling, and bubble sizing would become custom rendering work
  - SVG/D3-first implementation: rejected because it adds more implementation surface than this feature needs

## Decision 2: Keep visible ecosystem metrics outside the chart

- **Decision**: Show stars, forks, and watchers as visible text UI for each successful repo in addition to the plotted bubble.
- **Rationale**: This preserves value for single-repo analysis, improves accessibility, and prevents the chart from being the only place users can inspect key metrics.
- **Alternatives considered**:
  - Tooltip-only metrics: rejected because it is weaker for accessibility and single-repo use
  - Separate card system: rejected because detailed repo cards belong to `P1-F07`

## Decision 3: Keep quadrant as ForkPrint ecosystem classification

- **Decision**: Present `Leaders / Buzz / Builders / Early` as ForkPrint’s ecosystem classification aligned to the CHAOSS ecosystem category.
- **Rationale**: The product and constitution define this mapping for ForkPrint, but the labels are not official CHAOSS terminology.
- **Alternatives considered**:
  - Label quadrant as an official CHAOSS score: rejected because it overstates the provenance of the labels
  - Remove the labels entirely: rejected because the product definition explicitly uses them

## Decision 4: Treat single-repo analysis as plotted but unclassified

- **Decision**: Render the single repository bubble and visible metrics, but skip quadrant classification and show an explanatory note.
- **Rationale**: The constitution forbids assigning a quadrant to a one-repo input set, but the chart still provides value as a visualized point.
- **Alternatives considered**:
  - Hide the chart for one repo: rejected because it wastes useful ecosystem data
  - Assign a default quadrant: rejected by constitution

## Decision 5: Exclude unavailable ecosystem metrics from plotted coordinates

- **Decision**: If a successful repository has `"unavailable"` for stars, forks, or watchers, do not fabricate chart coordinates or bubble size; instead, keep the visible metrics honest and surface an explanatory state.
- **Rationale**: The accuracy policy forbids invented precision, and chart coordinates are themselves a form of derived display data.
- **Alternatives considered**:
  - Convert `"unavailable"` to zero: rejected because it fabricates a false position
  - Drop the repo silently: rejected because missing data must stay explicit
