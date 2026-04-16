import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { OrgSummaryViewModel } from '@/lib/org-aggregation/types'
import { OrgSummaryView } from './OrgSummaryView'

function baseView(): OrgSummaryViewModel {
  return {
    status: {
      total: 3,
      succeeded: 1,
      failed: 0,
      inProgress: 1,
      queued: 1,
      elapsedMs: 12_000,
      etaMs: 24_000,
      concurrency: { chosen: 3, effective: 3 },
      pause: null,
      status: 'in-progress',
    },
    flagshipRepos: [{ repo: 'o/a', source: 'pinned', rank: 0 }],
    panels: {
      'contributor-diversity': {
        panelId: 'contributor-diversity',
        contributingReposCount: 1,
        totalReposInRun: 3,
        status: 'final',
        value: {
          defaultWindow: 90,
          byWindow: {
            30: { topTwentyPercentShare: 0.6, elephantFactor: 2, uniqueAuthorsAcrossOrg: 8, composition: { repeatContributors: 2, oneTimeContributors: 6, total: 8 }, contributingReposCount: 1 },
            60: { topTwentyPercentShare: 0.6, elephantFactor: 2, uniqueAuthorsAcrossOrg: 10, composition: { repeatContributors: 3, oneTimeContributors: 7, total: 10 }, contributingReposCount: 1 },
            90: { topTwentyPercentShare: 0.6, elephantFactor: 2, uniqueAuthorsAcrossOrg: 12, composition: { repeatContributors: 4, oneTimeContributors: 8, total: 12 }, contributingReposCount: 1 },
            180: { topTwentyPercentShare: 0.58, elephantFactor: 3, uniqueAuthorsAcrossOrg: 18, composition: { repeatContributors: 6, oneTimeContributors: 12, total: 18 }, contributingReposCount: 1 },
            365: { topTwentyPercentShare: 0.55, elephantFactor: 4, uniqueAuthorsAcrossOrg: 25, composition: { repeatContributors: 9, oneTimeContributors: 16, total: 25 }, contributingReposCount: 1 },
          },
        },
      },
    },
    missingData: [],
    perRepoStatusList: [
      { repo: 'o/a', status: 'done', badge: 'done', isFlagship: true },
      { repo: 'o/b', status: 'in-progress', badge: 'in-progress', isFlagship: false },
      { repo: 'o/c', status: 'queued', badge: 'queued', isFlagship: false },
    ],
  }
}

describe('OrgSummaryView', () => {
  it('renders the run-status header with counts', () => {
    render(<OrgSummaryView org="test-org" view={baseView()} />)
    expect(screen.getByText(/in progress \(1 of 3\)/i)).toBeInTheDocument()
    // spot-check one of the Stat cells
    expect(screen.getByText(/Succeeded/i)).toBeInTheDocument()
  })

  it('renders the contributor-diversity panel when the Contributors tab is active', () => {
    render(<OrgSummaryView org="test-org" view={baseView()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Contributors' }))
    expect(screen.getByText(/Contributor diversity/i)).toBeInTheDocument()
    expect(screen.getByText(/60\.0%/)).toBeInTheDocument()
  })

  it('renders per-repo status list under the Repos tab with flagship marker', () => {
    render(<OrgSummaryView org="test-org" view={baseView()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Repos' }))
    const items = screen.getAllByRole('listitem')
    expect(items.length).toBeGreaterThanOrEqual(3)
    expect(screen.getByText('flagship')).toBeInTheDocument()
  })

  it('hides missing-data panel when there are no missing entries', () => {
    render(<OrgSummaryView org="test-org" view={baseView()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Repos' }))
    expect(screen.queryByText(/Missing data/i)).not.toBeInTheDocument()
  })
})
