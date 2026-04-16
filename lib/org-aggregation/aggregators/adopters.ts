import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import type { AggregatePanel } from '../types'
import type { AdoptersValue, Aggregator } from './types'

/**
 * FR-014: Adopters file discovery across the org.
 *
 * Walks flagship repos in pinned-rank order, then falls back to all repos,
 * looking for a file whose path matches /ADOPTERS/i in the repo's
 * `documentationResult.fileChecks`.
 *
 * The first repo that has such a file wins. `entries` is always empty —
 * full parsing is deferred to #210.
 *
 * Pure function. No I/O.
 */

function hasAdoptersFile(r: AnalysisResult): boolean {
  const docResult = r.documentationResult
  if (!docResult || docResult === 'unavailable') return false
  return docResult.fileChecks.some((fc) => fc.found && fc.path != null && /ADOPTERS/i.test(fc.path))
}

function hasDocumentation(r: AnalysisResult): boolean {
  const docResult = r.documentationResult
  return !!docResult && docResult !== 'unavailable'
}

export const adoptersAggregator: Aggregator<AdoptersValue> = (
  results,
  context,
): AggregatePanel<AdoptersValue> => {
  if (results.length === 0) {
    return {
      panelId: 'adopters',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'in-progress',
      value: null,
    }
  }

  // A repo "contributes" if its documentationResult is not 'unavailable'
  const contributingReposCount = results.filter((r) => hasDocumentation(r as AnalysisResult)).length

  if (contributingReposCount === 0) {
    return {
      panelId: 'adopters',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'unavailable',
      value: null,
    }
  }

  // 1. Walk flagship repos in rank order
  const flagships = [...context.flagshipRepos].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  for (const fm of flagships) {
    const r = results.find((res) => res.repo === fm.repo) as AnalysisResult | undefined
    if (r && hasAdoptersFile(r)) {
      return {
        panelId: 'adopters',
        contributingReposCount,
        totalReposInRun: context.totalReposInRun,
        status: 'final',
        value: { flagshipUsed: r.repo, entries: [] },
      }
    }
  }

  // 2. Fall back: check ALL repos
  for (const r of results) {
    if (hasAdoptersFile(r as AnalysisResult)) {
      return {
        panelId: 'adopters',
        contributingReposCount,
        totalReposInRun: context.totalReposInRun,
        status: 'final',
        value: { flagshipUsed: r.repo, entries: [] },
      }
    }
  }

  // 3. No repo has ADOPTERS.md
  return {
    panelId: 'adopters',
    contributingReposCount,
    totalReposInRun: context.totalReposInRun,
    status: 'unavailable',
    value: null,
  }
}
