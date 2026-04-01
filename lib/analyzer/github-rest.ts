import type { RateLimitState } from './analysis-result'

export interface GitHubRestSuccess<T> {
  data: T
  rateLimit: RateLimitState | null
}

export async function fetchContributorCount(
  token: string,
  owner: string,
  name: string,
): Promise<GitHubRestSuccess<number | 'unavailable'>> {
  const path = `/repos/${owner}/${name}/contributors?per_page=1&anon=1`
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    const retryAfterHeader = response.headers.get('Retry-After')
    const error = new Error(`GitHub REST request failed with status ${response.status}`)
    ;(error as Error & { status?: number; retryAfter?: number | 'unavailable' }).status = response.status
    ;(error as Error & { status?: number; retryAfter?: number | 'unavailable' }).retryAfter = retryAfterHeader
      ? Number(retryAfterHeader)
      : 'unavailable'
    throw error
  }

  const contributors = (await response.json()) as unknown[]
  const linkHeader = response.headers.get('Link')
  const rateLimit = extractRateLimit(response)

  return {
    data: parseContributorCount(contributors, linkHeader),
    rateLimit,
  }
}

function parseContributorCount(contributors: unknown[], linkHeader: string | null): number | 'unavailable' {
  if (!Array.isArray(contributors)) {
    return 'unavailable'
  }

  const lastPage = parseLastPage(linkHeader)
  if (lastPage !== null) {
    return lastPage
  }

  return contributors.length
}

function parseLastPage(linkHeader: string | null): number | null {
  if (!linkHeader) {
    return null
  }

  const lastMatch = linkHeader.match(/&page=(\d+)>; rel="last"/)
  if (!lastMatch) {
    return null
  }

  const parsed = Number(lastMatch[1])
  return Number.isFinite(parsed) ? parsed : null
}

function extractRateLimit(response: Response): RateLimitState | null {
  const remaining = response.headers.get('X-RateLimit-Remaining')
  const resetAt = response.headers.get('X-RateLimit-Reset')

  return {
    remaining: remaining ? Number(remaining) : 'unavailable',
    resetAt: resetAt ? new Date(Number(resetAt) * 1000).toISOString() : 'unavailable',
    retryAfter: 'unavailable',
  }
}
