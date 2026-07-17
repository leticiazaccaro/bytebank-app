import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// getSessionToken relies on next/headers `cookies()`, only wired up inside a
// real Next.js request scope — mocked here, same pattern as
// packages/shared/src/auth.test.ts and apps/mf-dashboard's statement route
// test.
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'

import { GET, POST } from './route'

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'status-text',
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

function mockCookie(token: string | undefined) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (token && name === 'bytebank_session' ? { name, value: token } : undefined),
  } as never)
}

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  process.env.API_BASE_URL = 'https://api.example.com'
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.API_BASE_URL
})

describe('GET /api/transactions', () => {
  it('returns the real statement transactions when the session cookie is present (API-01)', async () => {
    mockCookie('jwt-abc')
    const accounts = [{ id: 'acc-1', type: 'checking', userId: 'u1' }]
    const transactions = [
      { id: 't1', accountId: 'acc-1', type: 'Credit', value: 100, date: '2026-01-01' },
    ]
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(200, { message: 'ok', result: { account: accounts, transactions: [], cards: [] } })
      )
      .mockResolvedValueOnce(jsonResponse(200, { message: 'ok', result: { transactions } }))

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(transactions)
  })

  it('returns 401 without calling the upstream API when no session cookie is present', async () => {
    mockCookie(undefined)

    const response = await GET()

    expect(response.status).toBe(401)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns 401 when the upstream API rejects the token as expired (AUTH-05 pattern)', async () => {
    mockCookie('expired-jwt')
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { message: 'jwt expired' }))

    const response = await GET()

    expect(response.status).toBe(401)
    const body = (await response.json()) as { message: string }
    expect(body.message).not.toContain('jwt expired')
  })

  it('returns a generic 502 when the upstream API is unreachable (Edge Case: API fora do ar)', async () => {
    mockCookie('jwt-abc')
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))

    const response = await GET()

    expect(response.status).toBe(502)
    const body = (await response.json()) as { message: string }
    expect(body.message).not.toContain('network down')
  })
})

describe('POST /api/transactions', () => {
  const validInput = { accountId: 'acc-1', type: 'Debit', value: 50, from: 'Uber' }

  it('creates the transaction and returns it (API-02)', async () => {
    mockCookie('jwt-abc')
    const created = { id: 't1', ...validInput, date: '2026-01-01' }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(201, { message: 'ok', result: created }))

    const response = await POST(postRequest(validInput))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual(created)
  })

  it('returns 401 without calling the upstream API when no session cookie is present', async () => {
    mockCookie(undefined)

    const response = await POST(postRequest(validInput))

    expect(response.status).toBe(401)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('passes through the upstream validation error message and status on a 4xx (validation-error passthrough)', async () => {
    mockCookie('jwt-abc')
    vi.mocked(fetch).mockResolvedValue(jsonResponse(400, { message: 'value is required' }))

    const response = await POST(postRequest({ accountId: 'acc-1', type: 'Debit' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: 'value is required' })
  })

  it('returns a generic 502 when the upstream API is unreachable', async () => {
    mockCookie('jwt-abc')
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))

    const response = await POST(postRequest(validInput))

    expect(response.status).toBe(502)
    const body = (await response.json()) as { message: string }
    expect(body.message).not.toContain('network down')
  })
})
