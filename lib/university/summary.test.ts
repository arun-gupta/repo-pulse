import { describe, expect, it } from 'vitest'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import { buildUniversitySummary } from './summary'

describe('university/summary', () => {
  it('returns the empty-state summary for no repositories', () => {
    expect(buildUniversitySummary([])).toEqual({
      totalPublicRepos: 0,
      totalStars: 'unavailable',
      mostStarredRepos: [],
      mostRecentlyActiveRepos: [],
      languageDistribution: [],
      archivedRepoCount: 0,
      activeRepoCount: 0,
    })
  })

  it('builds totals, language buckets, and alphabetical tie-breakers from analyzed repos', () => {
    const summary = buildUniversitySummary([
      buildResult('mit/atlas', {
        stars: 10,
        primaryLanguage: 'TypeScript',
        commitTimestamps365d: ['2026-04-03T00:00:00Z'],
      }),
      buildResult('mit/mars', {
        stars: 10,
        primaryLanguage: 'TypeScript',
        commitTimestamps365d: ['2026-04-01T00:00:00Z', '2026-04-03T00:00:00Z'],
      }),
      buildResult('mit/zeus', {
        stars: 5,
        primaryLanguage: 'Python',
        commitTimestamps365d: 'unavailable',
      }),
      buildResult('mit/apollo', {
        stars: 'unavailable',
        primaryLanguage: 'unavailable',
        commitTimestamps365d: [],
      }),
      buildResult('mit/borealis', {
        stars: 'unavailable',
        primaryLanguage: 'unavailable',
        commitTimestamps365d: ['not-a-date'],
      }),
    ])

    expect(summary.totalPublicRepos).toBe(5)
    expect(summary.totalStars).toBe(25)
    expect(summary.activeRepoCount).toBe(5)
    expect(summary.archivedRepoCount).toBe(0)
    expect(summary.mostStarredRepos).toEqual([
      { repo: 'mit/atlas', stars: 10 },
      { repo: 'mit/mars', stars: 10 },
      { repo: 'mit/zeus', stars: 5 },
    ])
    expect(summary.languageDistribution).toEqual([
      { language: 'TypeScript', repoCount: 2 },
      { language: 'Unavailable', repoCount: 2 },
      { language: 'Python', repoCount: 1 },
    ])
  })

  it('orders recent activity by latest commit timestamp and falls back to unavailable when no valid timestamps exist', () => {
    const summary = buildUniversitySummary([
      buildResult('mit/gamma', {
        commitTimestamps365d: ['2026-04-02T00:00:00Z'],
      }),
      buildResult('mit/alpha', {
        commitTimestamps365d: ['2026-04-03T00:00:00Z'],
      }),
      buildResult('mit/beta', {
        commitTimestamps365d: ['2026-04-03T00:00:00Z', '2026-04-01T00:00:00Z'],
      }),
      buildResult('mit/delta', {
        commitTimestamps365d: [],
      }),
    ])

    expect(summary.mostRecentlyActiveRepos).toEqual([
      { repo: 'mit/alpha', pushedAt: '2026-04-03T00:00:00Z' },
      { repo: 'mit/beta', pushedAt: '2026-04-03T00:00:00Z' },
      { repo: 'mit/gamma', pushedAt: '2026-04-02T00:00:00Z' },
    ])
  })
})

function buildResult(repo: string, overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    repo,
    name: repo.split('/')[1] ?? repo,
    description: 'Repo description',
    createdAt: '2026-01-01T00:00:00Z',
    primaryLanguage: 'TypeScript',
    stars: 1,
    forks: 1,
    watchers: 1,
    commits30d: 1,
    commits90d: 1,
    releases12mo: 1,
    prsOpened90d: 1,
    prsMerged90d: 1,
    issuesOpen: 1,
    issuesClosed90d: 1,
    uniqueCommitAuthors90d: 1,
    totalContributors: 1,
    maintainerCount: 1,
    commitCountsByAuthor: { alice: 1 },
    commitCountsByExperimentalOrg: 'unavailable',
    experimentalAttributedAuthors90d: 'unavailable',
    experimentalUnattributedAuthors90d: 'unavailable',
    commitTimestamps365d: ['2026-04-01T00:00:00Z'],
    issueFirstResponseTimestamps: [],
    issueCloseTimestamps: [],
    prMergeTimestamps: [],
    documentationResult: 'unavailable',
    licensingResult: 'unavailable',
    defaultBranchName: 'main',
    topics: [],
    inclusiveNamingResult: 'unavailable',
    securityResult: 'unavailable',
    missingFields: [],
    ...overrides,
  }
}
