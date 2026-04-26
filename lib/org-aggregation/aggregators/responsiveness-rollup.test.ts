import { describe, expect, it } from 'vitest'
import type { AnalysisResult, ResponsivenessMetrics, ActivityWindowDays } from '@/lib/analyzer/analysis-result'
import { responsivenessRollupAggregator, weightedMedian } from './responsiveness-rollup'
import { buildResult } from '@/lib/testing/fixtures'

function partialResult(repo: string, override: Partial<AnalysisResult> = {}): AnalysisResult {
  return buildResult({ repo, name: repo, ...override })
}

function stubMetrics(partial: Partial<ResponsivenessMetrics>): ResponsivenessMetrics {
  return {
    issueFirstResponseMedianHours: 'unavailable',
    issueFirstResponseP90Hours: 'unavailable',
    prFirstReviewMedianHours: 'unavailable',
    prFirstReviewP90Hours: 'unavailable',
    issueResolutionMedianHours: 'unavailable',
    issueResolutionP90Hours: 'unavailable',
    prMergeMedianHours: 'unavailable',
    prMergeP90Hours: 'unavailable',
    issueResolutionRate: 'unavailable',
    contributorResponseRate: 'unavailable',
    botResponseRatio: 'unavailable',
    humanResponseRatio: 'unavailable',
    staleIssueRatio: 'unavailable',
    stalePrRatio: 'unavailable',
    prReviewDepth: 'unavailable',
    issuesClosedWithoutCommentRatio: 'unavailable',
    openIssueCount: 'unavailable',
    openPullRequestCount: 'unavailable',
    ...partial,
  }
}

const CONTEXT = { totalReposInRun: 3, flagshipRepos: [], inactiveRepoWindowMonths: 12 }

describe('responsivenessRollupAggregator — FR-021', () => {
  it('typical: computes weighted medians from multiple repos (legacy fallback fields, 90d window)', () => {
    const results = [
      partialResult('o/alpha', {
        responsivenessMetrics: stubMetrics({ issueFirstResponseMedianHours: 4, prMergeMedianHours: 24 }),
        issuesOpen: 50,
        medianTimeToMergeHours: 24,
        prsMerged90d: 10,
      }),
      partialResult('o/bravo', {
        responsivenessMetrics: stubMetrics({ issueFirstResponseMedianHours: 12, prMergeMedianHours: 48 }),
        issuesOpen: 100,
        medianTimeToMergeHours: 48,
        prsMerged90d: 20,
      }),
      partialResult('o/charlie', {
        responsivenessMetrics: stubMetrics({ issueFirstResponseMedianHours: 8, prMergeMedianHours: 36 }),
        issuesOpen: 30,
        medianTimeToMergeHours: 36,
        prsMerged90d: 5,
      }),
    ]
    const panel = responsivenessRollupAggregator(results, CONTEXT)
    expect(panel.status).toBe('final')
    expect(panel.contributingReposCount).toBe(3)
    expect(panel.panelId).toBe('responsiveness-rollup')
    expect(panel.value).not.toBeNull()
    const w90 = panel.value!.byWindow[90]
    // Weighted median: sorted by value, walk until cumulative >= total/2
    // First response: (4,50), (8,30), (12,100) => total=180, half=90
    //   cumulative: 50 < 90, 50+30=80 < 90, 80+100=180 >= 90 => 12
    expect(w90.weightedMedianFirstResponseHours).toBe(12)
    // PR merge: (24,10), (36,5), (48,20) => total=35, half=17.5
    //   cumulative: 10 < 17.5, 10+5=15 < 17.5, 15+20=35 >= 17.5 => 48
    expect(w90.weightedMedianPrMergeHours).toBe(48)
    expect(w90.contributingReposCount).toBe(3)
    expect(panel.value!.defaultWindow).toBe(90)
  })

  it('all-unavailable: every repo lacks responsiveness data -> panel is unavailable', () => {
    const results = [
      partialResult('o/alpha'),
      partialResult('o/bravo'),
    ]
    const panel = responsivenessRollupAggregator(results, { ...CONTEXT, totalReposInRun: 2 })
    expect(panel.status).toBe('unavailable')
    expect(panel.value).toBeNull()
    expect(panel.contributingReposCount).toBe(0)
  })

  it('mixed: unavailable repos excluded but available ones still contribute', () => {
    const results = [
      partialResult('o/alpha', {
        responsivenessMetrics: stubMetrics({ issueFirstResponseMedianHours: 6, prMergeMedianHours: 30 }),
        issuesOpen: 20,
        medianTimeToMergeHours: 30,
        prsMerged90d: 8,
      }),
      partialResult('o/bravo'), // all unavailable
      partialResult('o/charlie', {
        responsivenessMetrics: stubMetrics({}),
        medianTimeToMergeHours: 'unavailable',
      }),
    ]
    const panel = responsivenessRollupAggregator(results, CONTEXT)
    expect(panel.status).toBe('final')
    expect(panel.contributingReposCount).toBe(1)
    const w90 = panel.value!.byWindow[90]
    expect(w90.weightedMedianFirstResponseHours).toBe(6)
    expect(w90.weightedMedianPrMergeHours).toBe(30)
  })

  it('empty: results array is empty -> in-progress with null value', () => {
    const panel = responsivenessRollupAggregator([], { ...CONTEXT, totalReposInRun: 3 })
    expect(panel.status).toBe('in-progress')
    expect(panel.value).toBeNull()
    expect(panel.contributingReposCount).toBe(0)
  })

  it('weighted median verification: worked example with 3 repos', () => {
    // Repo A: value=2, weight=3
    // Repo B: value=5, weight=1
    // Repo C: value=10, weight=6
    // Sorted: (2,3), (5,1), (10,6) => totalWeight=10, half=5
    // cumulative: 3 < 5, 3+1=4 < 5, 4+6=10 >= 5 => median is 10
    expect(weightedMedian([
      { value: 2, weight: 3 },
      { value: 5, weight: 1 },
      { value: 10, weight: 6 },
    ])).toBe(10)

    // Another example: (1, 5), (3, 2), (7, 3) => total=10, half=5
    // cumulative: 5 >= 5 => median is 1
    expect(weightedMedian([
      { value: 1, weight: 5 },
      { value: 3, weight: 2 },
      { value: 7, weight: 3 },
    ])).toBe(1)

    // Empty pairs => null
    expect(weightedMedian([])).toBeNull()

    // All zero weights => null
    expect(weightedMedian([{ value: 5, weight: 0 }])).toBeNull()
  })

  it('uses default weight of 1 when issuesOpen/prsMerged90d is unavailable or zero', () => {
    const results = [
      partialResult('o/alpha', {
        responsivenessMetrics: stubMetrics({ issueFirstResponseMedianHours: 10, prMergeMedianHours: 20 }),
        issuesOpen: 'unavailable',
        medianTimeToMergeHours: 20,
        prsMerged90d: 0,
      }),
    ]
    const panel = responsivenessRollupAggregator(results, { ...CONTEXT, totalReposInRun: 1 })
    expect(panel.status).toBe('final')
    expect(panel.contributingReposCount).toBe(1)
    const w90 = panel.value!.byWindow[90]
    // With default weight of 1, the single value is the median
    expect(w90.weightedMedianFirstResponseHours).toBe(10)
    expect(w90.weightedMedianPrMergeHours).toBe(20)
  })

  it('windowed: uses responsivenessMetricsByWindow when available, different windows return different values', () => {
    const makeWindowedMetrics = (
      firstResponseHours: number,
      prMergeHours: number,
      openIssueCount: number,
    ): ResponsivenessMetrics => stubMetrics({
      issueFirstResponseMedianHours: firstResponseHours,
      prMergeMedianHours: prMergeHours,
      openIssueCount,
    })

    const results = [
      partialResult('o/alpha', {
        responsivenessMetricsByWindow: {
          30: makeWindowedMetrics(2, 10, 40),
          60: makeWindowedMetrics(3, 15, 45),
          90: makeWindowedMetrics(4, 20, 50),
          180: makeWindowedMetrics(6, 30, 60),
          365: makeWindowedMetrics(10, 48, 80),
        } as Record<ActivityWindowDays, ResponsivenessMetrics>,
        issuesOpen: 50,
        prsMerged90d: 10,
      }),
    ]
    const panel = responsivenessRollupAggregator(results, { ...CONTEXT, totalReposInRun: 1 })
    expect(panel.status).toBe('final')
    expect(panel.value!.byWindow[30].weightedMedianFirstResponseHours).toBe(2)
    expect(panel.value!.byWindow[30].weightedMedianPrMergeHours).toBe(10)
    expect(panel.value!.byWindow[90].weightedMedianFirstResponseHours).toBe(4)
    expect(panel.value!.byWindow[90].weightedMedianPrMergeHours).toBe(20)
    expect(panel.value!.byWindow[365].weightedMedianFirstResponseHours).toBe(10)
    expect(panel.value!.byWindow[365].weightedMedianPrMergeHours).toBe(48)
  })

  it('windowed: non-90d windows return null when responsivenessMetricsByWindow is absent', () => {
    const results = [
      partialResult('o/alpha', {
        // Only legacy fields, no responsivenessMetricsByWindow
        responsivenessMetrics: stubMetrics({ issueFirstResponseMedianHours: 8, prMergeMedianHours: 24 }),
        issuesOpen: 20,
        medianTimeToMergeHours: 24,
        prsMerged90d: 5,
      }),
    ]
    const panel = responsivenessRollupAggregator(results, { ...CONTEXT, totalReposInRun: 1 })
    expect(panel.status).toBe('final')
    // 90d falls back to legacy fields
    expect(panel.value!.byWindow[90].weightedMedianFirstResponseHours).toBe(8)
    expect(panel.value!.byWindow[90].weightedMedianPrMergeHours).toBe(24)
    // Other windows have no data
    expect(panel.value!.byWindow[30].weightedMedianFirstResponseHours).toBeNull()
    expect(panel.value!.byWindow[30].weightedMedianPrMergeHours).toBeNull()
    expect(panel.value!.byWindow[180].weightedMedianFirstResponseHours).toBeNull()
  })
})
