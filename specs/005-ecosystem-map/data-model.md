# Data Model: Ecosystem Map

## Entities

### EcosystemBubble

- **Purpose**: Represents one successful repository as plotted chart data plus visible ecosystem metrics
- **Fields**:
  - `repo: string`
  - `stars: number | "unavailable"`
  - `forks: number | "unavailable"`
  - `watchers: number | "unavailable"`
  - `classification: "Leaders" | "Buzz" | "Builders" | "Early" | null`
  - `isPlotEligible: boolean`
  - `missingEcosystemMetrics: Array<"stars" | "forks" | "watchers">`

### QuadrantBoundarySet

- **Purpose**: Represents the current median-derived split values for classifying the successful input set
- **Fields**:
  - `starMedian: number | null`
  - `forkMedian: number | null`
  - `classificationEnabled: boolean`
  - `classificationReason: string | null`

### VisibleMetricRow

- **Purpose**: User-visible summary of ecosystem metrics that remains readable without chart hover
- **Fields**:
  - `repo: string`
  - `starsLabel: string`
  - `forksLabel: string`
  - `watchersLabel: string`
  - `classificationLabel: string | null`
  - `plotStatusNote: string | null`

### SingleRepoNotice

- **Purpose**: Explains why quadrant classification is skipped for exactly one successful repository
- **Fields**:
  - `isVisible: boolean`
  - `message: string`

## Relationships

- One `AnalyzeResponse.results[]` entry can produce:
  - one `EcosystemBubble`
  - one `VisibleMetricRow`
- One analysis run produces:
  - zero or one `QuadrantBoundarySet`
  - zero or one `SingleRepoNotice`

## Validation Rules

- `classificationEnabled` is `false` when fewer than two successful, plot-eligible repositories are present
- `isPlotEligible` is `true` only when stars, forks, and watchers are all verified numbers
- `classification` is `null` when classification is skipped or the repo is not plot-eligible
- `missingEcosystemMetrics` is populated from `"unavailable"` ecosystem values and never inferred
