import { describe, expect, it } from 'vitest'
import { composeMissingData, type PanelMissingRecord } from './missing-data'

describe('composeMissingData', () => {
  it('returns empty array when no records', () => {
    expect(composeMissingData([])).toEqual([])
  })

  it('merges per-panel unavailable records into one org-level list', () => {
    const records: PanelMissingRecord[] = [
      { repo: 'o/a', signalKey: 'scorecard', reason: 'scorecard not published' },
      { repo: 'o/a', signalKey: 'governanceMd', reason: 'no GOVERNANCE.md' },
    ]
    const out = composeMissingData(records)
    expect(out).toHaveLength(2)
  })

  it('deduplicates the same (repo, signalKey) pair even if multiple panels report it (FR-033 invariant 6)', () => {
    const records: PanelMissingRecord[] = [
      { repo: 'o/a', signalKey: 'commitCountsByAuthor', reason: 'API field unavailable' },
      { repo: 'o/a', signalKey: 'commitCountsByAuthor', reason: 'API field unavailable' },
      { repo: 'o/b', signalKey: 'commitCountsByAuthor', reason: 'API field unavailable' },
    ]
    const out = composeMissingData(records)
    expect(out).toHaveLength(2)
    expect(out.filter((e) => e.repo === 'o/a')).toHaveLength(1)
  })

  it('preserves the first reason when duplicates have different reasons', () => {
    const records: PanelMissingRecord[] = [
      { repo: 'o/a', signalKey: 'scorecard', reason: 'first reason' },
      { repo: 'o/a', signalKey: 'scorecard', reason: 'second reason' },
    ]
    const out = composeMissingData(records)
    expect(out).toHaveLength(1)
    expect(out[0]!.reason).toBe('first reason')
  })

  it('sorts output by repo then signalKey for deterministic rendering', () => {
    const records: PanelMissingRecord[] = [
      { repo: 'o/z', signalKey: 'scorecard', reason: 'x' },
      { repo: 'o/a', signalKey: 'scorecard', reason: 'x' },
      { repo: 'o/a', signalKey: 'commitCountsByAuthor', reason: 'x' },
    ]
    const out = composeMissingData(records)
    expect(out.map((e) => `${e.repo}:${e.signalKey}`)).toEqual([
      'o/a:commitCountsByAuthor',
      'o/a:scorecard',
      'o/z:scorecard',
    ])
  })
})
