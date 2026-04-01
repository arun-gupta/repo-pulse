# Feature Specification: Contributors

**Feature Branch**: `012-contributors`  
**Created**: 2026-04-01  
**Status**: Draft  
**Input**: User description: "P1-F09 Contributors"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inspect core contributor metrics in the Contributors tab (Priority: P1)

A user can open the `Contributors` tab after analysis and see a dedicated contributor-health view for each successfully analyzed repository.

**Why this priority**: This is the most natural next detail surface after the Overview card, and it gives the `Contributors` tab a concrete purpose instead of leaving contributor detail scattered across the product.

**Independent Test**: Can be fully tested by supplying one or more successful `AnalysisResult` objects and confirming the `Contributors` tab renders contribution metrics for each successful repository without triggering another analysis request.

**Acceptance Scenarios**:

1. **Given** one successful repository has been analyzed, **When** the user opens the `Contributors` tab, **Then** the tab shows a `Core` pane for that repository with the core contributor metrics.
2. **Given** multiple successful repositories have been analyzed, **When** the user opens the `Contributors` tab, **Then** each successful repository appears with its own contributor content and failed repositories do not create fabricated views.
3. **Given** the user switches between `Overview` and `Contributors`, **When** they view the contributor content, **Then** no new analysis request or extra API call is triggered.

---

### User Story 2 - Understand the Sustainability pane and contributor distribution (Priority: P1)

A user can see a real Sustainability score for each successful repository and understand the contributor-distribution signals that produced it.

**Why this priority**: The Overview card already reserves a Sustainability badge, so `P1-F09` needs to replace the current placeholder with a real score and supporting evidence.

**Independent Test**: Can be fully tested by rendering repositories with known contribution distributions and confirming the computed score and supporting contributor metrics match the config-driven rules within the `Sustainability` pane.

**Acceptance Scenarios**:

1. **Given** a repository has sufficient verified contribution data, **When** the user views its card or the `Sustainability` pane inside `Contributors`, **Then** the Sustainability badge shows `High`, `Medium`, or `Low`.
2. **Given** a repository does not have sufficient verified contribution data, **When** the score is computed, **Then** the UI shows `Insufficient verified public data` instead of a guessed score.
3. **Given** a Sustainability score is visible, **When** the user asks how it was scored, **Then** the UI exposes a tooltip or equivalent help surface describing the thresholds from shared config.
4. **Given** contributor-distribution data is available, **When** the user views the `Core` and `Sustainability` panes inside `Contributors`, **Then** the UI shows the implemented core contributor metrics and does not imply that the placeholder sustainability signals have already been computed.

---

### User Story 3 - See later sustainability signals reserved clearly without fabricated data (Priority: P2)

A user can see that broader sustainability signals are planned for this tab without the UI inventing unsupported values before those signals are fully implemented.

**Why this priority**: This preserves the intended information architecture for Sustainability while keeping the first implementation slice focused on the core contributor stats and score.

**Independent Test**: Can be fully tested by rendering the `Contributors` tab and confirming it shows the implemented `Core` pane plus a clearly labeled placeholder area in the `Sustainability` pane for later sustainability signals without fabricated values.

**Acceptance Scenarios**:

1. **Given** the user opens the `Contributors` tab, **When** broader sustainability signals are not yet implemented, **Then** the `Sustainability` pane shows a clearly labeled placeholder for later signals rather than invented values.
2. **Given** a repository lacks data for those later sustainability signals, **When** the user views the placeholder area, **Then** the UI does not imply that maintainer, organization, or contribution-type values have already been computed.
3. **Given** future sustainability signals such as maintainer count, organizational diversity, Elephant Factor, occasional contributors, inactive contributors, or types of contributions are planned, **When** the user views the placeholder area, **Then** the UI makes clear that those signals will land later in `P1-F09`.

### Edge Cases

- What happens when a repository has no successful analysis result but the `Contributors` tab is opened?
- What happens when contributor counts exist but commit distribution data is unavailable?
- What happens when the number of active contributors is very small and concentration metrics would be misleading without enough underlying data?
- What happens when the placeholder section is visible but the advanced sustainability signals are not yet implemented?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST populate the `Contributors` tab with contributor-health content for successful repositories.
- **FR-002**: The `Contributors` tab MUST expose a `Core` pane that surfaces the following exact core metrics per successful repository when publicly verifiable: total contributors, active contributors in last 90d, contribution concentration, repeat contributors, and new contributors in last 90d.
- **FR-003**: The `Core` pane MAY frame active contributors as committers when that framing is derived from the same verified public data, but it MUST NOT introduce a second incompatible contributor definition in the initial implementation.
- **FR-003a**: The `Contributors` tab MUST expose a `Sustainability` pane for the Sustainability score, scoring explanation, missing-data callouts, and later sustainability signals.
- **FR-004**: Contribution concentration MUST be computed as the share of commits attributable to the top 20% of contributors only when the required verified author-distribution data exists, with room for a later Lorenz/Gini-based implementation that preserves the same user-facing metric slot.
- **FR-005**: The system MUST compute a Sustainability score of `High`, `Medium`, or `Low` using shared config-driven thresholds and the approved contribution-dynamics logic.
- **FR-006**: When insufficient verified contribution data exists, the Sustainability score MUST be the literal string `Insufficient verified public data`.
- **FR-007**: The Sustainability score label MUST remain visible on the repo summary card and MUST update from the current placeholder state when real scoring is available.
- **FR-007a**: The Sustainability score presentation MUST include the user-facing CHAOSS-aligned dimension label alongside the score in the UI.
- **FR-008**: The UI MUST expose a "how is this scored?" help surface for Sustainability thresholds without requiring another analysis request.
- **FR-009**: Unavailable contribution metrics and unavailable derived values MUST remain explicit in the `Contributors` tab and MUST NOT be hidden, zeroed, or guessed.
- **FR-009a**: The `Sustainability` pane MUST provide a per-repository missing-data callout panel that lists unavailable contribution fields affecting the rendered pane content or Sustainability score.
- **FR-010**: The `Sustainability` pane MUST include a clearly labeled placeholder area for later sustainability signals such as maintainer count, inactive contributors, occasional contributors, no contributions in the last 6 months, types of contributions, new vs. returning contributor ratio per release cycle, organizational diversity, unique employer/org count among contributors, single-vendor dependency ratio, and Elephant Factor.
- **FR-011**: The placeholder area MUST NOT display fabricated or provisional values for those later sustainability signals.
- **FR-012**: The feature MUST reuse the existing `AnalysisResult[]` analysis payload for rendering and MUST NOT introduce a second fetch path for sustainability detail.

### Key Entities

- **Contributors View**: The `Contributors` tab surface that renders one repository’s `Core` and `Sustainability` panes.
- **Core Contributor Metrics**: The initial `P1-F09` metric set consisting of total contributors, active contributors, contribution concentration, repeat contributors, and new contributors, with contribution concentration retaining a stable user-facing slot even if the underlying distribution method becomes more rigorous later.
- **Sustainability Pane**: The pane inside `Contributors` that renders the config-driven Sustainability score, related explanation surfaces, missing-data callout, and placeholder area for later sustainability signals.
- **Sustainability Signals Placeholder**: A clearly labeled UI area inside the `Sustainability` pane reserving space for later maintainership, organization, and contribution-pattern signals such as release-cycle contributor ratios and organization-concentration measures that are planned but not yet implemented in the first `P1-F09` slice.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For analyses with one or more successful repositories, 100% of successful repositories render contributor content in the `Contributors` tab.
- **SC-002**: For repositories with sufficient verified contribution data, 100% of rendered Sustainability badges show `High`, `Medium`, or `Low` instead of `Not scored yet`.
- **SC-003**: For repositories with insufficient verified contribution data, 100% of rendered Sustainability scores show `Insufficient verified public data`.
- **SC-004**: In 100% of tested placeholder scenarios, the tab reserves space for later sustainability signals without displaying fabricated values for them.

## Assumptions

- The `Contributors` tab is the intended home for `P1-F09`, with `Core` and `Sustainability` panes replacing the earlier split between a feature name and a top-level `Sustainability` tab.
- `AnalysisResult` may need to grow to support the core contributor metrics and score inputs required by the first `P1-F09` slice, but the analyzer contract remains the single source of truth.
- Threshold help may initially be delivered as lightweight inline UI or a tooltip, as long as it is clear and sourced from shared config.
- The later sustainability signals reserved by the placeholder area will be implemented inside `P1-F09`, but they are not part of the first required metric slice defined by this draft.
