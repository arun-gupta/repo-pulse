import { describe, expect, it } from 'vitest'
import { buildContributorsViewModels } from './view-model'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'

describe('contributors/view-model', () => {
  it('builds core and sustainability rows for each repository', () => {
    const section = buildContributorsViewModels([
      buildResult({
        commitCountsByAuthor: {
          'login:alice': 4,
          'login:bob': 3,
          'login:carol': 2,
          'login:dave': 1,
          'login:erin': 1,
        },
        uniqueCommitAuthors90d: 5,
      }),
    ])[0]!

    expect(section.repo).toBe('facebook/react')
    expect(section.coreMetrics.find((metric) => metric.label === 'Active contributors (90d)')?.value).toBe('5')
    expect(section.coreMetrics.find((metric) => metric.label === 'Repeat contributors (90d)')?.value).toBe('3')
    expect(section.coreMetrics.find((metric) => metric.label === 'Contribution concentration')).toBeUndefined()
    expect(section.heatmap[0]?.contributor).toBe('alice')
    expect(section.heatmap.map((cell) => cell.intensity)).toEqual(['max', 'higher', 'high', 'low', 'low'])
    expect(section.sustainabilityMetrics.find((metric) => metric.label === 'Top 20% contributor share')?.value).toBe('36.4%')
    expect(section.sustainabilityMetrics.find((metric) => metric.label === 'Scored contributor group')?.value).toBe('1 of 5 active contributors')
  })

  it('keeps unavailable contributor values explicit', () => {
    const section = buildContributorsViewModels([buildResult({ commitCountsByAuthor: 'unavailable' })])[0]!

    expect(section.coreMetrics.find((metric) => metric.label === 'Contribution concentration')).toBeUndefined()
    expect(section.heatmap).toEqual([])
    expect(section.sustainabilityScore.value).toBe('Insufficient verified public data')
    expect(section.missingData).toContain('Contribution concentration')
  })
})

function buildResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    repo: 'facebook/react',
    name: 'react',
    description: 'The library for web and native user interfaces.',
    createdAt: '2013-05-24T16:15:54Z',
    primaryLanguage: 'TypeScript',
    stars: 100,
    forks: 25,
    watchers: 10,
    commits30d: 7,
    commits90d: 18,
    releases12mo: 'unavailable',
    prsOpened90d: 4,
    prsMerged90d: 3,
    issuesOpen: 5,
    issuesClosed90d: 6,
    uniqueCommitAuthors90d: 2,
    totalContributors: 'unavailable',
    commitCountsByAuthor: {
      'login:alice': 2,
      'login:bob': 1,
    },
    issueFirstResponseTimestamps: 'unavailable',
    issueCloseTimestamps: 'unavailable',
    prMergeTimestamps: 'unavailable',
    missingFields: [],
    ...overrides,
  }
}
