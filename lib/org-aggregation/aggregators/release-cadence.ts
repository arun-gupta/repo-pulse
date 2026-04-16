import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import type { AggregatePanel } from '../types'
import type { Aggregator, ReleaseCadenceValue } from './types'

/**
 * FR-011: Sum releases across repos, build per-flagship breakdown.
 *
 * Pure function. No I/O. Repos whose `releases12mo` is 'unavailable'
 * are excluded from the sum; the panel is still 'final' if at least
 * one repo contributes.
 */
export const releaseCadenceAggregator: Aggregator<ReleaseCadenceValue> = (
  results,
  context,
): AggregatePanel<ReleaseCadenceValue> => {
  if (results.length === 0) {
    return {
      panelId: 'release-cadence',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'in-progress',
      value: null,
    }
  }

  let totalReleases12mo = 0
  let contributingReposCount = 0
  const releasesByRepo = new Map<string, number>()

  for (const r of results) {
    const releases = (r as AnalysisResult).releases12mo
    if (releases === 'unavailable') continue
    totalReleases12mo += releases
    contributingReposCount += 1
    releasesByRepo.set(r.repo, releases)
  }

  if (contributingReposCount === 0) {
    return {
      panelId: 'release-cadence',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'unavailable',
      value: null,
    }
  }

  // Build perFlagship in rank order, only including repos with available data.
  const perFlagship: ReleaseCadenceValue['perFlagship'] = []
  const sortedFlagships = [...context.flagshipRepos].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  for (const f of sortedFlagships) {
    const releases = releasesByRepo.get(f.repo)
    if (releases !== undefined) {
      perFlagship.push({ repo: f.repo, releases12mo: releases })
    }
  }

  return {
    panelId: 'release-cadence',
    contributingReposCount,
    totalReposInRun: context.totalReposInRun,
    status: 'final',
    value: {
      totalReleases12mo,
      perFlagship,
    },
  }
}
