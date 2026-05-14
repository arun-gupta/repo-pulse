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

const RELAY_ORIGIN = 'http://localhost:3010'
const CSRF = 'valid_csrf'
const VALID_STATE = `${CSRF}|${RELAY_ORIGIN}`

describe('GET /api/auth/relay', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_CLIENT_ID', 'test_client_id')
    vi.stubEnv('GITHUB_CLIENT_SECRET', 'test_client_secret')
    vi.resetAllMocks()
    mockCookieGet.mockReturnValue({ value: CSRF })
  })

  function makeRequest(params: Record<string, string>) {
    const url = new URL(`${RELAY_ORIGIN}/api/auth/relay`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return new Request(url.toString())
  }

  it('redirects to invalid_state when CSRF cookie is missing', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const req = makeRequest({ code: 'abc123', state: VALID_STATE })
    const response = await GET(req)
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('auth_error=invalid_state')
  })

  it('redirects to invalid_state when CSRF does not match cookie', async () => {
    const req = makeRequest({ code: 'abc123', state: `wrong_csrf|${RELAY_ORIGIN}` })
    const response = await GET(req)
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('auth_error=invalid_state')
  })

  it('exchanges code for token and redirects with fragment to the relay host on success', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'gho_relay_token' }), {
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
    expect(location).toContain('token=gho_relay_token')
    expect(location).toContain('username=arun-gupta')
    expect(location).toContain('#')
    expect(location.startsWith(RELAY_ORIGIN)).toBe(true)
    expect(mockCookieDelete).toHaveBeenCalled()
  })

  it('redirects to error page when token exchange fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'bad_code' }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const req = makeRequest({ code: 'bad_code', state: VALID_STATE })
    const response = await GET(req)
    expect(response.status).toBe(302)
    const location = response.headers.get('location') ?? ''
    expect(location).toContain('auth_error=token_exchange_failed')
    expect(location.startsWith(RELAY_ORIGIN)).toBe(true)
  })
})
