/**
 * Aggregator function signatures and per-panel value types.
 *
 * Source of truth: specs/231-org-aggregation/contracts/aggregator-contracts.ts
 * Keep in sync.
 *
 * MUST NOT import from react, next/*, or components/*.
 */

import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import type { AggregatePanel, FlagshipMarker } from '../types'

// --------------------------------------------------------------------
// Per-panel value types
// --------------------------------------------------------------------

export type ContributorDiversityValue = {
  topTwentyPercentShare: number
  elephantFactor: number
  uniqueAuthorsAcrossOrg: number
}

export type MaintainerToken = {
  token: string
  kind: 'user' | 'team'
}

export type MaintainersValue = {
  projectWide: { token: string; kind: 'user' | 'team'; reposListed: string[] }[]
  perRepo: { repo: string; tokens: MaintainerToken[] }[]
}

export type OrgAffiliationsValue = {
  perOrg: { org: string; commits: number }[]
  attributedAuthorCount: number
  unattributedAuthorCount: number
}

export type ReleaseCadenceValue = {
  totalReleases12mo: number
  perFlagship: { repo: string; releases12mo: number }[]
}

export type SecurityRollupValue = {
  perRepo: { repo: string; score: number | 'unavailable' }[]
  worstScore: number | null
}

export type GovernanceValue = {
  orgLevel: { repo: string; present: boolean } | null
  perRepo: { repo: string; present: boolean }[]
}

export type AdoptersValue = {
  flagshipUsed: string | null
  entries: string[]
}

export type ProjectFootprintValue = {
  totalStars: number
  totalForks: number
  totalWatchers: number
  totalContributors: number
}

export type ActivityRollupValue = {
  totalCommits12mo: number
  totalPrsMerged12mo: number
  totalIssuesClosed12mo: number
  mostActiveRepo: { repo: string; commits: number } | null
  leastActiveRepo: { repo: string; commits: number } | null
}

export type ResponsivenessRollupValue = {
  weightedMedianFirstResponseHours: number | null
  weightedMedianPrMergeHours: number | null
}

export type LicenseConsistencyValue = {
  perLicense: { spdxId: string; count: number; osiApproved: boolean }[]
  nonOsiCount: number
}

export type InclusiveNamingRollupValue = {
  tier1: number
  tier2: number
  tier3: number
  reposWithAnyViolation: number
}

export type DocumentationCoverageValue = {
  perCheck: { name: string; presentInPercent: number; presentReposCount: number }[]
}

export type LanguagesValue = {
  perLanguage: { language: string; repoCount: number }[]
}

export type StaleWorkValue = {
  totalOpenIssues: number
  totalOpenPullRequests: number
  weightedStaleIssueRatio: number | null
}

export type BusFactorValue = {
  highConcentrationRepos: { repo: string; topAuthorShare: number }[]
  threshold: number
}

export type RepoAgeValue = {
  newest: { repo: string; createdAt: Date } | null
  oldest: { repo: string; createdAt: Date } | null
}

export type InactiveReposValue = {
  windowMonths: number
  repos: { repo: string; lastCommitAt: Date | null }[]
}

// --------------------------------------------------------------------
// Aggregator function signatures
// --------------------------------------------------------------------

export interface AggregationContext {
  totalReposInRun: number
  flagshipRepos: FlagshipMarker[]
  inactiveRepoWindowMonths: number
}

export type Aggregator<T> = (
  results: AnalysisResult[],
  context: AggregationContext,
) => AggregatePanel<T>
