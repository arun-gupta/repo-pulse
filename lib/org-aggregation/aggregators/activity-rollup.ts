import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import type { AggregatePanel } from '../types'
import type { ActivityRollupValue, Aggregator } from './types'

/**
 * FR-020: Org-level activity rollup — sums commits, merged PRs, and
 * closed issues across all repos and identifies the most/least active
 * repos by commit count.
 *
 * NOTE: The underlying AnalysisResult fields are 90-day windows
 * (`commits90d`, `prsMerged90d`, `issuesClosed90d`). The contract
 * names them `*12mo` because those are the desired signals; the 90-day
 * values are the best-available proxy.
 *
 * Pure function. No I/O.
 */
export const activityRollupAggregator: Aggregator<ActivityRollupValue> = (
  results,
  context,
): AggregatePanel<ActivityRollupValue> => {
  if (results.length === 0) {
    return {
      panelId: 'activity-rollup',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'in-progress',
      value: null,
    }
  }

  let totalCommits = 0
  let totalPrs = 0
  let totalIssues = 0
  let contributingReposCount = 0

  // Track per-repo commits for most/least active (only repos with available commits90d)
  const repoCommits: { repo: string; commits: number }[] = []

  for (const r of results) {
    const result = r as AnalysisResult
    const commits = result.commits90d
    const prs = result.prsMerged90d
    const issues = result.issuesClosed90d

    const hasAny =
      (typeof commits === 'number') ||
      (typeof prs === 'number') ||
      (typeof issues === 'number')

    if (!hasAny) continue

    contributingReposCount++

    if (typeof commits === 'number') {
      totalCommits += commits
      repoCommits.push({ repo: r.repo, commits })
    }
    if (typeof prs === 'number') totalPrs += prs
    if (typeof issues === 'number') totalIssues += issues
  }

  if (contributingReposCount === 0) {
    return {
      panelId: 'activity-rollup',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'unavailable',
      value: null,
    }
  }

  let mostActiveRepo: ActivityRollupValue['mostActiveRepo'] = null
  let leastActiveRepo: ActivityRollupValue['leastActiveRepo'] = null

  if (repoCommits.length > 0) {
    repoCommits.sort((a, b) => b.commits - a.commits)
    mostActiveRepo = { repo: repoCommits[0].repo, commits: repoCommits[0].commits }
    const least = repoCommits[repoCommits.length - 1]
    leastActiveRepo = { repo: least.repo, commits: least.commits }
  }

  return {
    panelId: 'activity-rollup',
    contributingReposCount,
    totalReposInRun: context.totalReposInRun,
    status: 'final',
    value: {
      totalCommits12mo: totalCommits,
      totalPrsMerged12mo: totalPrs,
      totalIssuesClosed12mo: totalIssues,
      mostActiveRepo,
      leastActiveRepo,
    },
  }
}
