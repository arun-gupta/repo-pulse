export interface RepoHighlight {
  repo: string
  value: number
}

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
  highlights: {
    totalStars: number
    mostStarred: RepoHighlight
    mostContributors: RepoHighlight
    mostPRs: RepoHighlight
    mostIssues: RepoHighlight
  }
}
