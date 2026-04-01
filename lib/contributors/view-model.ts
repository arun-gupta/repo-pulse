import type { AnalysisResult, Unavailable } from '@/lib/analyzer/analysis-result'
import { computeContributionConcentration, formatPercentage, getSustainabilityScore } from './score-config'

export interface ContributorMetricRow {
  label: string
  value: string
}

export interface ContributorHeatmapCell {
  contributor: string
  commitsLabel: string
  intensity: 'lowest' | 'low' | 'medium' | 'high' | 'higher' | 'max'
}

export interface ContributorsSectionViewModel {
  repo: string
  coreMetrics: ContributorMetricRow[]
  heatmap: ContributorHeatmapCell[]
  sustainabilityScore: ReturnType<typeof getSustainabilityScore>
  sustainabilityMetrics: ContributorMetricRow[]
  missingData: string[]
  placeholderSignals: string[]
}

const PLACEHOLDER_SIGNALS = [
  'Maintainer count',
  'Inactive contributors',
  'Occasional contributors',
  'No contributions in the last 6 months',
  'Types of contributions',
  'New contributors (90d)',
  'New vs. returning contributor ratio per release cycle',
  'Organizational diversity',
  'Organization-level contribution heatmap',
  'Unique employer/org count among contributors',
  'Single-vendor dependency ratio',
  'Elephant Factor',
]

export function buildContributorsViewModels(results: AnalysisResult[]): ContributorsSectionViewModel[] {
  return results.map((result) => {
    const sustainabilityScore = getSustainabilityScore(result)
    const concentration = computeContributionConcentration(result.commitCountsByAuthor)
    const repeatContributors = computeRepeatContributors(result.commitCountsByAuthor)

    return {
      repo: result.repo,
      coreMetrics: [
        { label: 'Total contributors', value: formatMetric(result.totalContributors) },
        { label: 'Active contributors (90d)', value: formatMetric(result.uniqueCommitAuthors90d) },
        { label: 'Repeat contributors (90d)', value: formatMetric(repeatContributors) },
      ],
      heatmap: buildHeatmap(result.commitCountsByAuthor),
      sustainabilityScore,
      sustainabilityMetrics: [
        { label: 'Top 20% contributor share', value: formatPercentage(sustainabilityScore.concentration) },
        {
          label: 'Scored contributor group',
          value: formatContributorGroup(sustainabilityScore.topContributorCount, sustainabilityScore.contributorCount),
        },
      ],
      missingData: buildMissingDataList(result, concentration, repeatContributors),
      placeholderSignals: PLACEHOLDER_SIGNALS,
    }
  })
}

function buildMissingDataList(
  result: AnalysisResult,
  concentration: number | Unavailable,
  repeatContributors: number | Unavailable,
): string[] {
  const fields: string[] = []

  if (result.totalContributors === 'unavailable') {
    fields.push('Total contributors')
  }

  if (result.uniqueCommitAuthors90d === 'unavailable') {
    fields.push('Active contributors (90d)')
  }

  if (repeatContributors === 'unavailable') {
    fields.push('Repeat contributors (90d)')
  }

  if (concentration === 'unavailable') {
    fields.push('Contribution concentration')
  }

  return fields
}

function computeRepeatContributors(commitCountsByAuthor: Record<string, number> | Unavailable): number | Unavailable {
  if (commitCountsByAuthor === 'unavailable') {
    return 'unavailable'
  }

  return Object.values(commitCountsByAuthor).filter((count) => count > 1).length
}

function formatMetric(value: number | Unavailable) {
  if (value === 'unavailable') {
    return value
  }

  return new Intl.NumberFormat('en-US').format(value)
}

function formatContributorGroup(topContributorCount: number | Unavailable, contributorCount: number | Unavailable) {
  if (topContributorCount === 'unavailable' || contributorCount === 'unavailable') {
    return 'unavailable'
  }

  return `${new Intl.NumberFormat('en-US').format(topContributorCount)} of ${new Intl.NumberFormat('en-US').format(contributorCount)} active contributors`
}

function buildHeatmap(commitCountsByAuthor: Record<string, number> | Unavailable): ContributorHeatmapCell[] {
  if (commitCountsByAuthor === 'unavailable') {
    return []
  }

  const entries = Object.entries(commitCountsByAuthor).sort((left, right) => right[1] - left[1])
  const maxCommits = entries[0]?.[1] ?? 0

  return entries.map(([contributor, commits]) => ({
    contributor: formatContributorLabel(contributor),
    commitsLabel: `${new Intl.NumberFormat('en-US').format(commits)} commits`,
    intensity: getIntensity(commits, maxCommits),
  }))
}

function formatContributorLabel(value: string) {
  const [, label = value] = value.split(':')
  return label
}

function getIntensity(commits: number, maxCommits: number): ContributorHeatmapCell['intensity'] {
  if (maxCommits <= 0) {
    return 'lowest'
  }

  const ratio = commits / maxCommits
  if (ratio >= 0.85) {
    return 'max'
  }
  if (ratio >= 0.7) {
    return 'higher'
  }
  if (ratio >= 0.5) {
    return 'high'
  }
  if (ratio >= 0.32) {
    return 'medium'
  }
  if (ratio >= 0.16) {
    return 'low'
  }

  return 'lowest'
}
