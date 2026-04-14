# Contracts: Community Scoring

**Feature**: P2-F05 — Community scoring
**Phase**: 1 (design)
**Input**: `data-model.md`, `research.md`

This document pins the TypeScript contracts that must exist in the codebase after implementation. Each contract is a testable surface — a test file can import the type and assert its shape against a fixture.

---

## 1. `AnalysisResult` extension (analyzer)

**Location**: `lib/analyzer/analysis-result.ts`

```ts
export type Unavailable = 'unavailable'

export interface AnalysisResult {
  // ... existing fields ...

  // NEW — community signal detections
  hasIssueTemplates: boolean | Unavailable
  hasPullRequestTemplate: boolean | Unavailable
  hasFundingConfig: boolean | Unavailable
  hasDiscussionsEnabled: boolean | Unavailable
  discussionsCountWindow: number | Unavailable
  discussionsWindowDays: ActivityWindowDays | Unavailable
}
```

**Contract invariants** (enforced in unit tests):

1. `hasDiscussionsEnabled === false` ⇒ `discussionsCountWindow === 'unavailable'` and `discussionsWindowDays === 'unavailable'`.
2. `hasDiscussionsEnabled === 'unavailable'` ⇒ both discussion fields `'unavailable'`.
3. `hasDiscussionsEnabled === true` ⇒ `discussionsCountWindow` is either a non-negative number or `'unavailable'` (API failure case).

---

## 2. `CommunityCompleteness`

**Location**: `lib/community/completeness.ts` (new file)

```ts
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import type { ScoreTone } from '@/specs/008-metric-cards/contracts/metric-card-props'

export type CommunitySignalKey =
  | 'code_of_conduct'
  | 'issue_templates'
  | 'pull_request_template'
  | 'codeowners'
  | 'governance'
  | 'funding'
  | 'discussions_enabled'

export interface CommunityCompleteness {
  present: CommunitySignalKey[]
  missing: CommunitySignalKey[]
  unknown: CommunitySignalKey[]
  ratio: number | null
  percentile: number | null
  tone: ScoreTone
}

export function computeCommunityCompleteness(result: AnalysisResult): CommunityCompleteness
```

**Contract invariants**:

1. `present.length + missing.length + unknown.length === 7` for every input.
2. If `missing.length + present.length === 0`, `ratio === null` and `percentile === null`.
3. If `ratio !== null`, `ratio` is in `[0, 1]`.
4. `ratio = present.length / (present.length + missing.length)`.

---

## 3. Community tag registry

**Location**: `lib/tags/community.ts` (new file)

```ts
export const COMMUNITY_DOC_FILES: ReadonlySet<string>
export const COMMUNITY_CONTRIBUTORS_METRICS: ReadonlySet<string>
export const COMMUNITY_ACTIVITY_ITEMS: ReadonlySet<string>

export type CommunityDomain = 'doc_file' | 'contributors_metric' | 'activity_item'

export function isCommunityItem(key: string, domain: CommunityDomain): boolean
```

**Contract invariants**:

1. The three sets are disjoint (an item key appears in at most one domain).
2. `isCommunityItem(k, d)` returns `true` iff `k` is in the set for domain `d`.
3. The API signature mirrors `lib/tags/governance.ts` so both registries support the same cross-tab rendering pattern.

---

## 4. Host bucket extensions

### Documentation score

**Location**: `lib/documentation/score-config.ts` (existing file, extended)

`DocumentationScoreDefinition.filePresenceScore` contract:

1. MUST account for issue templates and PR template in its weighted composite.
2. When `hasIssueTemplates === 'unavailable'` or `hasPullRequestTemplate === 'unavailable'`, the missing signal MUST be excluded from both numerator and denominator (consistent with existing "missing file" handling in this file).
3. File weights sum to 1.0.

### Contributors score

**Location**: `lib/contributors/score-config.ts` (existing file, extended)

`ContributorsScoreDefinition.weightedFactors` contract:

1. New `fundingPresent` factor appears after the existing five factors.
2. Its `percentile` is either a bonus (positive number up to the factor's weight) or `undefined` when `hasFundingConfig === 'unavailable'`.
3. Absence of FUNDING.yml (i.e., `hasFundingConfig === false`) MUST NOT reduce the Contributors percentile below what it would be without this factor — bonus-only (FR-008).

### Activity score

**Location**: `lib/activity/score-config.ts` (existing file, extended)

`ActivityScoreDefinition.weightedFactors` contract:

1. New `discussions` factor appears after `releaseCadence`.
2. Its `percentile` is:
   - `undefined` when `hasDiscussionsEnabled === 'unavailable'`
   - `0` when `hasDiscussionsEnabled === false` (absence is a valid zero, not missing)
   - `2` when `hasDiscussionsEnabled === true && discussionsCountWindow === 0` (enabled but empty)
   - between `50` and `99` when `hasDiscussionsEnabled === true && discussionsCountWindow > 0`, mapped via a linear/step approximation pending calibration refresh (#152)
3. Sum of all six factor weights in `ACTIVITY_FACTORS` MUST equal 100.

---

## 5. Export shape extension

### JSON export

**Location**: `lib/export/json-export.ts` (existing file, extended)

`JsonExportResult.results[i].community` is a required field on each repo's export entry:

```ts
community: {
  signals: Record<CommunitySignalKey, { present: boolean | 'unknown' }>
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

**Contract invariants**:

1. `community.signals` has exactly 7 keys (one per `CommunitySignalKey`).
2. `community.discussions.enabled === false` ⇒ `windowDays === null && windowCount === null`.
3. `community.completeness.percentile === null` iff `completeness.ratio === null`.

### Markdown export

**Location**: `lib/export/markdown-export.ts` (existing file, extended)

The per-repo markdown MUST include a `### Community` section whose structure is regression-tested:

1. Section appears between `### Contributors` and `### Activity` in rendered output.
2. Header line reads: `**Completeness:** {percentile label} ({present}/{total} signals)`.
3. Signal table has 7 rows, one per `CommunitySignalKey`.
4. Each row's status column is one of: `✓ Present`, `✗ Missing`, `? Unknown`, or for Discussions: `Enabled (N in last Wd)` / `Not enabled` / `Unknown`.

---

## 6. UI contracts

### `ScorecardCell` — new "Community completeness" variant

**Location**: `components/metric-cards/MetricCard.tsx` (existing file, extended)

New cell in the scorecard's score row showing:

1. Label: `Community`
2. Percentile label from `CommunityCompleteness.percentile`
3. Detail: `N of M signals` where M excludes `unknown`
4. Tooltip: "Count of community signals present — not a weighted composite input. See methodology."
5. Tile respects the existing `min-h`, `flex-col`, and height-normalization conventions added in PR #185.

### Tag pills across tabs

Each of the following rows/items MUST render a `community` tag pill when detected:

- **Documentation tab**: CoC, issue templates row, PR template row, GOVERNANCE.md row
- **Contributors tab**: CODEOWNERS row, FUNDING row
- **Activity tab**: Discussions card

Rows that are ALSO governance-tagged (CODEOWNERS, GOVERNANCE.md) MUST render both pills.

### Discussions card (new)

**Location**: `components/activity/ActivityView.tsx` (existing file, extended)

Card contract:

1. Renders at all times if `hasDiscussionsEnabled !== 'unavailable'`.
2. Shows one of three states:
   - `Enabled · {N} in last {W}d` (count + window)
   - `Enabled · no activity yet`
   - `Not enabled`
3. Carries a `community` tag pill.
4. When `hasDiscussionsEnabled === 'unavailable'`, the card is hidden and the signal appears in the missing-data panel.

---

## 7. Recommendations

**Location**: `lib/recommendations/catalog.ts` (existing file, extended)

Four new catalog entries. All tagged with `community`:

```ts
{ id: 'DOC-NN', bucket: 'Documentation', key: 'file:issue_templates', title: 'Add an issue template', tags: ['community', 'contrib-ex'] }
{ id: 'DOC-NN', bucket: 'Documentation', key: 'file:pull_request_template', title: 'Add a PULL_REQUEST_TEMPLATE.md', tags: ['community', 'contrib-ex'] }
{ id: 'CTR-NN', bucket: 'Contributors', key: 'file:funding', title: 'Add a FUNDING.yml to disclose funding channels', tags: ['community', 'governance'] }
{ id: 'ACT-NN', bucket: 'Activity', key: 'feature:discussions_enabled', title: 'Enable GitHub Discussions for contributor conversation', tags: ['community', 'contrib-ex'] }
```

Invariants tested by existing `catalog.test.ts`:

1. All IDs unique.
2. All keys unique.
3. Tag-count assertions updated: `community` tag has exactly 4 entries; `contrib-ex` tag count increases by 3; `governance` tag count increases by 1.
