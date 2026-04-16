import type { UpdateCadence } from '@/lib/org-aggregation/types'

export const ORG_AGGREGATION_CONFIG = {
  concurrency: {
    default: 3,
    min: 1,
    max: 10,
    secondaryRateLimitBackoffFactor: 0.5,
  },
  largeOrgWarningThreshold: 25,
  updateCadenceDefault: { kind: 'every-n-percent', percentStep: 10 } as UpdateCadence,
  // Valid percent-step options for the pre-run dialog dropdown (US3).
  updateCadencePercentOptions: [5, 10, 20, 25] as const,
  quoteRotationIntervalMs: 6_000,
  wallClockTickIntervalMs: 1_000,
  inactiveRepoWindowMonths: 12,
  preFilters: {
    excludeArchivedByDefault: true,
    excludeForksByDefault: true,
  },
} as const

export function clampConcurrency(requested: number): number {
  const { min, max, default: fallback } = ORG_AGGREGATION_CONFIG.concurrency
  if (!Number.isFinite(requested)) return fallback
  const truncated = Math.trunc(requested)
  return Math.min(Math.max(truncated, min), max)
}

export function applySecondaryBackoff(current: number): number {
  const { secondaryRateLimitBackoffFactor, min } = ORG_AGGREGATION_CONFIG.concurrency
  return Math.max(min, Math.floor(current * secondaryRateLimitBackoffFactor))
}

export function isLargeOrg(repoCount: number): boolean {
  return repoCount >= ORG_AGGREGATION_CONFIG.largeOrgWarningThreshold
}
