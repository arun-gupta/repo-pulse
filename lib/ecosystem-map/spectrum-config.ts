import { getCalibration } from '@/lib/scoring/config-loader'

export interface TierBand<T extends string> {
  label: T
  min: number
}

export type ReachTier = 'Emerging' | 'Growing' | 'Strong' | 'Exceptional'
export type EngagementTier = 'Light' | 'Healthy' | 'Strong' | 'Exceptional'
export type AttentionTier = 'Light' | 'Active' | 'Strong' | 'Exceptional'

// Reach bands remain fixed — they define the bracket boundaries themselves.
export const REACH_BANDS: TierBand<ReachTier>[] = [
  { label: 'Exceptional', min: 100000 },
  { label: 'Strong', min: 50000 },
  { label: 'Growing', min: 10000 },
  { label: 'Emerging', min: 0 },
]

// Builder engagement and attention bands are derived from calibration data.
// Uses the 'established' bracket as the display representative.
// Will become bracket-aware when [P1-F17] Scoring Methodology Disclosure is implemented.
const _cal = getCalibration('established')

export const BUILDER_ENGAGEMENT_BANDS: TierBand<EngagementTier>[] = [
  { label: 'Exceptional', min: _cal.forkRate.p75 * 100 },
  { label: 'Strong',      min: _cal.forkRate.p50 * 100 },
  { label: 'Healthy',     min: _cal.forkRate.p25 * 100 },
  { label: 'Light',       min: 0 },
]

export const ATTENTION_BANDS: TierBand<AttentionTier>[] = [
  { label: 'Exceptional', min: _cal.watcherRate.p75 * 100 },
  { label: 'Strong',      min: _cal.watcherRate.p50 * 100 },
  { label: 'Active',      min: _cal.watcherRate.p25 * 100 },
  { label: 'Light',       min: 0 },
]

export function classifyFromBands<T extends string>(value: number, bands: TierBand<T>[]) {
  return bands.find((band) => value >= band.min)?.label ?? bands[bands.length - 1]!.label
}

export function formatBandLegend<T extends string>(bands: TierBand<T>[], formatter: (value: number) => string) {
  return bands
    .map((band, index) => {
      const nextBand = bands[index - 1]

      if (!nextBand) {
        return `${band.label} ${formatter(band.min)}+`
      }

      return `${band.label} ${formatter(band.min)}-${formatter(nextBand.min)}`
    })
    .reverse()
    .join(', ')
}

