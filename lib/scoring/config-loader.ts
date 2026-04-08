import calibrationData from './calibration-data.json'
import type { Unavailable } from '@/lib/analyzer/analysis-result'

export type BracketKey = 'emerging' | 'growing' | 'established' | 'popular'

export interface PercentileSet {
  p25: number
  p50: number
  p75: number
  p90: number
}

export interface BracketCalibration {
  sampleSize: number
  stars: PercentileSet
  forks: PercentileSet
  watchers: PercentileSet
  forkRate: PercentileSet
  watcherRate: PercentileSet
  prMergeRate: PercentileSet
  issueClosureRate: PercentileSet
  staleIssueRatio: PercentileSet
  stalePrRatio: PercentileSet
  medianTimeToMergeHours: PercentileSet
  medianTimeToCloseHours: PercentileSet
  issueFirstResponseMedianHours: PercentileSet
  issueFirstResponseP90Hours: PercentileSet
  prFirstReviewMedianHours: PercentileSet
  prFirstReviewP90Hours: PercentileSet
  issueResolutionMedianHours: PercentileSet
  issueResolutionP90Hours: PercentileSet
  prMergeMedianHours: PercentileSet
  prMergeP90Hours: PercentileSet
  issueResolutionRate: PercentileSet
  contributorResponseRate: PercentileSet
  humanResponseRatio: PercentileSet
  botResponseRatio: PercentileSet
  prReviewDepth: PercentileSet
  issuesClosedWithoutCommentRatio: PercentileSet
  topContributorShare: PercentileSet
}

export function getBracket(stars: number | Unavailable): BracketKey {
  if (stars === 'unavailable' || stars < 100) return 'emerging'
  if (stars < 1000) return 'growing'
  if (stars < 10000) return 'established'
  return 'popular'
}

export function getCalibration(bracket: BracketKey): BracketCalibration {
  return calibrationData.brackets[bracket] as BracketCalibration
}

export function getCalibrationForStars(stars: number | Unavailable): BracketCalibration {
  return getCalibration(getBracket(stars))
}

export function getCalibrationMeta() {
  return {
    generated: calibrationData.generated,
    source: calibrationData.source,
    sampleSizes: calibrationData.sampleSizes,
  }
}
