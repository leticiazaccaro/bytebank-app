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

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/register', {
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

describe('POST /api/auth/register', () => {
  it('calls the real API and passes through the created user on success (AUTH-01)', async () => {
    const user = { id: 'u1', username: 'ana', email: 'ana@example.com' }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(201, user))

    const response = await POST(
      postRequest({ username: 'ana', email: 'ana@example.com', password: 'secret' })
    )

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/user',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'ana', email: 'ana@example.com', password: 'secret' }),
      })
    )
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual(user)
  })

  it('normalizes a duplicate-email (4xx) API error into a client-safe message, without leaking internal details (AUTH-03 pattern)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(400, { message: 'email already in use' }))

    const response = await POST(
      postRequest({ username: 'ana', email: 'dup@example.com', password: 'secret' })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: 'email already in use' })
  })

  it('collapses an upstream 5xx/network failure into a generic 502 message (design.md Error Handling Strategy)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(500, { message: 'stack trace: something internal blew up' })
    )

    const response = await POST(
      postRequest({ username: 'ana', email: 'ana@example.com', password: 'secret' })
    )

    expect(response.status).toBe(502)
    const body = (await response.json()) as { message: string }
    expect(body.message).not.toContain('stack trace')
    expect(body.message).toBe('Não foi possível concluir o cadastro. Tente novamente.')
  })
})
