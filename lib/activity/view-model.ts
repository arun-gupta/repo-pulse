import type { AnalysisResult, Unavailable } from '@/lib/analyzer/analysis-result'

export interface ActivityMetricRow {
  label: string
  value: string
}

export interface ActivitySectionViewModel {
  repo: string
  metrics: ActivityMetricRow[]
}

export function buildActivitySections(results: AnalysisResult[]): ActivitySectionViewModel[] {
  return results.map((result) => ({
    repo: result.repo,
    metrics: [
      { label: 'Commits (30d)', value: formatMetric(result.commits30d) },
      { label: 'Commits (90d)', value: formatMetric(result.commits90d) },
      { label: 'PRs opened (90d)', value: formatMetric(result.prsOpened90d) },
      { label: 'PRs merged (90d)', value: formatMetric(result.prsMerged90d) },
      { label: 'Open issues', value: formatMetric(result.issuesOpen) },
      { label: 'Issues closed (90d)', value: formatMetric(result.issuesClosed90d) },
      { label: 'Releases (12mo)', value: formatMetric(result.releases12mo) },
    ],
  }))
}

function formatMetric(value: number | Unavailable) {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return value
}
