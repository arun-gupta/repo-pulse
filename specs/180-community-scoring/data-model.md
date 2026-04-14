# Phase 1 Data Model: Community Scoring

**Feature**: P2-F05 — Community scoring
**Prerequisite**: `research.md`

This document lists the new and extended data shapes this feature introduces. All TypeScript types live under `lib/analyzer/analysis-result.ts` unless otherwise noted.

---

## New fields on `AnalysisResult`

Extend the existing `AnalysisResult` shape with the following fields. All net-new signals follow Constitution §II: detected-or-`unavailable`, never estimated.

| Field | Type | Description | Source |
|---|---|---|---|
| `hasIssueTemplates` | `boolean \| 'unavailable'` | True if `.github/ISSUE_TEMPLATE/` contains at least one `.md`/`.yml` or a legacy `ISSUE_TEMPLATE.md` exists in root / `.github/` | GraphQL `repository.object(expression:...)` for dir listing + file presence check |
| `hasPullRequestTemplate` | `boolean \| 'unavailable'` | True if `PULL_REQUEST_TEMPLATE.md` exists in `.github/`, repo root, or `docs/` | GraphQL file presence check |
| `hasFundingConfig` | `boolean \| 'unavailable'` | True if `.github/FUNDING.yml` exists | GraphQL file presence check |
| `hasDiscussionsEnabled` | `boolean \| 'unavailable'` | Repository-level feature flag | GraphQL `repository.hasDiscussionsEnabled` |
| `discussionsCountWindow` | `number \| 'unavailable'` | Count of discussions created within the selected analysis window. Populated only when `hasDiscussionsEnabled === true`; otherwise `'unavailable'` | GraphQL `repository.discussions(filterBy: { ... }).totalCount` |
| `discussionsWindowDays` | `ActivityWindowDays \| 'unavailable'` | The window days the `discussionsCountWindow` was computed against. Enables local-window recomputation matching Activity/Responsiveness. | Computed from user selector |

### Validation rules

- If `hasDiscussionsEnabled === false`, `discussionsCountWindow` MUST be `'unavailable'` (never `0`). This matches FR-008 — no activity fetch when disabled.
- If `hasDiscussionsEnabled === 'unavailable'`, both `discussionsCountWindow` and `discussionsWindowDays` MUST be `'unavailable'`.
- If `hasDiscussionsEnabled === true` and `discussionsCountWindow` resolution fails, `discussionsCountWindow` is `'unavailable'` (per constitution §II).

---

## Extended host-bucket score definitions

Each host bucket's `*ScoreDefinition` gains a new weighted factor.

### `DocumentationScoreDefinition` (`lib/documentation/score-config.ts`)

Add two factors to the File presence composite:

```ts
FILE_WEIGHTS = {
  readme: 0.30,
  contributing: 0.20,
  code_of_conduct: 0.10,
  security: 0.20,
  changelog: 0.20,
  // New — both scored at the same weight as CODE_OF_CONDUCT per research.md Q1
  issue_templates: 0.05,
  pull_request_template: 0.05,
}
```

File weights are renormalized to sum to 1.0 after adding these entries (per the existing pattern in the file).

### `ContributorsScoreDefinition` (`lib/contributors/score-config.ts`)

Add a bonus-only `fundingPresent` factor:

```ts
weightedFactors: Array<{
  label: string
  weightLabel: string
  description: string
  percentile?: number
}>
// ... existing five factors (concentration, maintainerDepth, repeatContributors, contributionBreadth, newContributors) ...
// New factor: FUNDING bonus (small positive signal; no penalty when absent per FR-008)
{
  key: 'fundingPresent',
  label: 'Funding disclosure',
  weight: 5, // applied as bonus — see score-config.ts pattern
  description: 'Presence of FUNDING.yml signals sustainability outreach.',
}
```

### `ActivityScoreDefinition` (`lib/activity/score-config.ts`)

Add a `discussions` factor (combines enabled + activity per research.md Q2):

```ts
ACTIVITY_FACTORS = [
  { key: 'prFlow', label: 'PR flow', weight: 23, /* ... */ },          // was 25
  { key: 'issueFlow', label: 'Issue flow', weight: 18, /* ... */ },    // was 20
  { key: 'completionSpeed', label: 'Completion speed', weight: 14, /* ... */ },  // was 15
  { key: 'sustainedActivity', label: 'Sustained activity', weight: 23, /* ... */ },  // was 25
  { key: 'releaseCadence', label: 'Release cadence', weight: 14, /* ... */ },  // was 15
  { key: 'discussions', label: 'Discussions engagement', weight: 8,
    description: 'Discussions enabled (2%) plus windowed discussion volume (up to 6%).' },
]
```

Weights re-distribute proportionally from the existing factors to give Discussions 8%. Final sum remains 100%.

### `CommunityCompleteness` (`lib/community/completeness.ts` — NEW)

A derived summary, not a scored bucket:

```ts
export interface CommunityCompleteness {
  /** Signals detected as present. */
  present: CommunitySignalKey[]
  /** Signals detected as absent. */
  missing: CommunitySignalKey[]
  /** Signals that could not be determined (excluded from numerator and denominator). */
  unknown: CommunitySignalKey[]
  /** Raw ratio (present / (present + missing)); undefined when all are unknown. */
  ratio: number | null
  /** Percentile rank against the peer bracket (0–99); null when insufficient data. */
  percentile: number | null
  /** Tone for the scorecard tile (reuses existing `ScoreTone`). */
  tone: ScoreTone
}

export type CommunitySignalKey =
  | 'code_of_conduct'
  | 'issue_templates'
  | 'pull_request_template'
  | 'codeowners'
  | 'governance'
  | 'funding'
  | 'discussions_enabled'
```

---

## Tag system extension

### `lib/tags/community.ts` — NEW

Mirrors `lib/tags/governance.ts` exactly:

```ts
export const COMMUNITY_DOC_FILES = new Set([
  'code_of_conduct',
  'issue_templates',
  'pull_request_template',
  'governance', // GOVERNANCE.md lives on the Documentation tab; lens-only (scored in Governance)
])

export const COMMUNITY_CONTRIBUTORS_METRICS = new Set([
  'CODEOWNERS',
  'Funding disclosure',
])

export const COMMUNITY_ACTIVITY_ITEMS = new Set([
  'discussions', // The Discussions card on Activity tab
])

export function isCommunityItem(
  key: string,
  domain: 'doc_file' | 'contributors_metric' | 'activity_item',
): boolean {
  switch (domain) {
    case 'doc_file': return COMMUNITY_DOC_FILES.has(key)
    case 'contributors_metric': return COMMUNITY_CONTRIBUTORS_METRICS.has(key)
    case 'activity_item': return COMMUNITY_ACTIVITY_ITEMS.has(key)
  }
}
```

### TagPill color token

Extend the existing tag-color map (wherever TagPill is rendered) with a `community` tone. The constitution does not pin a color; the implementation picks a distinct pill color that contrasts with `governance` (emerald), which is already in use.

---

## Export shapes

### JSON export

Extend `JsonExportResult.results[i]` with:

```ts
community: {
  signals: {
    code_of_conduct: { present: boolean | 'unknown' }
    issue_templates: { present: boolean | 'unknown' }
    pull_request_template: { present: boolean | 'unknown' }
    codeowners: { present: boolean | 'unknown' }
    governance: { present: boolean | 'unknown' }
    funding: { present: boolean | 'unknown' }
    discussions_enabled: { present: boolean | 'unknown' }
  }
  completeness: {
    ratio: number | null
    percentile: number | null
    tone: ScoreTone
    presentCount: number
    missingCount: number
    unknownCount: number
  }
  discussions: {
    enabled: boolean | 'unknown'
    windowDays: number | null
    windowCount: number | null
  }
}
```

### Markdown export

Add a **Community** section between the existing **Contributors** and **Activity** sections:

```markdown
### Community

**Completeness:** {percentile label}  ({present}/{total} signals)

| Signal | Status |
| --- | --- |
| Code of Conduct | ✓ Present / ✗ Missing / ? Unknown |
| Issue templates | ... |
| PR template | ... |
| CODEOWNERS | ... |
| Governance | ... |
| Funding | ... |
| Discussions | Enabled (N in last Wd) / Not enabled / Unknown |
```

---

## Recommendations catalog additions

Per FR-014 and research.md Q1, the recommendations are emitted by the existing host-bucket recommendation paths (Documentation / Contributors / Activity), not a new Community path. Catalog entries are added to keep stable IDs and tag hygiene:

| Catalog ID | Bucket | Key | Title |
|---|---|---|---|
| DOC-NN | Documentation | `file:issue_templates` | Add an issue template in `.github/ISSUE_TEMPLATE/` |
| DOC-NN | Documentation | `file:pull_request_template` | Add a `PULL_REQUEST_TEMPLATE.md` |
| CTR-NN | Contributors | `file:funding` | Add `.github/FUNDING.yml` to disclose funding channels |
| ACT-NN | Activity | `feature:discussions_enabled` | Enable GitHub Discussions to give contributors a conversation space |

ID numbers are assigned in order of insertion at implementation time (see `/speckit.tasks` output). All four are tagged with `community`; DOC entries additionally tag `contrib-ex`; CTR entry tags `governance`; ACT entry tags `contrib-ex`.

---

## State transitions

None. This feature introduces only detections and derivations — no mutable workflow, no UI state machines beyond the existing Activity / Documentation / Contributors tab navigation.

---

## Backward compatibility

- `AnalysisResult` gains optional fields. Consumers that ignore the new fields continue to work. JSON export and Markdown export gain new sections but do not rename or remove existing ones (SC-006).
- Composite OSS Health Score weights (Activity 25%, Responsiveness 25%, Contributors 23%, Documentation 12%, Security 15%) are **unchanged** (SC-002). The within-Activity and within-Documentation sub-weight redistribution is cosmetic to the composite: Activity's total bucket contribution to the composite stays at 25%.
- Existing scores will shift slightly for repos that had templates, FUNDING, or Discussions (a boost), or that lacked them (a small dip). This is acceptable per the Edge Cases section of the spec — analyses are stateless.
