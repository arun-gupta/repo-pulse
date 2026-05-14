import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import type { OrgInventorySummary } from '@/lib/org-inventory/summary'

export function buildUniversitySummary(results: AnalysisResult[]): OrgInventorySummary {
  const starValues = results.flatMap((r) => (typeof r.stars === 'number' ? [r.stars] : []))
  const totalStars = starValues.length > 0 ? starValues.reduce((sum, v) => sum + v, 0) : 'unavailable'

  const languageCounts = new Map<string, number>()
  for (const r of results) {
    const lang = r.primaryLanguage === 'unavailable' ? 'Unavailable' : (r.primaryLanguage ?? 'Unavailable')
    languageCounts.set(lang, (languageCounts.get(lang) ?? 0) + 1)
  }

  return {
    totalPublicRepos: results.length,
    totalStars,
    mostStarredRepos: [...results]
      .sort((a, b) => compareNumeric(b.stars, a.stars) || a.repo.localeCompare(b.repo))
      .slice(0, 3)
      .map((r) => ({ repo: r.repo, stars: r.stars })),
    mostRecentlyActiveRepos: [...results]
      .sort((a, b) => compareByActivity(b, a) || a.repo.localeCompare(b.repo))
      .slice(0, 3)
      .map((r) => ({ repo: r.repo, pushedAt: deriveLastActive(r) })),
    languageDistribution: [...languageCounts.entries()]
      .map(([language, repoCount]) => ({ language, repoCount }))
      .sort((a, b) => b.repoCount - a.repoCount || a.language.localeCompare(b.language)),
    archivedRepoCount: 0,
    activeRepoCount: results.length,
  }
}

function deriveLastActive(r: AnalysisResult): string | 'unavailable' {
  if (Array.isArray(r.commitTimestamps365d) && r.commitTimestamps365d.length > 0) {
    const sorted = [...r.commitTimestamps365d].sort()
    return sorted[sorted.length - 1]
  }
  return 'unavailable'
}

function compareByActivity(a: AnalysisResult, b: AnalysisResult): number {
  const aTs = latestTimestamp(a)
  const bTs = latestTimestamp(b)
  if (aTs === null && bTs === null) return compareNumeric(a.commits30d, b.commits30d)
  if (aTs === null) return -1
  if (bTs === null) return 1
  return aTs - bTs
}

function latestTimestamp(r: AnalysisResult): number | null {
  if (!Array.isArray(r.commitTimestamps365d) || r.commitTimestamps365d.length === 0) return null
  const sorted = [...r.commitTimestamps365d].sort()
  const t = new Date(sorted[sorted.length - 1]).getTime()
  return Number.isNaN(t) ? null : t
}

function compareNumeric(left: number | 'unavailable', right: number | 'unavailable') {
  if (typeof left !== 'number' && typeof right !== 'number') return 0
  if (typeof left !== 'number') return -1
  if (typeof right !== 'number') return 1
  return left - right
}
