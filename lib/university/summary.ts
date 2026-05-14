import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import type { OrgRepoSummary } from '@/lib/analyzer/org-inventory'
import { buildOrgInventorySummary, type OrgInventorySummary } from '@/lib/org-inventory/summary'

export function buildUniversitySummary(results: AnalysisResult[]): OrgInventorySummary {
  return buildOrgInventorySummary(results.map(toUniversityRepoSummary))
}

function toUniversityRepoSummary(result: AnalysisResult): OrgRepoSummary {
  return {
    repo: result.repo,
    name: result.name === 'unavailable' ? result.repo.split('/')[1] ?? result.repo : result.name,
    description: result.description,
    primaryLanguage: result.primaryLanguage,
    stars: result.stars,
    forks: result.forks,
    watchers: result.watchers,
    openIssues: result.issuesOpen,
    pushedAt: deriveLastActive(result),
    // Repofinder's university export currently curates active repositories only.
    // Keep the archived count at zero until the upstream fixture includes an
    // archived signal we can map through explicitly.
    archived: false,
    isFork: false,
    topics: result.topics,
    url: `https://github.com/${result.repo}`,
  }
}

function deriveLastActive(result: AnalysisResult): string | 'unavailable' {
  if (!Array.isArray(result.commitTimestamps365d) || result.commitTimestamps365d.length === 0) {
    return 'unavailable'
  }

  let latestTimestamp = 'unavailable' as string | 'unavailable'
  let latestTime = Number.NEGATIVE_INFINITY

  for (const timestamp of result.commitTimestamps365d) {
    const parsed = new Date(timestamp).getTime()
    if (Number.isNaN(parsed) || parsed <= latestTime) {
      continue
    }
    latestTime = parsed
    latestTimestamp = timestamp
  }

  return latestTimestamp
}
