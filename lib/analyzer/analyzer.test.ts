import { beforeEach, describe, expect, it, vi } from 'vitest'
import { analyze } from './analyze'
import { queryGitHubGraphQL } from './github-graphql'
import { fetchContributorCount } from './github-rest'

vi.mock('./github-graphql', () => ({
  queryGitHubGraphQL: vi.fn(),
}))

vi.mock('./github-rest', () => ({
  fetchContributorCount: vi.fn(),
}))

const queryGitHubGraphQLMock = vi.mocked(queryGitHubGraphQL)
const fetchContributorCountMock = vi.mocked(fetchContributorCount)

describe('analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchContributorCountMock.mockResolvedValue({
      data: 1742,
      rateLimit: { remaining: 4997, resetAt: '2026-03-31T23:59:59Z', retryAfter: 'unavailable' },
    })
  })

  it('returns a successful flat analysis result with unavailable placeholders where data is not verified', async () => {
    queryGitHubGraphQLMock
      .mockResolvedValueOnce({
        data: {
          repository: {
            name: 'react',
            description: 'A UI library',
            createdAt: '2013-05-24T16:15:54Z',
            primaryLanguage: { name: 'TypeScript' },
            stargazerCount: 100,
            forkCount: 25,
            watchers: { totalCount: 10 },
            issues: { totalCount: 5 },
          },
          rateLimit: { remaining: 4999, resetAt: '2026-03-31T23:59:59Z' },
        },
        rateLimit: { remaining: 4999, resetAt: '2026-03-31T23:59:59Z', retryAfter: 'unavailable' },
      })
      .mockResolvedValueOnce({
        data: {
          repository: {
            defaultBranchRef: {
              target: {
                recent30: { totalCount: 7 },
                recent90: { totalCount: 18 },
                recent90Commits: {
                  pageInfo: { hasNextPage: false, endCursor: null },
                  nodes: [
                    {
                      authoredDate: '2026-03-30T12:00:00Z',
                      author: { name: 'Alice', email: 'alice@example.com', user: { login: 'alice' } },
                    },
                    {
                      authoredDate: '2026-03-29T12:00:00Z',
                      author: { name: 'Alice', email: 'alice@example.com', user: { login: 'alice' } },
                    },
                    {
                      authoredDate: '2026-03-28T12:00:00Z',
                      author: { name: 'Bob', email: 'bob@example.com', user: { login: 'bob' } },
                    },
                  ],
                },
              },
            },
          },
          prsOpened: { issueCount: 4 },
          prsMerged: { issueCount: 3 },
          issuesClosed: { issueCount: 6 },
          rateLimit: { remaining: 4998, resetAt: '2026-03-31T23:59:59Z' },
        },
        rateLimit: { remaining: 4998, resetAt: '2026-03-31T23:59:59Z', retryAfter: 'unavailable' },
      })

    const result = await analyze({
      repos: ['facebook/react'],
      token: 'ghp_test',
    })

    expect(result.failures).toEqual([])
    expect(result.results).toHaveLength(1)
    expect(result.results[0]).toMatchObject({
      repo: 'facebook/react',
      name: 'react',
      stars: 100,
      forks: 25,
      watchers: 10,
      commits30d: 7,
      commits90d: 18,
      prsOpened90d: 4,
      prsMerged90d: 3,
      issuesOpen: 5,
      issuesClosed90d: 6,
      releases12mo: 'unavailable',
      uniqueCommitAuthors90d: 2,
      totalContributors: 1742,
      commitCountsByAuthor: {
        'login:alice': 2,
        'login:bob': 1,
      },
      issueFirstResponseTimestamps: 'unavailable',
      issueCloseTimestamps: 'unavailable',
      prMergeTimestamps: 'unavailable',
    })
    expect(result.results[0]?.missingFields).toContain('releases12mo')
    expect(result.results[0]?.missingFields).not.toContain('uniqueCommitAuthors90d')
    expect(result.results[0]?.missingFields).not.toContain('totalContributors')
    expect(result.results[0]?.missingFields).not.toContain('commitCountsByAuthor')
    expect(result.rateLimit).toEqual({
      remaining: 4997,
      resetAt: '2026-03-31T23:59:59Z',
      retryAfter: 'unavailable',
    })
  })

  it('isolates a failing repository while still returning successful results for others', async () => {
    queryGitHubGraphQLMock
      .mockResolvedValueOnce({
        data: {
          repository: {
            name: 'react',
            description: 'A UI library',
            createdAt: '2013-05-24T16:15:54Z',
            primaryLanguage: { name: 'TypeScript' },
            stargazerCount: 100,
            forkCount: 25,
            watchers: { totalCount: 10 },
            issues: { totalCount: 5 },
          },
          rateLimit: { remaining: 4999, resetAt: '2026-03-31T23:59:59Z' },
        },
        rateLimit: { remaining: 4999, resetAt: '2026-03-31T23:59:59Z', retryAfter: 'unavailable' },
      })
      .mockResolvedValueOnce({
        data: {
          repository: {
            defaultBranchRef: {
              target: {
                recent30: { totalCount: 7 },
                recent90: { totalCount: 18 },
                recent90Commits: {
                  pageInfo: { hasNextPage: false, endCursor: null },
                  nodes: [
                    {
                      authoredDate: '2026-03-30T12:00:00Z',
                      author: { name: 'Alice', email: 'alice@example.com', user: { login: 'alice' } },
                    },
                  ],
                },
              },
            },
          },
          prsOpened: { issueCount: 4 },
          prsMerged: { issueCount: 3 },
          issuesClosed: { issueCount: 6 },
          rateLimit: { remaining: 4998, resetAt: '2026-03-31T23:59:59Z' },
        },
        rateLimit: { remaining: 4998, resetAt: '2026-03-31T23:59:59Z', retryAfter: 'unavailable' },
      })
      .mockRejectedValueOnce(new Error('not found'))

    const result = await analyze({
      repos: ['facebook/react', 'facebook/missing-repo'],
      token: 'ghp_test',
    })

    expect(result.results).toHaveLength(1)
    expect(result.results[0]?.repo).toBe('facebook/react')
    expect(result.failures).toEqual([
      {
        repo: 'facebook/missing-repo',
        reason: 'Repository could not be analyzed.',
        code: 'NOT_FOUND',
      },
    ])
  })

  it('surfaces rate-limit failures with retry metadata when GitHub rejects the request', async () => {
    const error = new Error('rate limit exceeded') as Error & { status?: number; retryAfter?: number | 'unavailable' }
    error.status = 403
    error.retryAfter = 60
    queryGitHubGraphQLMock.mockRejectedValue(error)

    const result = await analyze({
      repos: ['facebook/react'],
      token: 'ghp_test',
    })

    expect(result.results).toEqual([])
    expect(result.failures).toEqual([
      {
        repo: 'facebook/react',
        reason: 'GitHub rate limit prevented analysis.',
        code: 'RATE_LIMITED',
      },
    ])
    expect(result.rateLimit).toEqual({
      remaining: 'unavailable',
      resetAt: 'unavailable',
      retryAfter: 60,
    })
  })

  it('keeps contributor metrics unavailable when commit authors cannot be verified', async () => {
    queryGitHubGraphQLMock
      .mockResolvedValueOnce({
        data: {
          repository: {
            name: 'react',
            description: 'A UI library',
            createdAt: '2013-05-24T16:15:54Z',
            primaryLanguage: { name: 'TypeScript' },
            stargazerCount: 100,
            forkCount: 25,
            watchers: { totalCount: 10 },
            issues: { totalCount: 5 },
          },
        },
        rateLimit: { remaining: 4999, resetAt: '2026-03-31T23:59:59Z', retryAfter: 'unavailable' },
      })
      .mockResolvedValueOnce({
        data: {
          repository: {
            defaultBranchRef: {
              target: {
                recent30: { totalCount: 7 },
                recent90: { totalCount: 18 },
                recent90Commits: {
                  pageInfo: { hasNextPage: false, endCursor: null },
                  nodes: [{ authoredDate: '2026-03-30T12:00:00Z', author: null }],
                },
              },
            },
          },
          prsOpened: { issueCount: 4 },
          prsMerged: { issueCount: 3 },
          issuesClosed: { issueCount: 6 },
        },
        rateLimit: { remaining: 4998, resetAt: '2026-03-31T23:59:59Z', retryAfter: 'unavailable' },
      })

    const result = await analyze({
      repos: ['facebook/react'],
      token: 'ghp_test',
    })

    expect(result.results[0]).toMatchObject({
      uniqueCommitAuthors90d: 'unavailable',
      totalContributors: 1742,
      commitCountsByAuthor: 'unavailable',
    })
  })

  it('keeps total contributors unavailable when the contributor count cannot be verified', async () => {
    fetchContributorCountMock.mockResolvedValueOnce({
      data: 'unavailable',
      rateLimit: { remaining: 4997, resetAt: '2026-03-31T23:59:59Z', retryAfter: 'unavailable' },
    })

    queryGitHubGraphQLMock
      .mockResolvedValueOnce({
        data: {
          repository: {
            name: 'react',
            description: 'A UI library',
            createdAt: '2013-05-24T16:15:54Z',
            primaryLanguage: { name: 'TypeScript' },
            stargazerCount: 100,
            forkCount: 25,
            watchers: { totalCount: 10 },
            issues: { totalCount: 5 },
          },
        },
        rateLimit: { remaining: 4999, resetAt: '2026-03-31T23:59:59Z', retryAfter: 'unavailable' },
      })
      .mockResolvedValueOnce({
        data: {
          repository: {
            defaultBranchRef: {
              target: {
                recent30: { totalCount: 7 },
                recent90: { totalCount: 18 },
                recent90Commits: {
                  pageInfo: { hasNextPage: false, endCursor: null },
                  nodes: [
                    {
                      authoredDate: '2026-03-30T12:00:00Z',
                      author: { name: 'Alice', email: 'alice@example.com', user: { login: 'alice' } },
                    },
                  ],
                },
              },
            },
          },
          prsOpened: { issueCount: 4 },
          prsMerged: { issueCount: 3 },
          issuesClosed: { issueCount: 6 },
        },
        rateLimit: { remaining: 4998, resetAt: '2026-03-31T23:59:59Z', retryAfter: 'unavailable' },
      })

    const result = await analyze({
      repos: ['facebook/react'],
      token: 'ghp_test',
    })

    expect(result.results[0]).toMatchObject({
      totalContributors: 'unavailable',
    })
    expect(result.results[0]?.missingFields).toContain('totalContributors')
  })
})
