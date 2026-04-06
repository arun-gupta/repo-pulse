import type { ActivityWindowDays, AnalysisResult, ContributorWindowMetrics, Unavailable } from '@/lib/analyzer/analysis-result'

export type HealthRatioCategory = 'ecosystem' | 'activity' | 'contributors'

export interface HealthRatioDefinition {
  id: string
  category: HealthRatioCategory
  label: string
  formula: string
  description: string
}

export const HEALTH_RATIO_DEFINITIONS: HealthRatioDefinition[] = [
  {
    id: 'fork-rate',
    category: 'ecosystem',
    label: 'Fork rate',
    formula: 'forks / stars',
    description: 'Share of starred users that also forked the repository.',
  },
  {
    id: 'watcher-rate',
    category: 'ecosystem',
    label: 'Watcher rate',
    formula: 'watches / stars',
    description: 'Share of starred users that also watch the repository.',
  },
  {
    id: 'pr-merge-rate',
    category: 'activity',
    label: 'PR merge rate',
    formula: 'merged PRs / opened PRs',
    description:
      'Share of pull requests opened in the selected window that were merged in that same window. Strong is 70% or higher, Mixed is 40% to 69.9%, and Weak is below 40%.',
  },
  {
    id: 'stale-issue-ratio',
    category: 'activity',
    label: 'Stale issue ratio',
    formula: 'stale open issues / total open issues',
    description: 'Share of currently open issues that were created before the selected window cutoff.',
  },
  {
    id: 'repeat-contributor-ratio',
    category: 'contributors',
    label: 'Repeat contributor ratio',
    formula: 'repeat contributors / total contributors',
    description: 'Share of total contributors who made more than one verified commit in the selected window.',
  },
  {
    id: 'new-contributor-ratio',
    category: 'contributors',
    label: 'New contributor ratio',
    formula: 'new contributors / total contributors',
    description:
      'Share of total contributors whose first verified commit in the available 365-day history falls within the selected window.',
  },
]

export function computeHealthRatio(numerator: number | Unavailable, denominator: number | Unavailable): number | Unavailable {
  if (typeof numerator !== 'number' || typeof denominator !== 'number' || denominator <= 0) {
    return 'unavailable'
  }

  return numerator / denominator
}

export function getContributorRatioMetrics(
  result: AnalysisResult,
  windowMetrics: ContributorWindowMetrics,
): {
  repeatContributorRatio: number | Unavailable
  newContributorRatio: number | Unavailable
} {
  return {
    repeatContributorRatio: computeHealthRatio(windowMetrics.repeatContributors, result.totalContributors),
    newContributorRatio: computeHealthRatio(windowMetrics.newContributors, result.totalContributors),
  }
}

export function getActivityRatioMetrics(
  result: AnalysisResult,
  windowDays: ActivityWindowDays,
): {
  prMergeRate: number | Unavailable
  staleIssueRatio: number | Unavailable
} {
  const windowMetrics = result.activityMetricsByWindow?.[windowDays]

  return {
    prMergeRate: computeHealthRatio(windowMetrics?.prsMerged ?? 'unavailable', windowMetrics?.prsOpened ?? 'unavailable'),
    staleIssueRatio: windowMetrics?.staleIssueRatio ?? 'unavailable',
  }
}

export function getEcosystemRatioMetrics(result: AnalysisResult): {
  forkRate: number | Unavailable
  watcherRate: number | Unavailable
} {
  return {
    forkRate: computeHealthRatio(result.forks, result.stars),
    watcherRate: computeHealthRatio(result.watchers, result.stars),
  }
}
