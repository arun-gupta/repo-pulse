import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActivityView } from './ActivityView'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'

function buildResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    repo: 'facebook/react',
    name: 'react',
    description: 'A UI library',
    createdAt: '2013-05-24T16:15:54Z',
    primaryLanguage: 'TypeScript',
    stars: 100,
    forks: 25,
    watchers: 10,
    commits30d: 7,
    commits90d: 18,
    releases12mo: 'unavailable',
    prsOpened90d: 4,
    prsMerged90d: 3,
    issuesOpen: 5,
    issuesClosed90d: 6,
    uniqueCommitAuthors90d: 'unavailable',
    totalContributors: 'unavailable',
    maintainerCount: 'unavailable',
    commitCountsByAuthor: 'unavailable',
    commitCountsByExperimentalOrg: 'unavailable',
    experimentalAttributedAuthors90d: 'unavailable',
    experimentalUnattributedAuthors90d: 'unavailable',
    issueFirstResponseTimestamps: 'unavailable',
    issueCloseTimestamps: 'unavailable',
    prMergeTimestamps: 'unavailable',
    missingFields: [],
    ...overrides,
  }
}

describe('ActivityView', () => {
  it('renders one activity section per successful repository with visible primary values', () => {
    render(<ActivityView results={[buildResult(), buildResult({ repo: 'vercel/next.js', commits30d: 42 })]} />)

    const activityView = screen.getByRole('region', { name: /activity view/i })
    expect(within(activityView).getByText('facebook/react')).toBeInTheDocument()
    expect(within(activityView).getByText('vercel/next.js')).toBeInTheDocument()
    expect(within(activityView).getAllByText(/commits \(30d\)/i)).toHaveLength(2)
    expect(within(activityView).getByText('42')).toBeInTheDocument()
  })

  it('renders explicit unavailable values instead of hiding them', () => {
    render(<ActivityView results={[buildResult({ releases12mo: 'unavailable', commits30d: 'unavailable' })]} />)

    const activityView = screen.getByRole('region', { name: /activity view/i })
    expect(within(activityView).getByText(/releases \(12mo\)/i)).toBeInTheDocument()
    expect(within(activityView).getAllByText('unavailable').length).toBeGreaterThan(0)
  })
})
