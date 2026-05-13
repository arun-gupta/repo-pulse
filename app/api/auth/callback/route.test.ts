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

// State format: "{csrf}|{returnOrigin}". Cookie stores just the csrf portion.
const CSRF = 'valid_state'
const RETURN_ORIGIN = 'http://localhost:3010'
const VALID_STATE = `${CSRF}|${RETURN_ORIGIN}`

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_CLIENT_ID', 'test_client_id')
    vi.stubEnv('GITHUB_CLIENT_SECRET', 'test_client_secret')
    vi.resetAllMocks()
    // Cookie stores only the csrf token (not the full state string)
    mockCookieGet.mockReturnValue({ value: CSRF })
  })

  function makeRequest(params: Record<string, string>) {
    const url = new URL('http://localhost/api/auth/callback')
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return new Request(url.toString())
  }

  it('redirects to error page when error param is present', async () => {
    const req = makeRequest({ error: 'access_denied', state: VALID_STATE })
    const response = await GET(req)
    expect(response.status).toBe(302)
    const location = response.headers.get('location') ?? ''
    expect(location).toContain('auth_error=access_denied')
    // Should redirect to the return origin extracted from state, not the callback host
    expect(location).toContain(RETURN_ORIGIN)
  })

  it('redirects to error page when state is missing', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const req = makeRequest({ code: 'abc123', state: VALID_STATE })
    const response = await GET(req)
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('auth_error=invalid_state')
  })

  it('redirects to error page when csrf portion of state does not match cookie', async () => {
    const req = makeRequest({ code: 'abc123', state: `wrong_csrf|${RETURN_ORIGIN}` })
    const response = await GET(req)
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('auth_error=invalid_state')
  })

  it('exchanges code for token and redirects with fragment to the return origin', async () => {
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

    const req = makeRequest({ code: 'abc123', state: VALID_STATE })
    const response = await GET(req)
    expect(response.status).toBe(302)
    const location = response.headers.get('location') ?? ''
    expect(location).toContain('token=gho_token123')
    expect(location).toContain('username=arun-gupta')
    expect(location).toContain('#')
    // Should redirect to the return origin from the state, not the callback's own host
    expect(location.startsWith(RETURN_ORIGIN)).toBe(true)
  })

  it('falls back to the callback host origin when state has no return origin', async () => {
    // Handles old-format state (no pipe separator) gracefully
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
    // Falls back to the request origin (localhost in this test)
    expect(location.startsWith('http://localhost')).toBe(true)
  })

  it('redirects to error page when token exchange fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'bad_verification_code' }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const req = makeRequest({ code: 'bad_code', state: VALID_STATE })
    const response = await GET(req)
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('auth_error=token_exchange_failed')
  })
})
