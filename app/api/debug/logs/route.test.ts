import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/debug/logger', () => ({
  getEntries: vi.fn(() => []),
  installLogger: vi.fn(),
  subscribe: vi.fn(() => vi.fn()),
}))

describe('GET /api/debug/logs', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns 404 in production environment', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { GET } = await import('./route')
    const res = await GET()
    expect(res.status).toBe(404)
    const body = await res.json() as { error: string }
    expect(body.error).toContain('Not available')
  })

  it('returns 404 in test environment', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    const { GET } = await import('./route')
    const res = await GET()
    expect(res.status).toBe(404)
  })

  it('returns a streaming SSE response in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { GET } = await import('./route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/event-stream')
    expect(res.headers.get('Cache-Control')).toBe('no-cache')
    expect(res.body).not.toBeNull()
  })
})
