import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import type { AggregatePanel } from '../types'
import type { Aggregator, OrgAffiliationsValue } from './types'

/**
 * FR-010: Org-affiliation aggregation across repos.
 *
 * Unions `commitCountsByExperimentalOrg` across repos (summing commits per
 * org key), sums attributed/unattributed author counts, and sorts the
 * per-org list descending by commits.
 *
 * Pure function. No I/O. Repos whose `commitCountsByExperimentalOrg` is
 * 'unavailable' are excluded; the panel is 'unavailable' if zero repos
 * contribute.
 */
export const orgAffiliationsAggregator: Aggregator<OrgAffiliationsValue> = (
  results,
  context,
): AggregatePanel<OrgAffiliationsValue> => {
  if (results.length === 0) {
    return {
      panelId: 'org-affiliations',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'in-progress',
      value: null,
    }
  }

  const orgCommits = new Map<string, number>()
  let contributingReposCount = 0
  let attributedAuthorCount = 0
  let unattributedAuthorCount = 0

  for (const r of results) {
    const counts = (r as AnalysisResult).commitCountsByExperimentalOrg
    if (!counts || counts === 'unavailable') continue

    contributingReposCount++

    for (const [org, commits] of Object.entries(counts)) {
      orgCommits.set(org, (orgCommits.get(org) ?? 0) + commits)
    }

    const attributed = (r as AnalysisResult).experimentalAttributedAuthors90d
    if (typeof attributed === 'number') {
      attributedAuthorCount += attributed
    }

    const unattributed = (r as AnalysisResult).experimentalUnattributedAuthors90d
    if (typeof unattributed === 'number') {
      unattributedAuthorCount += unattributed
    }
  }

  if (contributingReposCount === 0) {
    return {
      panelId: 'org-affiliations',
      contributingReposCount: 0,
      totalReposInRun: context.totalReposInRun,
      status: 'unavailable',
      value: null,
    }
  }

  const perOrg = Array.from(orgCommits.entries())
    .map(([org, commits]) => ({ org, commits }))
    .sort((a, b) => b.commits - a.commits)

  return {
    panelId: 'org-affiliations',
    contributingReposCount,
    totalReposInRun: context.totalReposInRun,
    status: 'final',
    value: {
      perOrg,
      attributedAuthorCount,
      unattributedAuthorCount,
    },
  }
}
