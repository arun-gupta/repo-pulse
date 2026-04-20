import { describe, expect, it } from 'vitest'
import { buildActivityCadenceMetrics } from './cadence'

const NOW = new Date('2026-04-20T12:00:00.000Z')

describe('buildActivityCadenceMetrics', () => {
  it('builds weekly buckets including zero-commit weeks and active weeks ratio', () => {
    const result = buildActivityCadenceMetrics({
      now: NOW,
      windowDays: 30,
      commitTimestamps: [
        '2026-04-18T10:00:00.000Z',
        '2026-04-17T10:00:00.000Z',
        '2026-04-09T10:00:00.000Z',
        '2026-03-26T10:00:00.000Z',
      ],
    })

    expect(result.totalWeeks).toBe(5)
    expect(result.weeklyCommitCounts).toEqual([1, 0, 1, 2, 0])
    expect(result.activeWeeksRatio).toBeCloseTo(0.6, 5)
  })

  it('marks a steady repo as more regular than a bursty repo', () => {
    const steady = buildActivityCadenceMetrics({
      now: NOW,
      windowDays: 30,
      commitTimestamps: [
        '2026-04-18T10:00:00.000Z',
        '2026-04-12T10:00:00.000Z',
        '2026-04-05T10:00:00.000Z',
        '2026-03-30T10:00:00.000Z',
      ],
    })
    const bursty = buildActivityCadenceMetrics({
      now: NOW,
      windowDays: 30,
      commitTimestamps: [
        '2026-04-18T10:00:00.000Z',
        '2026-04-18T09:00:00.000Z',
        '2026-04-18T08:00:00.000Z',
        '2026-03-30T10:00:00.000Z',
      ],
    })

    expect(typeof steady.commitRegularity).toBe('number')
    expect(typeof bursty.commitRegularity).toBe('number')
    expect((steady.commitRegularity as number)).toBeLessThan(bursty.commitRegularity as number)
  })

  it('computes longest gap, weekend ratio, and trend direction', () => {
    const result = buildActivityCadenceMetrics({
      now: NOW,
      windowDays: 90,
      commitTimestamps: [
        '2026-04-19T10:00:00.000Z', // Sunday
        '2026-04-12T10:00:00.000Z', // Sunday
        '2026-04-01T10:00:00.000Z', // Wednesday
        '2026-03-11T10:00:00.000Z', // Wednesday
        '2026-03-09T10:00:00.000Z', // Monday
        '2026-02-10T10:00:00.000Z', // Tuesday
      ],
    })

    expect(result.longestGapDays).toBe(27)
    expect(result.weekendCommitCount).toBe(2)
    expect(result.weekdayCommitCount).toBe(4)
    expect(result.weekendToWeekdayRatio).toBe(0.5)
    expect(result.trendComparisons).not.toBe('unavailable')
    expect(result.trendComparisons === 'unavailable' ? null : result.trendComparisons.month.currentPeriodCommitCount).toBe(3)
    expect(result.trendComparisons === 'unavailable' ? null : result.trendComparisons.month.previousPeriodCommitCount).toBe(2)
    expect(result.trendComparisons === 'unavailable' ? null : result.trendComparisons.month.direction).toBe('accelerating')
  })

  it('returns unavailable values when there is not enough verified history', () => {
    const empty = buildActivityCadenceMetrics({
      now: NOW,
      windowDays: 30,
      commitTimestamps: [],
    })
    const single = buildActivityCadenceMetrics({
      now: NOW,
      windowDays: 30,
      commitTimestamps: ['2026-04-18T10:00:00.000Z'],
    })

    expect(empty.weeklyCommitCounts).toBe('unavailable')
    expect(empty.activeWeeksRatio).toBe('unavailable')
    expect(empty.trendComparisons).toBe('unavailable')
    expect(single.longestGapDays).toBe('unavailable')
  })

  it('marks small deltas as flat trend', () => {
    const result = buildActivityCadenceMetrics({
      now: NOW,
      windowDays: 90,
      commitTimestamps: [
        '2026-04-18T10:00:00.000Z',
        '2026-04-10T10:00:00.000Z',
        '2026-03-15T10:00:00.000Z',
        '2026-03-10T10:00:00.000Z',
      ],
    })

    expect(result.trendComparisons).not.toBe('unavailable')
    expect(result.trendComparisons === 'unavailable' ? null : result.trendComparisons.month.currentPeriodCommitCount).toBe(2)
    expect(result.trendComparisons === 'unavailable' ? null : result.trendComparisons.month.previousPeriodCommitCount).toBe(2)
    expect(result.trendComparisons === 'unavailable' ? null : result.trendComparisons.month.direction).toBe('flat')
    expect(result.trendComparisons === 'unavailable' ? null : result.trendComparisons.month.delta).toBe(0)
  })

  it('computes week-over-week and day-over-day comparisons from the same commit history', () => {
    const result = buildActivityCadenceMetrics({
      now: NOW,
      windowDays: 90,
      commitTimestamps: [
        '2026-04-19T10:00:00.000Z',
        '2026-04-18T10:00:00.000Z',
        '2026-04-17T10:00:00.000Z',
        '2026-04-16T10:00:00.000Z',
        '2026-04-15T10:00:00.000Z',
        '2026-04-14T10:00:00.000Z',
        '2026-04-13T10:00:00.000Z',
        '2026-04-12T10:00:00.000Z',
        '2026-04-11T10:00:00.000Z',
      ],
    })

    expect(result.trendComparisons).not.toBe('unavailable')
    if (result.trendComparisons === 'unavailable') return

    expect(result.trendComparisons.week.currentPeriodCommitCount).toBe(6)
    expect(result.trendComparisons.week.previousPeriodCommitCount).toBe(3)
    expect(result.trendComparisons.week.direction).toBe('accelerating')
    expect(result.trendComparisons.day.currentPeriodCommitCount).toBe(1)
    expect(result.trendComparisons.day.previousPeriodCommitCount).toBe(1)
    expect(result.trendComparisons.day.direction).toBe('flat')
  })

  it('uses complete UTC days for day-over-day comparisons and keeps unavailable modes explicit', () => {
    const result = buildActivityCadenceMetrics({
      now: NOW,
      windowDays: 90,
      commitTimestamps: [
        '2026-04-10T08:00:00.000Z',
        '2026-04-05T08:00:00.000Z',
      ],
    })

    expect(result.trendComparisons).not.toBe('unavailable')
    if (result.trendComparisons === 'unavailable') return

    expect(result.trendComparisons.day.currentPeriodCommitCount).toBe(0)
    expect(result.trendComparisons.day.previousPeriodCommitCount).toBe(0)
    expect(result.trendComparisons.day.delta).toBe('unavailable')
    expect(result.trendComparisons.day.direction).toBe('unavailable')
    expect(result.trendComparisons.week.direction).toBe('decelerating')
  })
})
