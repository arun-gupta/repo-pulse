import { describe, expect, it } from 'vitest'
import { WEIGHTS } from './health-score'

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
