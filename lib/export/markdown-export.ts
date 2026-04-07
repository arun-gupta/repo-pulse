import type { AnalysisResult, AnalyzeResponse } from '@/lib/analyzer/analysis-result'
import { getActivityScore } from '@/lib/activity/score-config'
import { getSustainabilityScore } from '@/lib/contributors/score-config'
import { getResponsivenessScore } from '@/lib/responsiveness/score-config'

export interface MarkdownExportResult {
  blob: Blob
  filename: string
}

function fmt(value: unknown): string {
  if (value === 'unavailable' || value === null || value === undefined) return 'N/A'
  if (typeof value === 'number') return new Intl.NumberFormat('en-US').format(value)
  return String(value)
}

function renderRepo(result: AnalysisResult): string {
  const activity = getActivityScore(result)
  const sustainability = getSustainabilityScore(result)
  const responsiveness = getResponsivenessScore(result)

  const lines: string[] = [
    `## ${result.repo}`,
    '',
    `- **Stars**: ${fmt(result.stars)}`,
    `- **Primary language**: ${fmt(result.primaryLanguage)}`,
    `- **Description**: ${fmt(result.description)}`,
    `- **Created**: ${fmt(result.createdAt)}`,
    '',
    '### Activity',
    '',
    `- **Score**: ${activity.value}`,
    `- **Commits (90 days)**: ${fmt(result.commits90d)}`,
    `- **PRs merged (90 days)**: ${fmt(result.prsMerged90d)}`,
    `- **Issues closed (90 days)**: ${fmt(result.issuesClosed90d)}`,
    `- **Releases (12 months)**: ${fmt(result.releases12mo)}`,
    '',
    '### Sustainability',
    '',
    `- **Score**: ${sustainability.value}`,
    `- **Unique commit authors (90 days)**: ${fmt(result.uniqueCommitAuthors90d)}`,
    `- **Total contributors**: ${fmt(result.totalContributors)}`,
    `- **Forks**: ${fmt(result.forks)}`,
    '',
    '### Responsiveness',
    '',
    `- **Score**: ${responsiveness.value}`,
    `- **Open issues**: ${fmt(result.issuesOpen)}`,
    `- **PRs opened (90 days)**: ${fmt(result.prsOpened90d)}`,
  ]

  if (result.missingFields.length > 0) {
    lines.push('', '### Missing Data', '')
    for (const field of result.missingFields) {
      lines.push(`- ${field}`)
    }
  }

  return lines.join('\n')
}

export function buildMarkdownReport(response: AnalyzeResponse): string {
  const timestamp = new Date().toISOString()
  const repoCount = response.results.length + response.failures.length

  const header = [
    '# RepoPulse Health Report',
    '',
    `Generated: ${timestamp}`,
    `Repositories: ${repoCount}`,
    '',
  ]

  const sections = response.results.map((result) => renderRepo(result))

  const failureLines: string[] = []
  if (response.failures.length > 0) {
    failureLines.push('## Failed Repositories', '')
    for (const failure of response.failures) {
      failureLines.push(`- **${failure.repo}**: ${failure.reason}`)
    }
  }

  const parts = [...header]
  for (const section of sections) {
    parts.push('---', '', section, '')
  }
  if (failureLines.length > 0) {
    parts.push('---', '', ...failureLines)
  }

  return parts.join('\n')
}

export function buildMarkdownExport(response: AnalyzeResponse): MarkdownExportResult {
  const markdown = buildMarkdownReport(response)
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const HH = String(now.getHours()).padStart(2, '0')
  const MM = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const filename = `repopulse-${yyyy}-${mm}-${dd}-${HH}${MM}${ss}.md`
  return { blob, filename }
}
