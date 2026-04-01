import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import { ContributorsView } from './ContributorsView'

describe('ContributorsView', () => {
  it('renders core and sustainability panes for each repository section', () => {
    render(<ContributorsView results={[buildResult()]} />)

    const region = screen.getByRole('region', { name: /contributors view/i })
    const corePane = within(region).getByRole('region', { name: /core contributors pane/i })
    expect(within(region).getByText('facebook/react')).toBeInTheDocument()
    expect(within(region).getByRole('heading', { name: /core/i })).toBeInTheDocument()
    expect(within(region).getByRole('heading', { name: /sustainability/i })).toBeInTheDocument()
    expect(within(corePane).getByText(/^Contribution heatmap$/i)).toBeInTheDocument()
    expect(within(region).getByText(/later sustainability signals/i)).toBeInTheDocument()
  })
})

function buildResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    repo: 'facebook/react',
    name: 'react',
    description: 'The library for web and native user interfaces.',
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
    uniqueCommitAuthors90d: 2,
    totalContributors: 'unavailable',
    commitCountsByAuthor: {
      'login:alice': 2,
      'login:bob': 1,
    },
    issueFirstResponseTimestamps: 'unavailable',
    issueCloseTimestamps: 'unavailable',
    prMergeTimestamps: 'unavailable',
    missingFields: [],
    ...overrides,
  }
}
