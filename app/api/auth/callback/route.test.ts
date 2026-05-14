import { describe, expect, it, vi, beforeEach } from 'vitest'
import { GET } from './route'

const mockCookieGet = vi.fn()
const mockCookieDelete = vi.fn()

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: mockCookieGet,
    delete: mockCookieDelete,
  }),
}))

global.fetch = vi.fn()

// Callback host and matching return origin (same-origin path)
const CALLBACK_ORIGIN = 'http://localhost:3000'
const CSRF = 'valid_state'
// State where returnOrigin matches the callback host → same-origin path
const SAME_ORIGIN_STATE = `${CSRF}|${CALLBACK_ORIGIN}`

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_CLIENT_ID', 'test_client_id')
    vi.stubEnv('GITHUB_CLIENT_SECRET', 'test_client_secret')
    vi.resetAllMocks()
    mockCookieGet.mockReturnValue({ value: CSRF })
  })

  function makeRequest(params: Record<string, string>, callbackOrigin = CALLBACK_ORIGIN) {
    const url = new URL(`${callbackOrigin}/api/auth/callback`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return new Request(url.toString())
  }

  // ── Error handling ────────────────────────────────────────────────────────

  it('redirects to error page (at return origin) when error param is present', async () => {
    const req = makeRequest({ error: 'access_denied', state: SAME_ORIGIN_STATE })
    const response = await GET(req)
    expect(response.status).toBe(302)
    const location = response.headers.get('location') ?? ''
    expect(location).toContain('auth_error=access_denied')
    expect(location.startsWith(CALLBACK_ORIGIN)).toBe(true)
  })

  // ── Same-origin path (returnOrigin === callback host) ─────────────────────

  it('redirects to invalid_state when CSRF cookie is missing', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const req = makeRequest({ code: 'abc123', state: SAME_ORIGIN_STATE })
    const response = await GET(req)
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('auth_error=invalid_state')
  })

  it('redirects to invalid_state when CSRF portion of state does not match cookie', async () => {
    const req = makeRequest({ code: 'abc123', state: `wrong_csrf|${CALLBACK_ORIGIN}` })
    const response = await GET(req)
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('auth_error=invalid_state')
  })

  it('exchanges code for token and redirects with fragment on same-origin success', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'gho_token123' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ login: 'arun-gupta' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    const req = makeRequest({ code: 'abc123', state: SAME_ORIGIN_STATE })
    const response = await GET(req)
    expect(response.status).toBe(302)
    const location = response.headers.get('location') ?? ''
    expect(location).toContain('token=gho_token123')
    expect(location).toContain('username=arun-gupta')
    expect(location).toContain('#')
    expect(location.startsWith(CALLBACK_ORIGIN)).toBe(true)
  })

  it('redirects to error page when token exchange fails (same-origin)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'bad_verification_code' }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const req = makeRequest({ code: 'bad_code', state: SAME_ORIGIN_STATE })
    const response = await GET(req)
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('auth_error=token_exchange_failed')
  })

  it('falls back to the callback host origin when state has no return origin', async () => {
    // Old-format state (no pipe separator) — graceful fallback
    mockCookieGet.mockReturnValue({ value: 'bare_csrf' })
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'gho_fallback' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ login: 'user' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    const req = makeRequest({ code: 'abc123', state: 'bare_csrf' })
    const response = await GET(req)
    expect(response.status).toBe(302)
    const location = response.headers.get('location') ?? ''
    expect(location.startsWith(CALLBACK_ORIGIN)).toBe(true)
  })

  // ── Cross-domain relay path ────────────────────────────────────────────────

  it('relays to originating host when returnOrigin differs from callback host', async () => {
    const loginOrigin = 'http://localhost:3010'
    const crossDomainState = `${CSRF}|${loginOrigin}`

    // Callback is on Vercel; login was on localhost:3010
    const req = makeRequest(
      { code: 'abc123', state: crossDomainState },
      'https://repopulse-arun-gupta.vercel.app',
    )
    const response = await GET(req)
    expect(response.status).toBe(302)
    const location = response.headers.get('location') ?? ''
    // Should relay to the originating host's relay endpoint
    expect(location.startsWith(`${loginOrigin}/api/auth/relay`)).toBe(true)
    expect(location).toContain('code=abc123')
    expect(location).toContain(encodeURIComponent(crossDomainState))
    // Should NOT exchange the token itself
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('redirects to error page on the return origin when code is missing in cross-domain case', async () => {
    const loginOrigin = 'http://localhost:3010'
    const crossDomainState = `${CSRF}|${loginOrigin}`

    const req = makeRequest(
      { state: crossDomainState },
      'https://repopulse-arun-gupta.vercel.app',
    )
    const response = await GET(req)
    expect(response.status).toBe(302)
    const location = response.headers.get('location') ?? ''
    expect(location).toContain('auth_error=missing_code')
    expect(location.startsWith(loginOrigin)).toBe(true)
  })
})
