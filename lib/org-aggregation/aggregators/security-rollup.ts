import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import type { AggregatePanel } from '../types'
import type { Aggregator, SecurityRollupValue } from './types'

/**
 * FR-012: Security rollup — per-repo OpenSSF Scorecard scores with the
 * worst (minimum) score highlighted.
 *
 * Pure function. No I/O. Repos whose `securityResult` or nested
 * `scorecard` is 'unavailable' contribute a score of 'unavailable';
 * the panel is still 'final' if at least one repo has a numeric score.
 */
export const securityRollupAggregator: Aggregator<SecurityRollupValue> = (
  results,
  context,
): AggregatePanel<SecurityRollupValue> => {
  if (results.length === 0) {
    return {
      panelId: 'security-rollup',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'in-progress',
      value: null,
    }
  }

  const perRepo: SecurityRollupValue['perRepo'] = []

  for (const r of results) {
    const sec = (r as AnalysisResult).securityResult
    if (sec && sec !== 'unavailable' && sec.scorecard && sec.scorecard !== 'unavailable') {
      perRepo.push({ repo: r.repo, score: sec.scorecard.overallScore })
    } else {
      perRepo.push({ repo: r.repo, score: 'unavailable' })
    }
  }

  perRepo.sort((a, b) => a.repo.localeCompare(b.repo))

  const numericScores = perRepo
    .map((e) => e.score)
    .filter((s): s is number => typeof s === 'number')

  const contributingReposCount = numericScores.length

  if (contributingReposCount === 0) {
    return {
      panelId: 'security-rollup',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'unavailable',
      value: null,
    }
  }

  const worstScore = Math.min(...numericScores)

  return {
    panelId: 'security-rollup',
    contributingReposCount,
    totalReposInRun: context.totalReposInRun,
    status: 'final',
    value: {
      perRepo,
      worstScore,
    },
  }
}
