import type { FlagshipMarker } from './types'

export interface PinnedRepoApiEntry {
  owner: string
  name: string
  stars: number | 'unavailable'
  rank: number
}

/**
 * Resolve flagship repos for an org-aggregation run per FR-011a.
 *
 * 1. Primary: pinned ∩ runRepos, preserving the pin rank.
 * 2. If intersection is empty and at least one run-repo has a numeric star
 *    count, fall back to the single highest-star repo in the run.
 * 3. If no pinned items AND every repo's stars are unavailable, return [].
 *
 * Pure function. No I/O.
 */
export function selectFlagshipRepos(
  pinned: PinnedRepoApiEntry[],
  runRepos: string[],
  perRepoStars: ReadonlyMap<string, number | 'unavailable'>,
): FlagshipMarker[] {
  if (runRepos.length === 0) return []

  const runSet = new Set(runRepos)
  const intersection = pinned
    .map((p) => ({ repo: `${p.owner}/${p.name}`, rank: p.rank }))
    .filter((p) => runSet.has(p.repo))

  if (intersection.length > 0) {
    return intersection
      .sort((a, b) => a.rank - b.rank)
      .map<FlagshipMarker>((p) => ({ repo: p.repo, source: 'pinned', rank: p.rank }))
  }

  // Fallback: single most-stars repo in the run.
  let best: { repo: string; stars: number } | null = null
  for (const repo of runRepos) {
    const stars = perRepoStars.get(repo)
    if (typeof stars === 'number') {
      if (!best || stars > best.stars) {
        best = { repo, stars }
      }
    }
  }

  if (best) {
    return [{ repo: best.repo, source: 'fallback-most-stars' }]
  }

  return []
}
