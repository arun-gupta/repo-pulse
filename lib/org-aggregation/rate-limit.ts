/**
 * Classify a response as primary / secondary / no rate limit.
 *
 * Per research R4:
 *  - Primary: status 403 AND x-ratelimit-remaining === '0' AND x-ratelimit-reset is present.
 *    resumesAt = x-ratelimit-reset (Unix timestamp, seconds).
 *  - Secondary: status 403 or 429 AND Retry-After is present.
 *    resumesAt = now + Retry-After (seconds).
 *  - When both headers are present, primary wins.
 *
 * Pure function. No I/O.
 */

export type RateLimitClassification =
  | { kind: 'primary'; resumesAt: Date }
  | { kind: 'secondary'; resumesAt: Date }
  | { kind: 'none' }

interface ResponseLike {
  status: number
  headers: Headers | { get(name: string): string | null }
}

function headerOf(h: ResponseLike['headers'], name: string): string | null {
  // Headers is case-insensitive; plain maps might not be. Try common casings.
  const raw = h.get(name) ?? h.get(name.toLowerCase()) ?? h.get(name.toUpperCase())
  return raw
}

export function classifyRateLimitResponse(
  response: ResponseLike,
  now: number = Date.now(),
): RateLimitClassification {
  if (response.status !== 403 && response.status !== 429) {
    return { kind: 'none' }
  }

  const remaining = headerOf(response.headers, 'x-ratelimit-remaining')
  const resetUnix = headerOf(response.headers, 'x-ratelimit-reset')

  if (response.status === 403 && remaining === '0' && resetUnix) {
    const parsed = Number.parseInt(resetUnix, 10)
    if (Number.isFinite(parsed)) {
      return { kind: 'primary', resumesAt: new Date(parsed * 1000) }
    }
  }

  const retryAfter = headerOf(response.headers, 'retry-after')
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10)
    if (Number.isFinite(seconds) && seconds >= 0) {
      return { kind: 'secondary', resumesAt: new Date(now + seconds * 1000) }
    }
  }

  return { kind: 'none' }
}
