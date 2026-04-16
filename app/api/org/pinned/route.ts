import { queryGitHubGraphQL } from '@/lib/analyzer/github-graphql'

interface OrgPinnedReposGraphQLResponse {
  organization: {
    pinnedItems: {
      nodes: Array<{
        owner: { login: string } | null
        name: string | null
        stargazerCount: number | null
      }>
    }
  } | null
}

const ORG_PINNED_REPOS_QUERY = `
  query OrgPinnedRepos($login: String!) {
    organization(login: $login) {
      pinnedItems(first: 6, types: [REPOSITORY]) {
        nodes {
          ... on Repository {
            owner {
              login
            }
            name
            stargazerCount
          }
        }
      }
    }
  }
`

export async function GET(request: Request) {
  const org = new URL(request.url).searchParams.get('org')?.trim()
  if (!org) {
    return Response.json(
      { error: { message: 'Organization is required.', code: 'INVALID_ORG' } },
      { status: 400 },
    )
  }

  const token = getBearerToken(request)
  if (!token) {
    return Response.json(
      { error: { message: 'Authentication required.', code: 'UNAUTHENTICATED' } },
      { status: 401 },
    )
  }

  try {
    const response = await queryGitHubGraphQL<OrgPinnedReposGraphQLResponse>(
      token,
      ORG_PINNED_REPOS_QUERY,
      { login: org },
    )

    if (!response.data.organization) {
      return Response.json(
        { error: { message: 'Organization could not be found.', code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    const pinned = response.data.organization.pinnedItems.nodes
      .filter((node) => node.owner?.login && node.name)
      .map((node, rank) => ({
        owner: node.owner!.login,
        name: node.name!,
        stars: typeof node.stargazerCount === 'number' ? node.stargazerCount : 'unavailable',
        rank,
      }))

    return Response.json({ pinned })
  } catch (error) {
    const status = typeof (error as { status?: unknown })?.status === 'number'
      ? (error as { status: number }).status
      : 500

    if (status === 404) {
      return Response.json(
        { error: { message: 'Organization could not be found.', code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    if (status === 403 || status === 429) {
      return Response.json(
        { error: { message: 'GitHub rate limit exceeded.', code: 'RATE_LIMITED' } },
        { status },
      )
    }

    return Response.json(
      { error: { message: 'Pinned repositories request failed.', code: 'UPSTREAM_ERROR' } },
      { status: 500 },
    )
  }
}

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization')
  if (!authorization) {
    return null
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}
