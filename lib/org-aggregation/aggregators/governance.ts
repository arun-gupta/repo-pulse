import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import type { AggregatePanel } from '../types'
import type { Aggregator, GovernanceValue } from './types'

/**
 * FR-013: Governance file presence across the org.
 *
 * Checks each repo's `documentationResult.fileChecks` for a
 * `name === 'governance'` entry. The `.github` repo (if present)
 * is surfaced as `orgLevel`; all repos appear in `perRepo`.
 *
 * Pure function. No I/O.
 */
export const governanceAggregator: Aggregator<GovernanceValue> = (
  results,
  context,
): AggregatePanel<GovernanceValue> => {
  if (results.length === 0) {
    return {
      panelId: 'governance',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'in-progress',
      value: null,
    }
  }

  const perRepo: GovernanceValue['perRepo'] = []
  let orgLevel: GovernanceValue['orgLevel'] = null

  for (const r of results) {
    const docResult = (r as AnalysisResult).documentationResult
    let present = false

    if (docResult && docResult !== 'unavailable') {
      const check = docResult.fileChecks.find((fc) => fc.name === 'governance')
      present = check?.found ?? false
    }

    perRepo.push({ repo: r.repo, present })

    // Detect the org-level .github repo
    if (r.repo.endsWith('.github')) {
      orgLevel = { repo: r.repo, present }
    }
  }

  // A repo "contributes" if its documentationResult is not 'unavailable'
  const contributingReposCount = results.filter((r) => {
    const docResult = (r as AnalysisResult).documentationResult
    return docResult && docResult !== 'unavailable'
  }).length

  if (contributingReposCount === 0) {
    return {
      panelId: 'governance',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'unavailable',
      value: null,
    }
  }

  perRepo.sort((a, b) => a.repo.localeCompare(b.repo))

  return {
    panelId: 'governance',
    contributingReposCount,
    totalReposInRun: context.totalReposInRun,
    status: 'final',
    value: {
      orgLevel,
      perRepo,
    },
  }
}
