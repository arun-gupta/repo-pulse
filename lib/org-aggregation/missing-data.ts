import type { MissingDataEntry, SignalKey } from './types'

/**
 * A single (repo, signalKey, reason) record emitted by any aggregator that
 * encountered an `unavailable` input for that repo. Multiple aggregators may
 * emit records for the same (repo, signalKey) pair; `composeMissingData`
 * deduplicates them per FR-033 invariant 6.
 */
export interface PanelMissingRecord {
  repo: string
  signalKey: SignalKey
  reason: string
}

/**
 * Consolidate per-panel `unavailable` records into the org-level missing-data
 * panel (FR-033). Each (repo, signalKey) pair appears exactly once. Output is
 * sorted by repo then signalKey for deterministic rendering across reruns.
 */
export function composeMissingData(records: PanelMissingRecord[]): MissingDataEntry[] {
  const seen = new Map<string, MissingDataEntry>()
  for (const r of records) {
    const key = `${r.repo}\u0000${r.signalKey}`
    if (!seen.has(key)) {
      seen.set(key, { repo: r.repo, signalKey: r.signalKey, reason: r.reason })
    }
  }
  const out = Array.from(seen.values())
  out.sort((a, b) => {
    if (a.repo !== b.repo) return a.repo < b.repo ? -1 : 1
    if (a.signalKey !== b.signalKey) return a.signalKey < b.signalKey ? -1 : 1
    return 0
  })
  return out
}
