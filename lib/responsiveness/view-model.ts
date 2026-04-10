import { ACTIVITY_WINDOW_DAYS, type ActivityWindowDays, type AnalysisResult, type ResponsivenessMetrics, type Unavailable } from '@/lib/analyzer/analysis-result'
import { formatCount, formatHours, formatPercentage, getResponsivenessScore } from './score-config'
import { type BracketCalibration, type PercentileSet, formatPercentileLabel, getCalibrationForStars, interpolatePercentile } from '@/lib/scoring/config-loader'

export interface ResponsivenessMetricViewModel {
  label: string
  value: string
  helpText?: string
}

export interface ResponsivenessPaneViewModel {
  title:
    | 'Issue & PR response time'
    | 'Resolution metrics'
    | 'Maintainer activity signals'
    | 'Volume & backlog health'
    | 'Engagement quality signals'
  metrics: ResponsivenessMetricViewModel[]
}

export interface ResponsivenessSectionViewModel {
  repo: string
  panes: ResponsivenessPaneViewModel[]
  score: ReturnType<typeof getResponsivenessScore>
}

export function getResponsivenessWindowOptions() {
  return ACTIVITY_WINDOW_DAYS.map((days) => ({
    days,
    label: days === 365 ? '12 months' : `${days}d`,
  }))
}

export function buildResponsivenessSections(results: AnalysisResult[], windowDays: ActivityWindowDays): ResponsivenessSectionViewModel[] {
  return results.map((result) => {
    const metrics = getResponsivenessMetrics(result, windowDays)

    return {
      repo: result.repo,
      panes: buildPanes(metrics, getCalibrationForStars(result.stars)),
      score: getResponsivenessScore(result, windowDays),
    }
  })
}

function getResponsivenessMetrics(result: AnalysisResult, windowDays: ActivityWindowDays): ResponsivenessMetrics {
  return (
    result.responsivenessMetricsByWindow?.[windowDays] ??
    result.responsivenessMetrics ?? {
      issueFirstResponseMedianHours: 'unavailable',
      issueFirstResponseP90Hours: 'unavailable',
      prFirstReviewMedianHours: 'unavailable',
      prFirstReviewP90Hours: 'unavailable',
      issueResolutionMedianHours: 'unavailable',
      issueResolutionP90Hours: 'unavailable',
      prMergeMedianHours: result.medianTimeToMergeHours ?? 'unavailable',
      prMergeP90Hours: 'unavailable',
      issueResolutionRate: 'unavailable',
      contributorResponseRate: 'unavailable',
      botResponseRatio: 'unavailable',
      humanResponseRatio: 'unavailable',
      staleIssueRatio: result.staleIssueRatio ?? 'unavailable',
      stalePrRatio: 'unavailable',
      prReviewDepth: 'unavailable',
      issuesClosedWithoutCommentRatio: 'unavailable',
      openIssueCount: result.issuesOpen,
      openPullRequestCount: 'unavailable',
    }
  )
}

function withPercentile(formatted: string, raw: number | Unavailable, ps: PercentileSet | undefined, inverted = false): string {
  if (formatted === '—' || raw === 'unavailable' || !ps) return formatted
  const p = interpolatePercentile(raw as number, ps, inverted)
  return `${formatted} (${formatPercentileLabel(p)})`
}

function buildPanes(metrics: ResponsivenessMetrics, cal: BracketCalibration): ResponsivenessPaneViewModel[] {
  return [
    {
      title: 'Issue & PR response time',
      metrics: [
        { label: 'Issue first response (median)', value: withPercentile(formatHours(metrics.issueFirstResponseMedianHours), metrics.issueFirstResponseMedianHours, cal.issueFirstResponseMedianHours, true) },
        {
          label: 'Issue first response (p90)',
          value: withPercentile(formatHours(metrics.issueFirstResponseP90Hours), metrics.issueFirstResponseP90Hours, cal.issueFirstResponseP90Hours, true),
          helpText: '90th percentile time from issue open to the first non-author response. Shows slower outliers.',
        },
        { label: 'PR first review (median)', value: withPercentile(formatHours(metrics.prFirstReviewMedianHours), metrics.prFirstReviewMedianHours, cal.prFirstReviewMedianHours, true) },
        {
          label: 'PR first review (p90)',
          value: withPercentile(formatHours(metrics.prFirstReviewP90Hours), metrics.prFirstReviewP90Hours, cal.prFirstReviewP90Hours, true),
          helpText: '90th percentile time from pull request open to the first non-author review. Shows slower outliers.',
        },
      ],
    },
    {
      title: 'Resolution metrics',
      metrics: [
        { label: 'Issue resolution duration (median)', value: withPercentile(formatHours(metrics.issueResolutionMedianHours), metrics.issueResolutionMedianHours, cal.issueResolutionMedianHours, true) },
        {
          label: 'Issue resolution duration (p90)',
          value: withPercentile(formatHours(metrics.issueResolutionP90Hours), metrics.issueResolutionP90Hours, cal.issueResolutionP90Hours, true),
          helpText: '90th percentile time from issue open to close. Shows slower-to-resolve outliers.',
        },
        { label: 'PR merge duration (median)', value: withPercentile(formatHours(metrics.prMergeMedianHours), metrics.prMergeMedianHours, cal.prMergeMedianHours, true) },
        {
          label: 'PR merge duration (p90)',
          value: withPercentile(formatHours(metrics.prMergeP90Hours), metrics.prMergeP90Hours, cal.prMergeP90Hours, true),
          helpText: '90th percentile time from pull request open to merge. Shows slower merge outliers.',
        },
        {
          label: 'Issue resolution rate',
          value: withPercentile(formatPercentage(metrics.issueResolutionRate), metrics.issueResolutionRate, cal.issueResolutionRate),
          helpText: 'Closed issues divided by opened issues in the selected recent window.',
        },
      ],
    },
    {
      title: 'Maintainer activity signals',
      metrics: [
        {
          label: 'Contributor response rate',
          value: withPercentile(formatPercentage(metrics.contributorResponseRate), metrics.contributorResponseRate, cal.contributorResponseRate),
          helpText: 'Share of newly opened issues and pull requests that received at least one non-author human response.',
        },
        {
          label: 'Human first-response ratio',
          value: withPercentile(formatPercentage(metrics.humanResponseRatio), metrics.humanResponseRatio, cal.humanResponseRatio),
          helpText: 'Share of first responses that came from a human account rather than a bot.',
        },
        {
          label: 'Bot first-response ratio',
          value: withPercentile(formatPercentage(metrics.botResponseRatio), metrics.botResponseRatio, cal.botResponseRatio, true),
          helpText: 'Share of first responses that came from bot accounts such as accounts ending in [bot] or -bot.',
        },
      ],
    },
    {
      title: 'Volume & backlog health',
      metrics: [
        {
          label: 'Stale issue ratio',
          value: withPercentile(formatPercentage(metrics.staleIssueRatio), metrics.staleIssueRatio, cal.staleIssueRatio, true),
          helpText: 'Share of currently open issues that have been open longer than the selected recent window.',
        },
        {
          label: 'Stale PR ratio',
          value: withPercentile(formatPercentage(metrics.stalePrRatio), metrics.stalePrRatio, cal.stalePrRatio, true),
          helpText: 'Share of currently open pull requests that have been open longer than the selected recent window.',
        },
        { label: 'Open issues', value: withPercentile(formatCount(metrics.openIssueCount), metrics.openIssueCount, (cal as unknown as Record<string, PercentileSet | undefined>).openIssueCount) },
        { label: 'Open PR backlog', value: withPercentile(formatCount(metrics.openPullRequestCount), metrics.openPullRequestCount, (cal as unknown as Record<string, PercentileSet | undefined>).openPrCount) },
      ],
    },
    {
      title: 'Engagement quality signals',
      metrics: [
        {
          label: 'PR review depth',
          value: withPercentile(formatCount(metrics.prReviewDepth, 1), metrics.prReviewDepth, cal.prReviewDepth),
          helpText: 'Average number of review events recorded per newly opened pull request in the selected window.',
        },
        {
          label: 'Issues closed without comment',
          value: withPercentile(formatPercentage(metrics.issuesClosedWithoutCommentRatio), metrics.issuesClosedWithoutCommentRatio, cal.issuesClosedWithoutCommentRatio, true),
          helpText: 'Share of issues closed in the selected window that had no public issue comments.',
        },
      ],
    },
  ]
}

