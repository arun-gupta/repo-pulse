import { describe, expect, it } from 'vitest'
import {
  formatMaturityAge,
  formatNormalizedRate,
  formatGrowthTrajectory,
  trajectoryToOrdinal,
} from './format'

describe('formatMaturityAge', () => {
  it('returns em-dash for unavailable', () => {
    expect(formatMaturityAge('unavailable')).toBe('—')
  })

  it('returns em-dash for undefined', () => {
    expect(formatMaturityAge(undefined)).toBe('—')
  })

  it('formats values under 30 days as days', () => {
    expect(formatMaturityAge(0)).toBe('0 d')
    expect(formatMaturityAge(1)).toBe('1 d')
    expect(formatMaturityAge(29)).toBe('29 d')
  })

  it('formats values 30–364 days as months', () => {
    expect(formatMaturityAge(30)).toBe('1 mo')
    expect(formatMaturityAge(91)).toBe('3 mo')
    expect(formatMaturityAge(364)).toBe('12 mo')
  })

  it('formats values >= 365 as years with one decimal', () => {
    expect(formatMaturityAge(365)).toBe('1.0 yr')
    expect(formatMaturityAge(730)).toBe('2.0 yr')
  })

  it('formats values >= 10 years without decimal', () => {
    // 3660 / 365.25 ≈ 10.02 yr → toFixed(0)
    expect(formatMaturityAge(3660)).toBe('10 yr')
    // 7320 / 365.25 ≈ 20.04 yr → toFixed(0)
    expect(formatMaturityAge(7320)).toBe('20 yr')
  })
})

describe('formatNormalizedRate', () => {
  it('returns em-dash for undefined', () => {
    expect(formatNormalizedRate(undefined, '/yr')).toBe('—')
  })

  it('returns em-dash for unavailable', () => {
    expect(formatNormalizedRate('unavailable', '/yr')).toBe('—')
  })

  it('returns "Too new to normalize" for too-new', () => {
    expect(formatNormalizedRate('too-new', '/yr')).toBe('Too new to normalize')
    expect(formatNormalizedRate('too-new', '/mo')).toBe('Too new to normalize')
  })

  it('formats values >= 100 without decimals', () => {
    expect(formatNormalizedRate(100, '/yr')).toBe('100 /yr')
    expect(formatNormalizedRate(1000, '/mo')).toBe('1,000 /mo')
  })

  it('formats values < 100 with one decimal', () => {
    expect(formatNormalizedRate(12.5, '/yr')).toBe('12.5 /yr')
    expect(formatNormalizedRate(0.3, '/mo')).toBe('0.3 /mo')
  })
})

describe('formatGrowthTrajectory', () => {
  it('returns placeholder for undefined', () => {
    expect(formatGrowthTrajectory(undefined)).toBe('Insufficient verified public data')
  })

  it('returns placeholder for unavailable', () => {
    expect(formatGrowthTrajectory('unavailable')).toBe('Insufficient verified public data')
  })

  it('capitalises trajectory values', () => {
    expect(formatGrowthTrajectory('accelerating')).toBe('Accelerating')
    expect(formatGrowthTrajectory('stable')).toBe('Stable')
    expect(formatGrowthTrajectory('declining')).toBe('Declining')
  })
})

describe('trajectoryToOrdinal', () => {
  it('returns 2 for accelerating', () => {
    expect(trajectoryToOrdinal('accelerating')).toBe(2)
  })

  it('returns 1 for stable', () => {
    expect(trajectoryToOrdinal('stable')).toBe(1)
  })

  it('returns 0 for declining', () => {
    expect(trajectoryToOrdinal('declining')).toBe(0)
  })

  it('returns unavailable for unavailable', () => {
    expect(trajectoryToOrdinal('unavailable')).toBe('unavailable')
  })

  it('returns unavailable for undefined', () => {
    expect(trajectoryToOrdinal(undefined)).toBe('unavailable')
  })

  it('ordinals are sort-stable (accelerating > stable > declining)', () => {
    const declining = trajectoryToOrdinal('declining')
    const stable = trajectoryToOrdinal('stable')
    const accelerating = trajectoryToOrdinal('accelerating')
    expect(typeof declining).toBe('number')
    expect(typeof stable).toBe('number')
    expect(typeof accelerating).toBe('number')
    expect(Number(declining)).toBeLessThan(Number(stable))
    expect(Number(stable)).toBeLessThan(Number(accelerating))
  })
})
