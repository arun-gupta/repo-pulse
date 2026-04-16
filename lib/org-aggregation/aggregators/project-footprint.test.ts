import { describe, expect, it } from 'vitest'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import { projectFootprintAggregator } from './project-footprint'

function partialResult(repo: string, override: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    repo,
    name: repo,
    description: 'unavailable',
    createdAt: 'unavailable',
    primaryLanguage: 'unavailable',
    stars: 'unavailable',
    forks: 'unavailable',
    watchers: 'unavailable',
    commits30d: 'unavailable',
    commits90d: 'unavailable',
    releases12mo: 'unavailable',
    prsOpened90d: 'unavailable',
    prsMerged90d: 'unavailable',
    issuesOpen: 'unavailable',
    issuesClosed90d: 'unavailable',
    uniqueCommitAuthors90d: 'unavailable',
    totalContributors: 'unavailable',
    maintainerCount: 'unavailable',
    commitCountsByAuthor: 'unavailable',
    commitCountsByExperimentalOrg: 'unavailable',
    experimentalAttributedAuthors90d: 'unavailable',
    experimentalUnattributedAuthors90d: 'unavailable',
    issueFirstResponseTimestamps: 'unavailable',
    issueCloseTimestamps: 'unavailable',
    prMergeTimestamps: 'unavailable',
    documentationResult: 'unavailable',
    licensingResult: 'unavailable',
    defaultBranchName: 'unavailable',
    topics: [],
    inclusiveNamingResult: 'unavailable',
    securityResult: 'unavailable',
    missingFields: [],
    ...override,
  } as AnalysisResult
}

const CONTEXT = { totalReposInRun: 3, flagshipRepos: [], inactiveRepoWindowMonths: 12 }

describe('projectFootprintAggregator — FR-019', () => {
  it('typical: sums stars, forks, watchers, totalContributors across repos', () => {
    const results = [
      partialResult('o/alpha', { stars: 100, forks: 20, watchers: 50, totalContributors: 10 }),
      partialResult('o/bravo', { stars: 200, forks: 30, watchers: 80, totalContributors: 25 }),
      partialResult('o/charlie', { stars: 50, forks: 5, watchers: 15, totalContributors: 3 }),
    ]
    const panel = projectFootprintAggregator(results, CONTEXT)
    expect(panel.status).toBe('final')
    expect(panel.panelId).toBe('project-footprint')
    expect(panel.contributingReposCount).toBe(3)
    expect(panel.value).toEqual({
      totalStars: 350,
      totalForks: 55,
      totalWatchers: 145,
      totalContributors: 38,
    })
  })

  it('all-unavailable: every repo has all four fields unavailable → panel is unavailable', () => {
    const results = [
      partialResult('o/alpha'),
      partialResult('o/bravo'),
    ]
    const panel = projectFootprintAggregator(results, { ...CONTEXT, totalReposInRun: 2 })
    expect(panel.status).toBe('unavailable')
    expect(panel.value).toBeNull()
    expect(panel.contributingReposCount).toBe(0)
  })

  it('mixed: repos with some unavailable fields still contribute; unavailable fields skipped', () => {
    const results = [
      partialResult('o/alpha', { stars: 100, forks: 'unavailable', watchers: 50, totalContributors: 10 }),
      partialResult('o/bravo'), // all unavailable — excluded
      partialResult('o/charlie', { stars: 'unavailable', forks: 5, watchers: 'unavailable', totalContributors: 3 }),
    ]
    const panel = projectFootprintAggregator(results, CONTEXT)
    expect(panel.status).toBe('final')
    expect(panel.contributingReposCount).toBe(2)
    expect(panel.value).toEqual({
      totalStars: 100,
      totalForks: 5,
      totalWatchers: 50,
      totalContributors: 13,
    })
  })

  it('empty: results array is empty → in-progress with null value', () => {
    const panel = projectFootprintAggregator([], { ...CONTEXT, totalReposInRun: 3 })
    expect(panel.status).toBe('in-progress')
    expect(panel.value).toBeNull()
    expect(panel.contributingReposCount).toBe(0)
  })
})
