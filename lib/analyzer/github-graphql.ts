import type { RateLimitState } from './analysis-result'

export interface GitHubGraphQLSuccess<T> {
  data: T
  rateLimit: RateLimitState | null
}

export async function queryGitHubGraphQL<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<GitHubGraphQLSuccess<T>> {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    const retryAfterHeader = response.headers.get('Retry-After')
    const error = new Error(`GitHub GraphQL request failed with status ${response.status}`)
    ;(error as Error & { status?: number; retryAfter?: number | 'unavailable' }).status = response.status
    ;(error as Error & { status?: number; retryAfter?: number | 'unavailable' }).retryAfter = retryAfterHeader
      ? Number(retryAfterHeader)
      : 'unavailable'
    throw error
  }

  const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string; type?: string }> }

  // Extract query name for debug logging
  const queryNameMatch = query.match(/query\s+(\w+)/)
  const queryName = queryNameMatch?.[1] ?? 'unknown'

  if (payload.errors?.length) {
    console.warn(`[GraphQL:${queryName}] Errors:`, JSON.stringify(payload.errors, null, 2))
    console.warn(`[GraphQL:${queryName}] Has partial data: ${!!payload.data}`)
    if (payload.data) {
      const topKeys = Object.keys(payload.data as Record<string, unknown>)
      const nullKeys = topKeys.filter((k) => (payload.data as Record<string, unknown>)[k] == null)
      console.warn(`[GraphQL:${queryName}] Data keys: ${topKeys.join(', ')}`)
      console.warn(`[GraphQL:${queryName}] Null keys: ${nullKeys.join(', ') || '(none)'}`)
    }

    const isResourceLimitExceeded = payload.errors.some(
      (error) => error.type === 'RESOURCE_LIMITS_EXCEEDED' || error.message.includes('RESOURCE_LIMITS_EXCEEDED'),
    )

    // RESOURCE_LIMITS_EXCEEDED returns partial data — use what we got
    if (isResourceLimitExceeded && payload.data) {
      console.warn(`[GraphQL:${queryName}] Using partial data despite RESOURCE_LIMITS_EXCEEDED`)
      const data = payload.data
      const rateLimit = extractRateLimit(data)
      return { data, rateLimit }
    }

    throw new Error(payload.errors[0]?.message ?? 'GitHub GraphQL request failed')
  }

  const data = payload.data as T
  const rateLimit = extractRateLimit(data)

  return { data, rateLimit }
}

function extractRateLimit(data: unknown): RateLimitState | null {
  if (!data || typeof data !== 'object' || !('rateLimit' in data)) {
    return null
  }

  const rateLimit = (data as { rateLimit?: { remaining?: number; resetAt?: string } }).rateLimit

  return {
    remaining: typeof rateLimit?.remaining === 'number' ? rateLimit.remaining : 'unavailable',
    resetAt: typeof rateLimit?.resetAt === 'string' ? rateLimit.resetAt : 'unavailable',
    retryAfter: 'unavailable',
  }
}
