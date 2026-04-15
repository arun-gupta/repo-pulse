import type { AnalysisResult } from '@/lib/analyzer/analysis-result'

export type SoloCriterion =
  | 'totalContributors'
  | 'uniqueCommitAuthors90d'
  | 'maintainerCount'
  | 'noGovernance'

export interface SoloProjectDetection {
  isSolo: boolean
  trippedCount: number
  tripped: Record<SoloCriterion, boolean>
}

export const SOLO_WEIGHTS = {
  activity: 0.30,
  security: 0.35,
  documentation: 0.35,
} as const

export function detectSoloProjectProfile(result: AnalysisResult): SoloProjectDetection {
  const tripped: Record<SoloCriterion, boolean> = {
    totalContributors:
      result.totalContributors !== 'unavailable' && result.totalContributors <= 2,
    uniqueCommitAuthors90d:
      result.uniqueCommitAuthors90d !== 'unavailable' && result.uniqueCommitAuthors90d <= 2,
    maintainerCount:
      result.maintainerCount === 'unavailable'
      || (typeof result.maintainerCount === 'number' && result.maintainerCount <= 1),
    noGovernance: !hasGovernanceFile(result),
  }

  const trippedCount = Object.values(tripped).filter(Boolean).length
  return { isSolo: trippedCount >= 3, trippedCount, tripped }
}

function hasGovernanceFile(result: AnalysisResult): boolean {
  if (result.documentationResult === 'unavailable') return false
  const governance = result.documentationResult.fileChecks.find((f) => f.name === 'governance')
  return governance?.found === true
}
