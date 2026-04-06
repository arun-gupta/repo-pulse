import { describe, expect, it } from 'vitest'
import { getMergeRateGuidance } from './merge-rate-guidance'

describe('activity/merge-rate-guidance', () => {
  it('classifies strong merge throughput at 70% and above', () => {
    const guidance = getMergeRateGuidance(7, 10)

    expect(guidance.band).toBe('strong')
    expect(guidance.bandLabel).toBe('Strong')
    expect(guidance.tableDisplayValue).toBe('70.0% · Strong')
  })

  it('classifies mixed merge throughput from 40% to 69.9%', () => {
    const guidance = getMergeRateGuidance(2, 4)

    expect(guidance.band).toBe('mixed')
    expect(guidance.bandLabel).toBe('Mixed')
    expect(guidance.summary).toMatch(/meaningful share/i)
  })

  it('classifies weak merge throughput below 40%', () => {
    const guidance = getMergeRateGuidance(1, 5)

    expect(guidance.band).toBe('weak')
    expect(guidance.bandLabel).toBe('Weak')
    expect(guidance.recommendation).toMatch(/reduce pr backlog/i)
  })

  it('returns unavailable when opened PR count is missing', () => {
    const guidance = getMergeRateGuidance('unavailable', 'unavailable')

    expect(guidance.band).toBe('unavailable')
    expect(guidance.tableDisplayValue).toBe('—')
  })
})
