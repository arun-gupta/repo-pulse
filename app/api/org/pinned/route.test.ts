import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'
import { queryGitHubGraphQL } from '@/lib/analyzer/github-graphql'

vi.mock('@/lib/analyzer/github-graphql', () => ({
  queryGitHubGraphQL: vi.fn(),
}))

const queryGitHubGraphQLMock = vi.mocked(queryGitHubGraphQL)

describe('GET /api/org/pinned', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the normalized pinned contract for a valid org', async () => {
    queryGitHubGraphQLMock.mockResolvedValue({
      data: {
        organization: {
          pinnedItems: {
            nodes: [
              {
                owner: { login: 'konveyor' },
                name: 'konveyor',
                stargazerCount: 4321,
              },
              {
                owner: { login: 'konveyor' },
                name: 'tackle2-ui',
                stargazerCount: 312,
              },
            ],
          },
        },
      },
      rateLimit: null,
    })

    const response = await GET(
      new Request('http://localhost/api/org/pinned?org=konveyor', {
        headers: {
          Authorization: 'Bearer gho_test',
        },
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(queryGitHubGraphQLMock).toHaveBeenCalledWith(
      'gho_test',
      expect.stringContaining('query OrgPinnedRepos'),
      { login: 'konveyor' },
    )
    expect(body).toEqual({
      pinned: [
        { owner: 'konveyor', name: 'konveyor', stars: 4321, rank: 0 },
        { owner: 'konveyor', name: 'tackle2-ui', stars: 312, rank: 1 },
      ],
    })
  })

  it('returns 400 when org is missing', async () => {
    const response = await GET(
      new Request('http://localhost/api/org/pinned', {
        headers: {
          Authorization: 'Bearer gho_test',
        },
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      error: {
        message: 'Organization is required.',
        code: 'INVALID_ORG',
      },
    })
  })

  it('returns 401 when the request is unauthenticated', async () => {
    const response = await GET(new Request('http://localhost/api/org/pinned?org=konveyor'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({
      error: {
        message: 'Authentication required.',
        code: 'UNAUTHENTICATED',
      },
    })
  })

  it('returns an empty pinned array when GitHub returns only non-repository pinned items', async () => {
    queryGitHubGraphQLMock.mockResolvedValue({
      data: {
        organization: {
          pinnedItems: {
            nodes: [],
          },
        },
      },
      rateLimit: null,
    })

    const response = await GET(
      new Request('http://localhost/api/org/pinned?org=konveyor', {
        headers: {
          Authorization: 'Bearer gho_test',
        },
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ pinned: [] })
  })

  it('maps null stargazerCount to unavailable', async () => {
    queryGitHubGraphQLMock.mockResolvedValue({
      data: {
        organization: {
          pinnedItems: {
            nodes: [
              {
                owner: { login: 'konveyor' },
                name: 'tackle2-ui',
                stargazerCount: null,
              },
            ],
          },
        },
      },
      rateLimit: null,
    })

    const response = await GET(
      new Request('http://localhost/api/org/pinned?org=konveyor', {
        headers: {
          Authorization: 'Bearer gho_test',
        },
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      pinned: [{ owner: 'konveyor', name: 'tackle2-ui', stars: 'unavailable', rank: 0 }],
    })
  })
})
