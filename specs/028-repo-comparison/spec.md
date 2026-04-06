# Feature Specification: Repo Comparison

**Feature Branch**: `028-repo-comparison`  
**Created**: 2026-04-06  
**Status**: Draft  
**Input**: User description: "lets start with F06"

## User Scenarios & Testing

### User Story 1 - Compare Repositories Against An Anchor (Priority: P1)

When a user analyzes two or more repositories, they can open a dedicated `Comparison` tab and inspect a single comparison table where one user-selectable anchor repo acts as the baseline for all delta interpretation.

**Why this priority**: This is the core value of the feature. The app already analyzes multiple repositories, but users still need a fast way to compare them directly without jumping between cards and tabs, and an anchor makes the differences much easier to interpret.

**Independent Test**: Analyze at least two repositories successfully, open `Comparison`, and confirm the table renders shared metric rows with one column per repository, defaults the first successful repo to anchor, and shows deltas for the other repositories using only the existing `AnalysisResult[]` payload.

**Acceptance Scenarios**:

1. **Given** two or more repositories have successful analysis results, **When** the user opens `Comparison`, **Then** the app shows a comparison table with repositories as columns, shared metrics as rows, and the first successful repo selected as the default anchor.
2. **Given** only one repository has a successful analysis result, **When** the user views the results shell, **Then** the `Comparison` tab is hidden or disabled and no empty comparison table is shown.
3. **Given** one or more analyzed repositories failed, **When** the user opens `Comparison`, **Then** only successful repositories appear in the comparison table and the failures remain surfaced elsewhere in the results shell.
4. **Given** multiple successful repositories are being compared, **When** the user changes the anchor repo, **Then** all anchor-based comparison messaging updates locally without rerunning analysis.

---

### User Story 2 - Interpret Differences Quickly (Priority: P2)

The comparison table helps users spot meaningful differences by grouping metrics logically and emphasizing anchor-based comparison messaging more strongly than a neutral spreadsheet of raw values.

**Why this priority**: A raw side-by-side table alone is not enough. Users need help seeing what changed materially without losing the underlying numbers.

**Independent Test**: Analyze two or more repositories with visibly different metrics and confirm grouped metric sections, anchor-based delta messages, a median column, and exact raw values appear together without hiding unavailable data.

**Acceptance Scenarios**:

1. **Given** the comparison table is rendered, **When** the user scans it, **Then** metrics are grouped into clear sections covering overview/ecosystem, contributors/sustainability, activity, responsiveness, and health ratios.
2. **Given** a metric differs meaningfully across repositories, **When** the row is rendered, **Then** the table highlights the relative delta versus the anchor more prominently than the raw values while still keeping the exact values visible.
3. **Given** one repository has a metric value and another has no verified value, **When** the row is rendered, **Then** the missing cell shows `—` and the row remains visible instead of being omitted.
4. **Given** the comparison table is rendered, **When** the user reviews a row, **Then** a median column is shown by default across the chosen repos and can be toggled off if the user does not want it.
5. **Given** the comparison table is rendered, **When** the user chooses which attributes to compare, **Then** all supported attributes are selected by default and the view updates locally as attributes are turned on or off.
6. **Given** the comparison table is rendered, **When** the user chooses which sections to compare, **Then** entire sections can be enabled or disabled locally while their contained attributes follow that section visibility.
7. **Given** the comparison table is rendered, **When** the user sorts by a visible comparison column, **Then** the current section view reorders deterministically in ascending or descending order without rerunning analysis.
8. **Given** comparison supports up to four repositories, **When** the user is preparing or reviewing a comparison, **Then** the UI clearly communicates that four repositories is the maximum supported comparison size.

---

### User Story 3 - Reuse Comparison Data For Export And Follow-On Workflows (Priority: P3)

The comparison view produces a stable, structured representation of the compared metrics so the same data can later power export and downstream workflows without recomputing anything.

**Why this priority**: Repo Comparison should not become a one-off UI. The same table structure will need to support export and other feature work later in Phase 1.

**Independent Test**: Build the comparison view-model from existing `AnalysisResult[]` only and verify the structured output is deterministic and serializable without additional API requests.

**Acceptance Scenarios**:

1. **Given** the app has successful analysis results for multiple repositories, **When** the comparison view-model is built, **Then** it is derived entirely from the already-fetched `AnalysisResult[]` data.
2. **Given** the comparison view-model is built, **When** another feature such as export consumes it later, **Then** the structure can be serialized to JSON and Markdown without additional GitHub fetches.

---

### Edge Cases

- What happens when a user analyzes more than four repositories?
- How does the system behave when a whole metric row is `unavailable` for every compared repository?
- What happens when repositories are analyzed in different workflows and only some of them produce successful results?
- How are delta highlights handled for metrics where "higher" is not always better, such as stale issue ratio or response-time duration?
- What happens when the user starts a new analysis while `Comparison` is selected?
- What happens when the anchor repo is removed from the successful result set after a new analysis?
- How is the median column rendered when one or more selected repos are `unavailable` for a metric?

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide a dedicated `Comparison` tab whenever two or more repositories have successful analysis results.
- **FR-002**: The system MUST hide or disable the `Comparison` tab when fewer than two repositories have successful analysis results.
- **FR-003**: The system MUST render comparison metrics as rows and repositories as columns.
- **FR-004**: The system MUST derive the comparison table entirely from the existing `AnalysisResult[]` payload and MUST NOT perform additional API calls for the comparison view.
- **FR-005**: The system MUST include comparison coverage for all currently shipped metric families: overview/ecosystem, contributors/sustainability, activity, responsiveness, and health ratios.
- **FR-006**: The system MUST keep metrics visible even when one or more compared repositories have unavailable values, using `—` for unavailable cells instead of omitting the row.
- **FR-007**: The system MUST group comparison rows into labeled sections so users can scan by domain rather than one long undifferentiated table.
- **FR-007a**: The system MUST treat comparison sections as first-class controls, not just passive headings.
- **FR-008**: The system MUST highlight meaningful deltas or relative distinctions versus a selected anchor repo where they help interpretation, while still keeping the exact raw values visible.
- **FR-009**: The system MUST use deterministic comparison semantics for directional metrics so the UI does not imply that a higher value is always better when that is not true.
- **FR-010**: The system MUST support comparison across two to four successful repositories in a single view.
- **FR-011**: The system MUST remain usable on desktop without forcing page-level horizontal scrolling when comparing two to four repositories.
- **FR-012**: The system MUST expose a stable structured comparison representation that can be reused by later export work without recomputing comparison data.
- **FR-013**: The system MUST reset safely when a new analysis starts so stale comparison content does not persist into the next result set.
- **FR-014**: The system MUST default the anchor repo to the first successful repo in the analyzed input order.
- **FR-015**: The system MUST allow the user to change the anchor repo locally from within the `Comparison` view.
- **FR-016**: The system MUST allow the user to choose which supported comparison attributes are visible, with all supported attributes selected by default.
- **FR-016a**: The system MUST allow the user to enable or disable entire comparison sections locally, with all supported sections enabled by default.
- **FR-016b**: When a comparison section is disabled, the system MUST hide all rows in that section without rerunning analysis.
- **FR-016c**: Attribute-level visibility controls MUST remain scoped to the currently enabled sections.
- **FR-017**: The system MUST include a median column across the currently chosen repositories, visible by default and user-toggleable like other attributes.
- **FR-017a**: The system MUST allow every visible comparison column to be sorted in ascending or descending order.
- **FR-017b**: Sorting MUST be local-only and MUST NOT trigger additional API calls or rerun analysis.
- **FR-017c**: Sorting behavior MUST be deterministic for unavailable values and for directional metrics where lower may be better.
- **FR-018**: The system MUST cap the number of compared repositories at four successful repositories in a single comparison view.
- **FR-018a**: The system MUST clearly communicate the maximum comparison size of four repositories in the relevant input and comparison workflows.
- **FR-018b**: When the user attempts to exceed the four-repository limit, the UI MUST explain why the extra repository is not eligible for comparison.

### Key Entities

- **Comparison Section**: A labeled grouping of related metric rows such as Overview, Contributors, Activity, Responsiveness, or Health Ratios.
- **Comparison Section Set**: The current set of enabled high-level table sections. Defaults to all supported sections enabled.
- **Comparison Row**: A single metric shown across all compared repositories, including label, optional help text, raw display values, anchor-based delta/highlight semantics, and optional median value.
- **Comparison Cell**: The value for one repository in one comparison row, including exact display value and unavailable state when needed.
- **Comparison View Model**: A deterministic, serializable structure derived from `AnalysisResult[]` that powers the rendered comparison UI and later export reuse.
- **Anchor Repo**: The user-selected baseline repository used to interpret deltas for all other compared repositories. Defaults to the first successful repo in the analyzed input order.
- **Comparison Attribute Set**: The current set of metric rows/columns the user has chosen to display. Defaults to all supported attributes selected.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can open `Comparison` after analyzing two or more repositories and see a fully populated side-by-side comparison with a default anchor repo, without rerunning analysis.
- **SC-002**: Every metric shown in the comparison view preserves explicit unavailable states with `—`; no compared metric row disappears only because one repository lacks data.
- **SC-003**: Users can compare any successful set of two to four repositories in the same analysis run without page-level horizontal scrolling on standard desktop widths.
- **SC-004**: The comparison view-model is deterministic from the same `AnalysisResult[]` input and can be serialized for later JSON/Markdown export work without additional GitHub requests.
- **SC-005**: Users can change the anchor repo and visible attribute set locally and see the comparison update without a rerun.
- **SC-006**: Users can enable or disable whole comparison sections locally and see the table update immediately without a rerun.
- **SC-007**: Users can sort any visible comparison column locally in both directions and get stable, predictable ordering.
- **SC-008**: Users can tell from the UI that comparison supports a maximum of four repositories and receive a clear explanation when they try to exceed that limit.

## Assumptions

- Comparison is scoped to repository analysis results, not the org-inventory workflow.
- Existing shipped metric surfaces remain the source of truth for metric definitions; `Comparison` reuses those verified outputs rather than inventing new metrics.
- Anchor-based comparison messaging is the primary interpretation layer, while raw values remain visible as supporting detail.
- Section-level toggles are the primary visibility control, and attribute-level toggles provide finer control within the enabled sections.
- Export buttons or export UX may still be delivered in `P1-F13`, but the comparison data contract should be ready for that later feature.
- Desktop comparison is the primary Phase 1 use case; mobile remains supported but may use denser presentation or stacked sections rather than identical desktop layout.
