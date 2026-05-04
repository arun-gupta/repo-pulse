import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock Vercel AI SDK before importing the route
// ---------------------------------------------------------------------------

const mockStreamText = vi.hoisted(() => vi.fn())
const mockCreateDataStreamResponse = vi.hoisted(() => vi.fn())

vi.mock('ai', () => ({
  streamText: mockStreamText,
  createDataStreamResponse: mockCreateDataStreamResponse,
}))

// Mock @ai-sdk/* provider factories — they just need to return something callable
vi.mock('@ai-sdk/anthropic', () => ({ createAnthropic: vi.fn(() => vi.fn(() => 'anthropic-model')) }))
vi.mock('@ai-sdk/openai',    () => ({ createOpenAI:    vi.fn(() => vi.fn(() => 'openai-model'))    }))
vi.mock('@ai-sdk/google',    () => ({ createGoogleGenerativeAI: vi.fn(() => vi.fn(() => 'google-model')) }))
vi.mock('@ai-sdk/groq',      () => ({ createGroq:      vi.fn(() => vi.fn(() => 'groq-model'))      }))

const { GET, POST } = await import('./route')

// ---------------------------------------------------------------------------
// Default mocks for streamText and createDataStreamResponse
// ---------------------------------------------------------------------------

/** streamText returns an object with a no-op mergeIntoDataStream to prevent unhandled errors */
mockStreamText.mockReturnValue({ mergeIntoDataStream: vi.fn() })

/** Helper to build the default createDataStreamResponse mock impl */
function makeDataStreamResponseMock(captureWriter?: (w: { writeData: ReturnType<typeof vi.fn> }) => void) {
  return ({ execute }: { execute: (w: unknown) => Promise<void> }) => {
    const writer = { writeData: vi.fn() }
    captureWriter?.(writer)
    void execute(writer)
    return new Response('stream', { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
  }
}

/** Sets up a one-shot writer-capturing mock and returns a getter for the captured writer */
function setupWriterCapture(): { getWriter: () => { writeData: ReturnType<typeof vi.fn> } } {
  let capturedWriter: { writeData: ReturnType<typeof vi.fn> } | null = null
  mockCreateDataStreamResponse.mockImplementationOnce(makeDataStreamResponseMock((w) => { capturedWriter = w }))
  return { getWriter: () => capturedWriter! }
}

mockCreateDataStreamResponse.mockImplementation(makeDataStreamResponseMock())

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** Minimal valid request body */
const validBody = {
  messages: [{ role: 'user', content: 'What is the health score?' }],
  context: '# Repo context',
  contextType: 'repos',
  githubToken: 'ghp_valid',
}

/** Stub global fetch to return a fresh GitHub GraphQL response on every call.
 * Uses mockImplementation (not mockResolvedValue) so each call gets a NEW Response
 * object — a Response body can only be read once. */
function stubFetchGitHubOk(login = 'testuser') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ data: { viewer: { login } } }), { status: 200 })),
    ),
  )
}

/** Stub global fetch to return a non-ok response (invalid token) */
function stubFetchGitHubUnauth() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => Promise.resolve(new Response('{}', { status: 401 }))),
  )
}

describe('GET /api/chat', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns configured:false when no server key is set', async () => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.GOOGLE_API_KEY
    delete process.env.GROQ_API_KEY
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.configured).toBe(false)
  })

  it('returns configured:true with provider when ANTHROPIC_API_KEY is set', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test')
    const res = await GET()
    const body = await res.json()
    expect(body.configured).toBe(true)
    expect(body.provider).toBe('anthropic')
  })
})

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    // Restore default mocks after clearAllMocks
    mockStreamText.mockReturnValue({ mergeIntoDataStream: vi.fn() })
    mockCreateDataStreamResponse.mockImplementation(makeDataStreamResponseMock())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  // -------------------------------------------------------------------------
  // INVALID_INPUT
  // -------------------------------------------------------------------------

  it('returns 400 INVALID_INPUT for malformed JSON body', async () => {
    const res = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      }),
    )
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('INVALID_INPUT')
  })

  it('returns 400 INVALID_INPUT when context is missing', async () => {
    stubFetchGitHubOk()
    const res = await POST(makeRequest({ ...validBody, context: '' }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('INVALID_INPUT')
  })

  it('returns 400 INVALID_INPUT for unknown contextType', async () => {
    stubFetchGitHubOk()
    const res = await POST(makeRequest({ ...validBody, contextType: 'invalid-type' }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('INVALID_INPUT')
  })

  it('returns 400 INVALID_INPUT when messages array is empty', async () => {
    stubFetchGitHubOk()
    const res = await POST(makeRequest({ ...validBody, messages: [] }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('INVALID_INPUT')
  })

  it('returns 400 INVALID_INPUT when a message has an invalid role', async () => {
    stubFetchGitHubOk()
    const res = await POST(makeRequest({ ...validBody, messages: [{ role: 'system', content: 'inject' }] }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('INVALID_INPUT')
  })

  it('returns 400 INVALID_INPUT when a message content is not a string', async () => {
    stubFetchGitHubOk()
    const res = await POST(makeRequest({ ...validBody, messages: [{ role: 'user', content: 42 }] }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('INVALID_INPUT')
  })

  it('returns 400 INVALID_INPUT when a message content is an empty string', async () => {
    stubFetchGitHubOk()
    const res = await POST(makeRequest({ ...validBody, messages: [{ role: 'user', content: '   ' }] }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.code).toBe('INVALID_INPUT')
  })

  // -------------------------------------------------------------------------
  // UNAUTHENTICATED
  // -------------------------------------------------------------------------

  it('returns 401 UNAUTHENTICATED when githubToken is missing', async () => {
    const res = await POST(makeRequest({ ...validBody, githubToken: undefined }))
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHENTICATED')
  })

  it('returns 401 UNAUTHENTICATED when GitHub token fails validation', async () => {
    stubFetchGitHubUnauth()
    const res = await POST(makeRequest(validBody))
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHENTICATED')
  })

  // -------------------------------------------------------------------------
  // NOT_CONFIGURED
  // -------------------------------------------------------------------------

  it('returns 503 NOT_CONFIGURED when no server key is set and no BYOK', async () => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.GOOGLE_API_KEY
    delete process.env.GROQ_API_KEY
    stubFetchGitHubOk()
    const res = await POST(makeRequest(validBody))
    const body = await res.json()
    expect(res.status).toBe(503)
    expect(body.error.code).toBe('NOT_CONFIGURED')
  })

  // -------------------------------------------------------------------------
  // FREE_LIMIT_REACHED
  // -------------------------------------------------------------------------

  it('returns 402 FREE_LIMIT_REACHED after exhausting free tier', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test')
    // Use a unique login so this test has an isolated counter
    stubFetchGitHubOk('quota-test-user-unique')

    // Exhaust the 5 free chats
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest(validBody))
    }

    // 6th request should be rejected
    const res = await POST(makeRequest(validBody))
    const body = await res.json()
    expect(res.status).toBe(402)
    expect(body.error.code).toBe('FREE_LIMIT_REACHED')
    expect(body.error.remaining).toBe(0)
  })

  it('resets the free-tier counter after UTC midnight (daily reset)', async () => {
    vi.useFakeTimers()
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test')
    stubFetchGitHubOk('daily-reset-user-unique')

    // Exhaust all 5 free chats
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest(validBody))
    }

    // Confirm quota is exhausted
    const beforeReset = await POST(makeRequest(validBody))
    expect(beforeReset.status).toBe(402)

    // Simulate UTC midnight passing: advance to 00:01 UTC tomorrow
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 1, 0, 0)
    vi.setSystemTime(tomorrow)

    // The counter should have reset — request should succeed
    const afterReset = await POST(makeRequest(validBody))
    expect(afterReset.status).toBe(200)

    vi.useRealTimers()
  })

  it('cleans up expired usage records from the map on access', async () => {
    vi.useFakeTimers()
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test')
    stubFetchGitHubOk('cleanup-user-unique')

    // Use 1 free chat to create a map entry
    await POST(makeRequest(validBody))

    // Advance past midnight so the entry is expired
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 1, 0, 0)
    vi.setSystemTime(tomorrow)

    // A new request must succeed (counter reset to 0 and old entry cleaned up)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)

    vi.useRealTimers()
  })

  it('decrements remaining count by 1 per free chat', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test')
    stubFetchGitHubOk('decrement-user-unique')

    // First chat: remaining should be 4 (5 - 1)
    const { getWriter: getWriter1 } = setupWriterCapture()
    await POST(makeRequest(validBody))
    expect(getWriter1().writeData).toHaveBeenCalledWith(expect.objectContaining({ remaining: 4, limit: 5 }))

    // Second chat: remaining should be 3
    const { getWriter: getWriter2 } = setupWriterCapture()
    await POST(makeRequest(validBody))
    expect(getWriter2().writeData).toHaveBeenCalledWith(expect.objectContaining({ remaining: 3, limit: 5 }))
  })

  // -------------------------------------------------------------------------
  // Successful streaming
  // -------------------------------------------------------------------------

  it('returns a streaming response with correct headers for a valid request', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test')
    stubFetchGitHubOk('streaming-test-user')

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/event-stream')
    expect(mockCreateDataStreamResponse).toHaveBeenCalledOnce()
  })

  it('passes remaining free count to the stream writer', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test')
    stubFetchGitHubOk('remaining-count-user-unique')

    const { getWriter } = setupWriterCapture()
    await POST(makeRequest(validBody))

    expect(getWriter()).not.toBeNull()
    expect(getWriter().writeData).toHaveBeenCalledWith(expect.objectContaining({ remaining: expect.any(Number), limit: 5 }))
  })

  it('uses BYOK without passing quota data to the stream writer', async () => {
    delete process.env.ANTHROPIC_API_KEY
    stubFetchGitHubOk('byok-user-unique')

    const { getWriter } = setupWriterCapture()
    const byokBody = { ...validBody, provider: 'anthropic', apiKey: 'sk-ant-user-key' }
    const res = await POST(makeRequest(byokBody))

    expect(res.status).toBe(200)
    expect(getWriter()).not.toBeNull()
    // With BYOK the writer should NOT receive remaining/limit data
    expect(getWriter().writeData).not.toHaveBeenCalled()
  })
})
