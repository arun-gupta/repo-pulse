import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import type { AggregatePanel } from '../types'
import type { Aggregator, SecurityRollupValue } from './types'

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
  const checks = {
    securityPolicy: { present: 0, total: 0 },
    dependabot: { present: 0, total: 0 },
    ciCd: { present: 0, total: 0 },
    branchProtection: { present: 0, total: 0 },
  }

  for (const r of results) {
    const sec = (r as AnalysisResult).securityResult
    if (sec && sec !== 'unavailable') {
      if (sec.scorecard && sec.scorecard !== 'unavailable') {
        perRepo.push({ repo: r.repo, score: sec.scorecard.overallScore })
      } else {
        perRepo.push({ repo: r.repo, score: 'unavailable' })
      }

      for (const dc of sec.directChecks) {
        const key =
          dc.name === 'security_policy' ? 'securityPolicy' :
          dc.name === 'dependabot' ? 'dependabot' :
          dc.name === 'ci_cd' ? 'ciCd' :
          dc.name === 'branch_protection' ? 'branchProtection' :
          null
        if (key) {
          checks[key].total++
          if (dc.detected === true) checks[key].present++
        }
      }

      if (typeof sec.branchProtectionEnabled === 'boolean') {
        // branchProtectionEnabled may also be available directly
        // but we already counted it from directChecks if present
      }
    } else {
      perRepo.push({ repo: r.repo, score: 'unavailable' })
    }
  }

  perRepo.sort((a, b) => a.repo.localeCompare(b.repo))

  const numericScores = perRepo
    .map((e) => e.score)
    .filter((s): s is number => typeof s === 'number')

  const contributingReposCount = numericScores.length
  const hasDirectChecks = checks.securityPolicy.total > 0 || checks.dependabot.total > 0

  if (contributingReposCount === 0 && !hasDirectChecks) {
    return {
      panelId: 'security-rollup',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'unavailable',
      value: null,
    }
  }

  const worstScore = numericScores.length > 0 ? Math.min(...numericScores) : null

  return {
    panelId: 'security-rollup',
    contributingReposCount: Math.max(contributingReposCount, hasDirectChecks ? results.filter((r) => {
      const sec = (r as AnalysisResult).securityResult
      return sec && sec !== 'unavailable'
    }).length : 0),
    totalReposInRun: context.totalReposInRun,
    status: 'final',
    value: {
      perRepo,
      worstScore,
      directChecks: hasDirectChecks ? checks : null,
    },
  }
}
