import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import { DiscussionsCard } from './DiscussionsCard'

// Minimal AnalysisResult; community fields are optional on the type.
function buildResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    repo: 'foo/bar',
    name: 'bar',
    description: '—',
    createdAt: '2024-01-01T00:00:00Z',
    primaryLanguage: 'TypeScript',
    stars: 100,
    forks: 10,
    watchers: 5,
    commits30d: 5,
    commits90d: 15,
    releases12mo: 2,
    prsOpened90d: 3,
    prsMerged90d: 2,
    issuesOpen: 4,
    issuesClosed90d: 3,
    uniqueCommitAuthors90d: 4,
    totalContributors: 10,
    maintainerCount: 2,
    commitCountsByAuthor: { 'login:alice': 5 },
    commitCountsByExperimentalOrg: 'unavailable',
    experimentalAttributedAuthors90d: 'unavailable',
    experimentalUnattributedAuthors90d: 'unavailable',
    issueFirstResponseTimestamps: 'unavailable',
    issueCloseTimestamps: 'unavailable',
    prMergeTimestamps: 'unavailable',
    documentationResult: 'unavailable',
    licensingResult: 'unavailable',
    defaultBranchName: 'main',
    topics: [],
    inclusiveNamingResult: 'unavailable',
    securityResult: 'unavailable',
    missingFields: [],
    ...overrides,
  }
}

describe('DiscussionsCard', () => {
  const noop = vi.fn()

  it('returns null when hasDiscussionsEnabled is undefined', () => {
    const { container } = render(
      <DiscussionsCard result={buildResult()} activeTag={null} onTagClick={noop} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('returns null when hasDiscussionsEnabled is unavailable', () => {
    const { container } = render(
      <DiscussionsCard
        result={buildResult({ hasDiscussionsEnabled: 'unavailable' })}
        activeTag={null}
        onTagClick={noop}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders "Not enabled" when Discussions is disabled', () => {
    render(
      <DiscussionsCard
        result={buildResult({ hasDiscussionsEnabled: false })}
        activeTag={null}
        onTagClick={noop}
      />,
    )
    expect(screen.getByText(/not enabled/i)).toBeInTheDocument()
    expect(screen.getByText(/^Discussions$/)).toBeInTheDocument()
  })

  it('renders "no activity yet" when enabled with zero count', () => {
    render(
      <DiscussionsCard
        result={buildResult({
          hasDiscussionsEnabled: true,
          discussionsCountWindow: 0,
          discussionsWindowDays: 90,
        })}
        activeTag={null}
        onTagClick={noop}
      />,
    )
    expect(screen.getByText(/enabled · no activity yet/i)).toBeInTheDocument()
  })

  it('renders count + window when enabled with activity', () => {
    render(
      <DiscussionsCard
        result={buildResult({
          hasDiscussionsEnabled: true,
          discussionsCountWindow: 17,
          discussionsWindowDays: 90,
        })}
        activeTag={null}
        onTagClick={noop}
      />,
    )
    expect(screen.getByText(/enabled · 17 in last 90d/i)).toBeInTheDocument()
  })

  it('carries a community tag pill', () => {
    render(
      <DiscussionsCard
        result={buildResult({ hasDiscussionsEnabled: true, discussionsCountWindow: 5, discussionsWindowDays: 90 })}
        activeTag={null}
        onTagClick={noop}
      />,
    )
    expect(screen.getByRole('button', { name: /community/i })).toBeInTheDocument()
  })
})
