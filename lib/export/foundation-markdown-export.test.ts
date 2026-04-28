import { describe, expect, it } from 'vitest'
import { buildFoundationMarkdownExport } from './foundation-markdown-export'
import type { FoundationResult } from '@/lib/foundation/types'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'

const RESULT_BASE: AnalysisResult = {
  repo: 'example/project',
  name: 'project',
  description: 'An example project',
  createdAt: '2020-01-01T00:00:00Z',
  primaryLanguage: 'Go',
  stars: 1234,
  forks: 56,
  watchers: 78,
  commits30d: 10,
  commits90d: 30,
  releases12mo: 4,
  prsOpened90d: 20,
  prsMerged90d: 18,
  issuesOpen: 5,
  issuesClosed90d: 12,
  uniqueCommitAuthors90d: 6,
  totalContributors: 20,
  maintainerCount: 'unavailable',
  commitCountsByAuthor: { alice: 10 },
  commitCountsByExperimentalOrg: {},
  experimentalAttributedAuthors90d: 1,
  experimentalUnattributedAuthors90d: 5,
  issueFirstResponseTimestamps: [],
  issueCloseTimestamps: [],
  prMergeTimestamps: [],
  documentationResult: 'unavailable',
  licensingResult: 'unavailable',
  defaultBranchName: 'main',
  topics: [],
  inclusiveNamingResult: {
    defaultBranchName: 'main',
    branchCheck: { checkType: 'branch', term: 'main', passed: true, tier: null, severity: null, replacements: [], context: null },
    metadataChecks: [],
  },
  securityResult: 'unavailable',
  missingFields: [],
}

const ASPIRANT_RESULT = {
  foundationTarget: 'cncf-sandbox' as const,
  readinessScore: 72,
  autoFields: [
    { id: 'readme', label: 'README', status: 'ready' as const, weight: 10, pointsEarned: 10, evidence: 'Found at /README.md' },
    { id: 'license', label: 'License', status: 'missing' as const, weight: 15, pointsEarned: 0, remediationHint: 'Add a LICENSE file' },
    { id: 'coc', label: 'Code of Conduct', status: 'partial' as const, weight: 5, pointsEarned: 3 },
  ],
  humanOnlyFields: [],
  readyCount: 1,
  totalAutoCheckable: 3,
  alreadyInLandscape: false,
  tagRecommendation: { primaryTag: 'tag-security' as const, matchedSignals: [], fallbackNote: null },
  sandboxApplication: null,
}

const MINIMAL_REPOS_RESULT: FoundationResult = {
  kind: 'repos',
  results: {
    results: [{ ...RESULT_BASE, aspirantResult: ASPIRANT_RESULT }],
    failures: [],
    rateLimit: null,
  },
}

describe('buildFoundationMarkdownExport — kind: repos', () => {
  it('returns a blob with MIME type text/markdown', () => {
    const { blob } = buildFoundationMarkdownExport(MINIMAL_REPOS_RESULT)
    expect(blob.type).toBe('text/markdown')
  })

  it('filename matches foundation-scan-YYYY-MM-DD-HHMM.md pattern', () => {
    const { filename } = buildFoundationMarkdownExport(MINIMAL_REPOS_RESULT)
    expect(filename).toMatch(/^foundation-scan-\d{4}-\d{2}-\d{2}-\d{4}\.md$/)
  })

  it('includes top-level heading and generated timestamp', async () => {
    const { blob } = buildFoundationMarkdownExport(MINIMAL_REPOS_RESULT)
    const text = await blob.text()
    expect(text).toContain('# Foundation Scan Report')
    expect(text).toMatch(/\*\*Generated:\*\* \d{4}-\d{2}-\d{2}T/)
  })

  it('includes a summary table with repo row', async () => {
    const { blob } = buildFoundationMarkdownExport(MINIMAL_REPOS_RESULT)
    const text = await blob.text()
    expect(text).toContain('## Summary')
    expect(text).toContain('| Repository | Score | Status |')
    expect(text).toContain('example/project')
    expect(text).toContain('72 / 100')
    expect(text).toContain('🟡 Needs work')
  })

  it('uses 🟢 Ready for scores >= 80', async () => {
    const highScore = { ...ASPIRANT_RESULT, readinessScore: 85 }
    const result: FoundationResult = {
      kind: 'repos',
      results: { results: [{ ...RESULT_BASE, aspirantResult: highScore }], failures: [], rateLimit: null },
    }
    const { blob } = buildFoundationMarkdownExport(result)
    const text = await blob.text()
    expect(text).toContain('🟢 Ready')
  })

  it('uses 🔴 Not ready for scores < 50', async () => {
    const lowScore = { ...ASPIRANT_RESULT, readinessScore: 30 }
    const result: FoundationResult = {
      kind: 'repos',
      results: { results: [{ ...RESULT_BASE, aspirantResult: lowScore }], failures: [], rateLimit: null },
    }
    const { blob } = buildFoundationMarkdownExport(result)
    const text = await blob.text()
    expect(text).toContain('🔴 Not ready')
  })

  it('includes per-repo section with Needs Work and Ready fields', async () => {
    const { blob } = buildFoundationMarkdownExport(MINIMAL_REPOS_RESULT)
    const text = await blob.text()
    expect(text).toContain('## example/project')
    expect(text).toContain('### Needs Work')
    expect(text).toContain('❌ **License**')
    expect(text).toContain('+15 pts if resolved')
    expect(text).toContain('Add a LICENSE file')
    expect(text).toContain('⚠️ **Code of Conduct**')
    expect(text).toContain('### Ready')
    expect(text).toContain('✅ **README**')
    expect(text).toContain('Found at /README.md')
  })

  it('Needs Work fields appear in autoFields order (no reverse)', async () => {
    const { blob } = buildFoundationMarkdownExport(MINIMAL_REPOS_RESULT)
    const text = await blob.text()
    const licensePos = text.indexOf('**License**')
    const cocPos = text.indexOf('**Code of Conduct**')
    expect(licensePos).toBeGreaterThan(0)
    expect(cocPos).toBeGreaterThan(0)
    // License comes before Code of Conduct in autoFields — should stay that way
    expect(licensePos).toBeLessThan(cocPos)
  })

  it('includes TAG recommendation', async () => {
    const { blob } = buildFoundationMarkdownExport(MINIMAL_REPOS_RESULT)
    const text = await blob.text()
    expect(text).toContain('**Recommended TAG:** tag-security')
  })

  it('landscapeOverride with status renders "Already a CNCF sandbox project"', async () => {
    const result: FoundationResult = {
      kind: 'repos',
      results: {
        results: [{ ...RESULT_BASE, landscapeOverride: true, landscapeStatus: 'sandbox' }],
        failures: [],
        rateLimit: null,
      },
    }
    const { blob } = buildFoundationMarkdownExport(result)
    const text = await blob.text()
    expect(text).toContain('Already a CNCF sandbox project')
    // Should NOT contain the old awkward form
    expect(text).not.toContain('Already CNCF sandbox')
    expect(text).not.toContain('Already a CNCF CNCF')
  })

  it('landscapeOverride without status renders "Already a CNCF project"', async () => {
    const result: FoundationResult = {
      kind: 'repos',
      results: {
        results: [{ ...RESULT_BASE, landscapeOverride: true, landscapeStatus: undefined }],
        failures: [],
        rateLimit: null,
      },
    }
    const { blob } = buildFoundationMarkdownExport(result)
    const text = await blob.text()
    // Summary table
    expect(text).toContain('Already a CNCF project')
    expect(text).not.toContain('Already a CNCF CNCF')
    // Per-repo section
    expect(text).toContain('> Already a CNCF project — not evaluated for sandbox readiness.')
  })

  it('includes failed repositories section when failures exist', async () => {
    const result: FoundationResult = {
      kind: 'repos',
      results: {
        results: [],
        failures: [{ repo: 'bad/repo', reason: 'Not found', code: 'NOT_FOUND' }],
        rateLimit: null,
      },
    }
    const { blob } = buildFoundationMarkdownExport(result)
    const text = await blob.text()
    expect(text).toContain('## Failed Repositories')
    expect(text).toContain('**bad/repo**: Not found')
  })

  it('renders sandbox application link when present', async () => {
    const arWithApp = {
      ...ASPIRANT_RESULT,
      sandboxApplication: {
        issueNumber: 42,
        issueUrl: 'https://github.com/cncf/sandbox/issues/42',
        title: 'example/project sandbox application',
        state: 'OPEN' as const,
        createdAt: '2024-01-15T00:00:00Z',
        labels: [],
        approved: false,
      },
    }
    const result: FoundationResult = {
      kind: 'repos',
      results: { results: [{ ...RESULT_BASE, aspirantResult: arWithApp }], failures: [], rateLimit: null },
    }
    const { blob } = buildFoundationMarkdownExport(result)
    const text = await blob.text()
    expect(text).toContain('[#42](https://github.com/cncf/sandbox/issues/42)')
    expect(text).toContain('open, under review')
  })
})

describe('buildFoundationMarkdownExport — kind: projects-board', () => {
  it('includes board URL in header', async () => {
    const result: FoundationResult = {
      kind: 'projects-board',
      url: 'https://github.com/orgs/cncf/projects/14',
      method: 'graphql',
      results: {
        results: [{ ...RESULT_BASE, aspirantResult: ASPIRANT_RESULT }],
        failures: [],
        rateLimit: null,
      },
      skipped: [],
    }
    const { blob } = buildFoundationMarkdownExport(result)
    const text = await blob.text()
    expect(text).toContain('# Foundation Scan Report — CNCF Sandbox Board')
    expect(text).toContain('**Source:** [CNCF Sandbox Board](https://github.com/orgs/cncf/projects/14)')
  })

  it('includes skipped issues section', async () => {
    const result: FoundationResult = {
      kind: 'projects-board',
      url: 'https://github.com/orgs/cncf/projects/14',
      method: 'graphql',
      results: { results: [], failures: [], rateLimit: null },
      skipped: [
        { issueNumber: 7, issueUrl: 'https://github.com/cncf/sandbox/issues/7', title: 'bad issue', reason: 'no repo link found' },
      ],
    }
    const { blob } = buildFoundationMarkdownExport(result)
    const text = await blob.text()
    expect(text).toContain('## Skipped Issues')
    expect(text).toContain('[#7 bad issue](https://github.com/cncf/sandbox/issues/7): no repo link found')
  })

  it('omits skipped issues section when skipped list is empty', async () => {
    const result: FoundationResult = {
      kind: 'projects-board',
      url: 'https://github.com/orgs/cncf/projects/14',
      method: 'graphql',
      results: { results: [], failures: [], rateLimit: null },
      skipped: [],
    }
    const { blob } = buildFoundationMarkdownExport(result)
    const text = await blob.text()
    expect(text).not.toContain('## Skipped Issues')
  })
})

describe('buildFoundationMarkdownExport — kind: org', () => {
  const ORG_RESULT: FoundationResult = {
    kind: 'org',
    inventory: {
      org: 'my-org',
      summary: {
        totalPublicRepos: 42,
        totalStars: 9876,
        mostStarredRepos: [],
        mostRecentlyActiveRepos: [],
        languageDistribution: [
          { language: 'Go', repoCount: 20 },
          { language: 'TypeScript', repoCount: 10 },
        ],
        archivedRepoCount: 3,
        activeRepoCount: 39,
      },
      results: [
        {
          repo: 'my-org/alpha',
          name: 'alpha',
          description: 'Alpha project',
          primaryLanguage: 'Go',
          stars: 500,
          forks: 10,
          watchers: 25,
          openIssues: 3,
          pushedAt: '2024-06-01T00:00:00Z',
          archived: false,
          isFork: false,
          url: 'https://github.com/my-org/alpha',
        },
        {
          repo: 'my-org/beta',
          name: 'beta',
          description: 'unavailable',
          primaryLanguage: 'unavailable',
          stars: 'unavailable',
          forks: 0,
          watchers: 0,
          openIssues: 0,
          pushedAt: 'unavailable',
          archived: true,
          isFork: false,
          url: 'https://github.com/my-org/beta',
        },
      ],
      rateLimit: null,
      failure: null,
    },
  }

  it('includes org-level heading', async () => {
    const { blob } = buildFoundationMarkdownExport(ORG_RESULT)
    const text = await blob.text()
    expect(text).toContain('# Foundation Scan Report — my-org')
    expect(text).toContain('**Organization:** [github.com/my-org](https://github.com/my-org)')
  })

  it('includes summary metrics table', async () => {
    const { blob } = buildFoundationMarkdownExport(ORG_RESULT)
    const text = await blob.text()
    expect(text).toContain('## Summary')
    expect(text).toContain('| Total public repositories | 42 |')
    expect(text).toContain('| Total stars | 9,876 |')
    expect(text).toContain('| Active repositories | 39 |')
    expect(text).toContain('| Archived repositories | 3 |')
  })

  it('includes language distribution', async () => {
    const { blob } = buildFoundationMarkdownExport(ORG_RESULT)
    const text = await blob.text()
    expect(text).toContain('### Language Distribution')
    expect(text).toContain('| Go | 20 |')
    expect(text).toContain('| TypeScript | 10 |')
  })

  it('includes repository inventory table', async () => {
    const { blob } = buildFoundationMarkdownExport(ORG_RESULT)
    const text = await blob.text()
    expect(text).toContain('## Repository Inventory')
    expect(text).toContain('[alpha](https://github.com/my-org/alpha)')
    expect(text).toContain('| Active |')
  })

  it('renders archived and unavailable values correctly', async () => {
    const { blob } = buildFoundationMarkdownExport(ORG_RESULT)
    const text = await blob.text()
    expect(text).toContain('[beta](https://github.com/my-org/beta)')
    expect(text).toContain('| Archived |')
    // stars = 'unavailable' → '—'
    const betaRow = text.split('\n').find((l) => l.includes('[beta]'))
    expect(betaRow).toContain('| — |')
  })

  it('filename still matches foundation-scan-YYYY-MM-DD-HHMM.md', () => {
    const { filename } = buildFoundationMarkdownExport(ORG_RESULT)
    expect(filename).toMatch(/^foundation-scan-\d{4}-\d{2}-\d{2}-\d{4}\.md$/)
  })
})
