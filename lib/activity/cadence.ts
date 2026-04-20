import type { ActivityCadenceMetrics, ActivityWindowDays, TrendComparisonMetrics, TrendComparisonMode, Unavailable } from '@/lib/analyzer/analysis-result'

export interface BuildCadenceInput {
  commitTimestamps: string[]
  now: Date
  windowDays: ActivityWindowDays
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const TREND_FLAT_DELTA = 0.05
const TREND_MODE_DAYS: Record<Exclude<TrendComparisonMode, 'day'>, number> = {
  month: 30,
  week: 7,
}

export function buildActivityCadenceMetrics({ commitTimestamps, now, windowDays }: BuildCadenceInput): ActivityCadenceMetrics {
  const allTimestamps = commitTimestamps
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value) && value <= now.getTime())
    .sort((a, b) => a - b)
  const windowStart = new Date(now.getTime() - windowDays * MS_PER_DAY)
  const timestamps = allTimestamps.filter((value) => value >= windowStart.getTime())

  if (timestamps.length === 0) {
    return unavailableCadence()
  }

  const totalWeeks = Math.ceil(windowDays / 7)
  const weeklyCommitCounts = Array.from({ length: totalWeeks }, () => 0)
  const weekendCommitCount = timestamps.filter((value) => isWeekend(value)).length
  const weekdayCommitCount = timestamps.length - weekendCommitCount

  for (const timestamp of timestamps) {
    const bucket = Math.min(totalWeeks - 1, Math.floor((timestamp - windowStart.getTime()) / (7 * MS_PER_DAY)))
    weeklyCommitCounts[Math.max(0, bucket)] += 1
  }

  const activeWeekCount = weeklyCommitCounts.filter((count) => count > 0).length
  const activeWeeksRatio = activeWeekCount / totalWeeks
  const commitRegularity = computeCoefficientOfVariation(weeklyCommitCounts)
  const longestGapDays = timestamps.length >= 2 ? computeLongestGapDays(timestamps) : 'unavailable'
  const weekendToWeekdayRatio =
    weekdayCommitCount > 0 ? weekendCommitCount / weekdayCommitCount : weekendCommitCount > 0 ? weekendCommitCount : 'unavailable'

  return {
    totalWeeks,
    weeklyCommitCounts,
    activeWeeksRatio,
    commitRegularity,
    longestGapDays,
    weekendToWeekdayRatio,
    weekendCommitCount,
    weekdayCommitCount,
    trendComparisons: buildTrendComparisons(allTimestamps, now),
  }
}

function unavailableCadence(): ActivityCadenceMetrics {
  return {
    totalWeeks: 'unavailable',
    weeklyCommitCounts: 'unavailable',
    activeWeeksRatio: 'unavailable',
    commitRegularity: 'unavailable',
    longestGapDays: 'unavailable',
    weekendToWeekdayRatio: 'unavailable',
    weekendCommitCount: 'unavailable',
    weekdayCommitCount: 'unavailable',
    trendComparisons: 'unavailable',
  }
}

function computeCoefficientOfVariation(values: number[]): number | Unavailable {
  if (values.length === 0) return 'unavailable'
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  if (mean <= 0) return 'unavailable'
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  return Math.sqrt(variance) / mean
}

function computeLongestGapDays(timestamps: number[]): number {
  let longest = 0
  for (let index = 1; index < timestamps.length; index += 1) {
    const gap = Math.round((timestamps[index]! - timestamps[index - 1]!) / MS_PER_DAY)
    if (gap > longest) longest = gap
  }
  return longest
}

function buildTrendComparisons(
  timestamps: number[],
  now: Date,
): Record<TrendComparisonMode, TrendComparisonMetrics> {
  return {
    month: buildRollingTrendComparison(timestamps, now, TREND_MODE_DAYS.month),
    week: buildRollingTrendComparison(timestamps, now, TREND_MODE_DAYS.week),
    day: buildDayTrendComparison(timestamps, now),
  }
}

function buildRollingTrendComparison(
  timestamps: number[],
  now: Date,
  periodDays: number,
): TrendComparisonMetrics {
  const currentStart = now.getTime() - periodDays * MS_PER_DAY
  const previousStart = now.getTime() - periodDays * 2 * MS_PER_DAY
  const currentPeriodCommitCount = countCommitsInRange(timestamps, currentStart, now.getTime() + 1)
  const previousPeriodCommitCount = countCommitsInRange(timestamps, previousStart, currentStart)
  return buildTrendComparisonMetrics(currentPeriodCommitCount, previousPeriodCommitCount)
}

function buildDayTrendComparison(timestamps: number[], now: Date): TrendComparisonMetrics {
  const currentDayEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const currentDayStart = currentDayEnd - MS_PER_DAY
  const previousDayStart = currentDayStart - MS_PER_DAY
  const currentPeriodCommitCount = countCommitsInRange(timestamps, currentDayStart, currentDayEnd)
  const previousPeriodCommitCount = countCommitsInRange(timestamps, previousDayStart, currentDayStart)
  return buildTrendComparisonMetrics(currentPeriodCommitCount, previousPeriodCommitCount)
}

function countCommitsInRange(timestamps: number[], startInclusive: number, endExclusive: number): number {
  return timestamps.filter((timestamp) => timestamp >= startInclusive && timestamp < endExclusive).length
}

function buildTrendComparisonMetrics(
  currentPeriodCommitCount: number,
  previousPeriodCommitCount: number,
): TrendComparisonMetrics {
  const delta = computeTrendDelta(currentPeriodCommitCount, previousPeriodCommitCount)
  return {
    currentPeriodCommitCount,
    previousPeriodCommitCount,
    delta,
    direction: computeTrendDirection(delta),
  }
}

function computeTrendDelta(current: number, previous: number): number | Unavailable {
  if (current === 0 && previous === 0) return 'unavailable'
  if (previous === 0) return current > 0 ? 1 : 'unavailable'
  return (current - previous) / previous
}

function computeTrendDirection(delta: number | Unavailable): TrendComparisonMetrics['direction'] {
  if (delta === 'unavailable') return 'unavailable'
  if (Math.abs(delta) <= TREND_FLAT_DELTA) return 'flat'
  return delta > 0 ? 'accelerating' : 'decelerating'
}

function isWeekend(timestamp: number): boolean {
  const day = new Date(timestamp).getUTCDay()
  return day === 0 || day === 6
}
