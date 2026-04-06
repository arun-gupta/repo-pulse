# Data Model: Repo Comparison

## Comparison Workspace State

- **anchorRepo**
  - Selected baseline repository.
  - Defaults to the first successful repo in analyzed input order.

- **enabledSections**
  - Set of enabled sections.
  - Defaults to all supported sections enabled.

- **enabledAttributes**
  - Set of enabled metric rows within the currently enabled sections.
  - Defaults to all supported attributes enabled.

- **showMedianColumn**
  - Boolean.
  - Defaults to `true`.

- **sortColumnId**
  - Identifier for the active comparison column sort.

- **sortDirection**
  - `asc | desc`

## Comparison Section

- **id**
  - `overview | contributors | activity | responsiveness | health-ratios`
- **label**
  - User-facing section label.
- **description**
  - Short explanation for the section.
- **attributes**
  - Ordered list of supported comparison attributes in the section.

## Comparison Attribute

- **id**
  - Stable identifier for a compared metric.
- **sectionId**
  - Parent section.
- **label**
  - User-facing metric label.
- **helpText**
  - Short explanation/tooltip text.
- **direction**
  - `higher-is-better | lower-is-better | neutral`
- **valueType**
  - `number | percentage | duration | text`

## Comparison Row

- **attributeId**
  - Metric represented by the row.
- **label**
  - Metric label.
- **helpText**
  - Metric explanation.
- **anchorRepo**
  - Repo currently used as the comparison baseline.
- **anchorValue**
  - Exact value for the anchor repo, or `unavailable`.
- **medianValue**
  - Median across currently compared repos for the row, or `unavailable`.
- **cells**
  - One cell per compared repo.

## Comparison Cell

- **repo**
  - Repository slug.
- **rawValue**
  - Exact value from `AnalysisResult`, derived metric, or `unavailable`.
- **displayValue**
  - User-facing formatted value.
- **deltaFromAnchor**
  - Numeric or descriptive difference from the anchor when applicable.
- **deltaDisplay**
  - User-facing interpretation relative to the anchor.
- **status**
  - `better | worse | same | neutral | unavailable`

## Source Inputs

Comparison rows are derived from existing shipped metrics in `AnalysisResult[]`, including:

- overview/ecosystem signals
- contributor and sustainability signals
- activity metrics
- responsiveness metrics
- health ratios

No additional GitHub fetches are introduced for this feature.
