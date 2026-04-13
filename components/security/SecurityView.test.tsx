import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import { SecurityView } from './SecurityView'

function buildResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    repo: 'facebook/react',
    name: 'react',
    description: 'A UI library',
    createdAt: '2013-05-24T16:15:54Z',
    primaryLanguage: 'TypeScript',
    stars: 1000,
    forks: 25,
    watchers: 10,
    commits30d: 7,
    commits90d: 18,
    releases12mo: 6,
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
    staleIssueRatio: 0.2,
    medianTimeToMergeHours: 24,
    medianTimeToCloseHours: 36,
    issueFirstResponseTimestamps: 'unavailable',
    issueCloseTimestamps: 'unavailable',
    prMergeTimestamps: 'unavailable',
    documentationResult: 'unavailable',
    licensingResult: 'unavailable',
    defaultBranchName: 'main',
    topics: [],
    inclusiveNamingResult: {
      defaultBranchName: 'main',
      branchCheck: { checkType: 'branch', term: 'main', passed: true, tier: null, severity: null, replacements: [], context: null },
      metadataChecks: [],
    },
    securityResult: {
      scorecard: {
        overallScore: 7.5,
        checks: [
          { name: 'Security-Policy', score: 10, reason: 'policy found' },
          { name: 'Code-Review', score: 8, reason: 'reviews found' },
        ],
        scorecardVersion: 'v5.0.0',
      },
      directChecks: [
        { name: 'security_policy', detected: true, details: 'SECURITY.md detected' },
        { name: 'dependabot', detected: true, details: 'Dependabot configuration detected' },
        { name: 'ci_cd', detected: true, details: '5 workflow file(s) detected' },
        { name: 'branch_protection', detected: true, details: 'Branch protection enabled' },
      ],
      branchProtectionEnabled: true,
    },
    missingFields: [],
    ...overrides,
  }
}

describe('SecurityView', () => {
  it('shows the aggregate OpenSSF score when Scorecard data is available', () => {
    render(<SecurityView results={[buildResult()]} />)

    expect(screen.getByTestId('security-openssf-score')).toHaveTextContent('OpenSSF Scorecard: 7.5/10')
    expect(screen.getByTestId('security-composite-score')).toBeInTheDocument()
    expect(screen.getByTestId('security-mode')).toHaveTextContent(/scorecard \+ direct checks/i)
  })

  it('hides the aggregate OpenSSF score in direct-only mode', () => {
    render(
      <SecurityView
        results={[
          buildResult({
            securityResult: {
              scorecard: 'unavailable',
              directChecks: [
                { name: 'security_policy', detected: true, details: 'SECURITY.md detected' },
                { name: 'dependabot', detected: false, details: null },
                { name: 'ci_cd', detected: true, details: '2 workflow file(s) detected' },
                { name: 'branch_protection', detected: 'unavailable', details: null },
              ],
              branchProtectionEnabled: 'unavailable',
            },
          }),
        ]}
      />,
    )

    expect(screen.queryByTestId('security-openssf-score')).not.toBeInTheDocument()
    expect(screen.getByTestId('security-mode')).toHaveTextContent(/direct checks only/i)
  })
})
