export interface OrgRepoSummary {
  repo: string
  name: string
  description: string | 'unavailable'
  primaryLanguage: string | 'unavailable'
  stars: number | 'unavailable'
  forks: number | 'unavailable'
  watchers: number | 'unavailable'
  openIssues: number | 'unavailable'
  pushedAt: string | 'unavailable'
  archived: boolean
  url: string
}

export interface OrgInventorySummary {
  totalPublicRepos: number
  totalStars: number | 'unavailable'
  mostStarredRepos: Array<{ repo: string; stars: number | 'unavailable' }>
  mostRecentlyActiveRepos: Array<{ repo: string; pushedAt: string | 'unavailable' }>
  languageDistribution: Array<{ language: string; repoCount: number }>
  archivedRepoCount: number
  activeRepoCount: number
}

export interface OrgInventoryViewProps {
  org: string
  summary: OrgInventorySummary
  results: OrgRepoSummary[]
  selectionLimit: number
  maxSelectionLimit: number
  onAnalyzeRepo: (repo: string) => void
  onAnalyzeSelected: (repos: string[]) => void
}
