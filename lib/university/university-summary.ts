export interface UniversitySummary {
  slug: string
  university: string
  generatedAt: string
  totalRepos: number
  scoredRepos: number
  medianScore: number
  scoreBands: { high: number; medium: number; low: number }
  /** Counts per 10-point bucket: index 0 = 0–9, index 9 = 90–100 */
  scoreBuckets: number[]
  metrics: {
    activity: number
    maintenance: number
    community: number
    documentation: number
    security: number
  }
}
