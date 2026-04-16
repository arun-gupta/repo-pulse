import { describe, expect, it } from 'vitest'
import {
  ORG_AGGREGATION_CONFIG,
  applySecondaryBackoff,
  clampConcurrency,
  isLargeOrg,
} from './org-aggregation'

describe('ORG_AGGREGATION_CONFIG', () => {
  it('exposes concurrency bounds with default between min and max', () => {
    const { min, max, default: def } = ORG_AGGREGATION_CONFIG.concurrency
    expect(min).toBeGreaterThanOrEqual(1)
    expect(max).toBeLessThanOrEqual(10)
    expect(min).toBeLessThanOrEqual(def)
    expect(def).toBeLessThanOrEqual(max)
  })

  it('has a secondary backoff factor strictly between 0 and 1', () => {
    const factor = ORG_AGGREGATION_CONFIG.concurrency.secondaryRateLimitBackoffFactor
    expect(factor).toBeGreaterThan(0)
    expect(factor).toBeLessThan(1)
  })

  it('has all required top-level keys', () => {
    const keys = Object.keys(ORG_AGGREGATION_CONFIG)
    expect(keys).toContain('concurrency')
    expect(keys).toContain('largeOrgWarningThreshold')
    expect(keys).toContain('updateCadenceDefault')
    expect(keys).toContain('quoteRotationIntervalMs')
    expect(keys).toContain('wallClockTickIntervalMs')
    expect(keys).toContain('inactiveRepoWindowMonths')
    expect(keys).toContain('preFilters')
  })

  it('has both archived and forks excluded by default per FR-036', () => {
    expect(ORG_AGGREGATION_CONFIG.preFilters.excludeArchivedByDefault).toBe(true)
    expect(ORG_AGGREGATION_CONFIG.preFilters.excludeForksByDefault).toBe(true)
  })

  it('defaults update cadence to every 10% completion per FR-016a', () => {
    expect(ORG_AGGREGATION_CONFIG.updateCadenceDefault).toEqual({
      kind: 'every-n-percent',
      percentStep: 10,
    })
  })

  it('exposes the percent-step options offered in the pre-run dialog', () => {
    expect(ORG_AGGREGATION_CONFIG.updateCadencePercentOptions).toContain(10)
  })
})

describe('clampConcurrency', () => {
  it('clamps below-min to min', () => {
    expect(clampConcurrency(0)).toBe(ORG_AGGREGATION_CONFIG.concurrency.min)
    expect(clampConcurrency(-5)).toBe(ORG_AGGREGATION_CONFIG.concurrency.min)
  })

  it('clamps above-max to max', () => {
    expect(clampConcurrency(999)).toBe(ORG_AGGREGATION_CONFIG.concurrency.max)
  })

  it('truncates floats and accepts values in range', () => {
    expect(clampConcurrency(3.9)).toBe(3)
    expect(clampConcurrency(5)).toBe(5)
  })

  it('returns default for non-finite input', () => {
    expect(clampConcurrency(NaN)).toBe(ORG_AGGREGATION_CONFIG.concurrency.default)
    expect(clampConcurrency(Infinity)).toBe(ORG_AGGREGATION_CONFIG.concurrency.default)
  })
})

describe('applySecondaryBackoff', () => {
  it('halves concurrency rounded down on secondary limit per FR-003e', () => {
    expect(applySecondaryBackoff(4)).toBe(2)
    expect(applySecondaryBackoff(5)).toBe(2)
    expect(applySecondaryBackoff(3)).toBe(1)
  })

  it('never drops below min', () => {
    expect(applySecondaryBackoff(1)).toBe(ORG_AGGREGATION_CONFIG.concurrency.min)
  })
})

describe('isLargeOrg', () => {
  it('returns true at or above the warning threshold', () => {
    const t = ORG_AGGREGATION_CONFIG.largeOrgWarningThreshold
    expect(isLargeOrg(t)).toBe(true)
    expect(isLargeOrg(t + 1)).toBe(true)
  })

  it('returns false below the threshold', () => {
    expect(isLargeOrg(0)).toBe(false)
    expect(isLargeOrg(ORG_AGGREGATION_CONFIG.largeOrgWarningThreshold - 1)).toBe(false)
  })
})
