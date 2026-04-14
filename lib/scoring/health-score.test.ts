import { describe, expect, it } from 'vitest'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import { WEIGHTS, getHealthScore } from './health-score'

function buildResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    repo: 'foo/bar',
    name: 'bar',
    description: '—',
    createdAt: '2024-01-01T00:00:00Z',
    primaryLanguage: 'TypeScript',
    stars: 100,
    forks: 10,
    watchers: 5,
    commits30d: 5,
    commits90d: 15,
    releases12mo: 2,
    prsOpened90d: 3,
    prsMerged90d: 2,
    issuesOpen: 4,
    issuesClosed90d: 3,
    uniqueCommitAuthors90d: 4,
    totalContributors: 10,
    maintainerCount: 2,
    commitCountsByAuthor: { 'login:alice': 5 },
    commitCountsByExperimentalOrg: 'unavailable',
    experimentalAttributedAuthors90d: 'unavailable',
    experimentalUnattributedAuthors90d: 'unavailable',
    issueFirstResponseTimestamps: 'unavailable',
    issueCloseTimestamps: 'unavailable',
    prMergeTimestamps: 'unavailable',
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

describe('health-score WEIGHTS constants', () => {
  // SC-002: The composite OSS Health Score weights must be unchanged after
  // the Community scoring feature (P2-F05 / #70). Community is a lens, not a
  // composite-weighted bucket. This test is a regression guard so any future
  // change to the composite weights is intentional and reviewed.
  it('matches the constitutionally-preserved composite weights', () => {
    expect(WEIGHTS).toEqual({
      activity: 0.25,
      responsiveness: 0.25,
      contributors: 0.23,
      documentation: 0.12,
      security: 0.15,
    })
  })

  it('composite weights sum to 1.00', () => {
    const total = WEIGHTS.activity + WEIGHTS.responsiveness + WEIGHTS.contributors
      + WEIGHTS.documentation + WEIGHTS.security
    expect(total).toBeCloseTo(1, 10)
  })
})

describe('health-score community-lens recommendations', () => {
  it('emits CTR-3 (file:funding) when hasFundingConfig is verifiably false', () => {
    const result = buildResult({ hasFundingConfig: false })
    const recs = getHealthScore(result).recommendations
    const funding = recs.find((r) => r.key === 'file:funding')
    expect(funding).toBeDefined()
    expect(funding?.bucket).toBe('Contributors')
    expect(funding?.tab).toBe('contributors')
    expect(funding?.message).toMatch(/FUNDING\.yml/i)
  })

  it('does NOT emit CTR-3 when hasFundingConfig is true', () => {
    const result = buildResult({ hasFundingConfig: true })
    const recs = getHealthScore(result).recommendations
    expect(recs.find((r) => r.key === 'file:funding')).toBeUndefined()
  })

  it('does NOT emit CTR-3 when hasFundingConfig is undefined (unknown state, never guess)', () => {
    const result = buildResult({})
    const recs = getHealthScore(result).recommendations
    expect(recs.find((r) => r.key === 'file:funding')).toBeUndefined()
  })

  it('emits ACT-5 (feature:discussions_enabled) when Discussions is verifiably disabled', () => {
    const result = buildResult({ hasDiscussionsEnabled: false })
    const recs = getHealthScore(result).recommendations
    const discussions = recs.find((r) => r.key === 'feature:discussions_enabled')
    expect(discussions).toBeDefined()
    expect(discussions?.bucket).toBe('Activity')
    expect(discussions?.tab).toBe('activity')
    expect(discussions?.message).toMatch(/GitHub Discussions/i)
  })

  it('does NOT emit ACT-5 when Discussions is enabled', () => {
    const result = buildResult({ hasDiscussionsEnabled: true })
    const recs = getHealthScore(result).recommendations
    expect(recs.find((r) => r.key === 'feature:discussions_enabled')).toBeUndefined()
  })

  it('does NOT emit ACT-5 when hasDiscussionsEnabled is undefined (unknown state)', () => {
    const result = buildResult({})
    const recs = getHealthScore(result).recommendations
    expect(recs.find((r) => r.key === 'feature:discussions_enabled')).toBeUndefined()
  })
})
