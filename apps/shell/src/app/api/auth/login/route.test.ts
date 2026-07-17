import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from './route'

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'status-text',
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

function loginRequest(email: string, password: string): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
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

describe('POST /api/auth/login', () => {
  it('sets an httpOnly/secure/sameSite=lax session cookie and acknowledges success on valid credentials (AUTH-02)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { message: 'ok', result: { token: 'jwt-abc' } }))

    const response = await POST(loginRequest('ana@example.com', 'secret'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })

    const setCookieHeader = response.headers.get('set-cookie')
    expect(setCookieHeader).toContain('bytebank_session=jwt-abc')
    expect(setCookieHeader).toContain('HttpOnly')
    expect(setCookieHeader).toContain('Secure')
    expect(setCookieHeader).toMatch(/SameSite=lax/i)
  })

  it('returns 401 with a generic message and sets no cookie on invalid credentials, without leaking which field was wrong (AUTH-03)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { message: 'user not found' }))

    const response = await POST(loginRequest('ana@example.com', 'wrong'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: 'E-mail ou senha inválidos.' })
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('returns a generic 502 and sets no cookie when the upstream API is unreachable/erroring', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(500, { message: 'internal db error' }))

    const response = await POST(loginRequest('ana@example.com', 'secret'))

    expect(response.status).toBe(502)
    const body = (await response.json()) as { message: string }
    expect(body.message).not.toContain('internal db error')
    expect(response.headers.get('set-cookie')).toBeNull()
  })
})
