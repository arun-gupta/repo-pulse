import type { AnalysisResult } from '@/lib/analyzer/analysis-result'

export interface EcosystemMapProps {
  results: AnalysisResult[]
}

export interface EcosystemBubbleViewModel {
  repo: string
  stars: number | 'unavailable'
  forks: number | 'unavailable'
  watchers: number | 'unavailable'
  classification: 'Leaders' | 'Buzz' | 'Builders' | 'Early' | null
  isPlotEligible: boolean
  missingEcosystemMetrics: Array<'stars' | 'forks' | 'watchers'>
}

export interface QuadrantBoundaryViewModel {
  starMedian: number | null
  forkMedian: number | null
  classificationEnabled: boolean
  classificationReason: string | null
}
