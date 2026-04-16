import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import type { AggregatePanel } from '../types'
import type { Aggregator, ProjectFootprintValue } from './types'

/**
 * FR-019: Org-level project footprint — sum of stars, forks, watchers,
 * and totalContributors across all repos.
 *
 * Pure function. No I/O. Repos where ALL four fields are 'unavailable'
 * are excluded; the panel is 'unavailable' only when zero repos
 * contribute any numeric value.
 */
export const projectFootprintAggregator: Aggregator<ProjectFootprintValue> = (
  results,
  context,
): AggregatePanel<ProjectFootprintValue> => {
  if (results.length === 0) {
    return {
      panelId: 'project-footprint',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'in-progress',
      value: null,
    }
  }

  let totalStars = 0
  let totalForks = 0
  let totalWatchers = 0
  let totalContributors = 0
  let contributingReposCount = 0

  for (const r of results) {
    const ar = r as AnalysisResult
    const hasStars = typeof ar.stars === 'number'
    const hasForks = typeof ar.forks === 'number'
    const hasWatchers = typeof ar.watchers === 'number'
    const hasContributors = typeof ar.totalContributors === 'number'

    if (!hasStars && !hasForks && !hasWatchers && !hasContributors) continue

    contributingReposCount++
    if (hasStars) totalStars += ar.stars as number
    if (hasForks) totalForks += ar.forks as number
    if (hasWatchers) totalWatchers += ar.watchers as number
    if (hasContributors) totalContributors += ar.totalContributors as number
  }

  if (contributingReposCount === 0) {
    return {
      panelId: 'project-footprint',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'unavailable',
      value: null,
    }
  }

  return {
    panelId: 'project-footprint',
    contributingReposCount,
    totalReposInRun: context.totalReposInRun,
    status: 'final',
    value: {
      totalStars,
      totalForks,
      totalWatchers,
      totalContributors,
    },
  }
}
