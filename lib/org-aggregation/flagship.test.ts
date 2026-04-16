import { describe, expect, it } from 'vitest'
import { selectFlagshipRepos, type PinnedRepoApiEntry } from './flagship'

describe('selectFlagshipRepos', () => {
  it('returns pinned ∩ runRepos preserving rank (FR-011a.a)', () => {
    const pinned: PinnedRepoApiEntry[] = [
      { owner: 'o', name: 'a', stars: 100, rank: 0 },
      { owner: 'o', name: 'b', stars: 50, rank: 1 },
      { owner: 'o', name: 'c', stars: 10, rank: 2 },
    ]
    const runRepos = ['o/b', 'o/c', 'o/d']
    const perRepoStars = new Map([['o/b', 50], ['o/c', 10], ['o/d', 5]])
    const out = selectFlagshipRepos(pinned, runRepos, perRepoStars)
    expect(out).toEqual([
      { repo: 'o/b', source: 'pinned', rank: 1 },
      { repo: 'o/c', source: 'pinned', rank: 2 },
    ])
  })

  it('falls back to single most-stars repo when no pinned items (FR-011a.b)', () => {
    const runRepos = ['o/a', 'o/b', 'o/c']
    const perRepoStars = new Map<string, number | 'unavailable'>([
      ['o/a', 10],
      ['o/b', 200],
      ['o/c', 50],
    ])
    const out = selectFlagshipRepos([], runRepos, perRepoStars)
    expect(out).toEqual([{ repo: 'o/b', source: 'fallback-most-stars' }])
  })

  it('returns empty when no pinned AND every repo has unavailable stars (FR-011a.d)', () => {
    const runRepos = ['o/a', 'o/b']
    const perRepoStars = new Map<string, number | 'unavailable'>([
      ['o/a', 'unavailable'],
      ['o/b', 'unavailable'],
    ])
    const out = selectFlagshipRepos([], runRepos, perRepoStars)
    expect(out).toEqual([])
  })

  it('ignores pinned repos that are not in the current run (intersection only)', () => {
    const pinned: PinnedRepoApiEntry[] = [
      { owner: 'o', name: 'not-in-run', stars: 100, rank: 0 },
    ]
    const runRepos = ['o/a']
    const perRepoStars = new Map([['o/a', 1]])
    const out = selectFlagshipRepos(pinned, runRepos, perRepoStars)
    // pinned intersects to empty, so we fall back to most-stars in the run
    expect(out).toEqual([{ repo: 'o/a', source: 'fallback-most-stars' }])
  })

  it('returns empty when runRepos is empty', () => {
    expect(selectFlagshipRepos([], [], new Map())).toEqual([])
  })
})
