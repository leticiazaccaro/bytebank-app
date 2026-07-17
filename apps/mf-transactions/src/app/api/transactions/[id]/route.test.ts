import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'

import { DELETE, PUT } from './route'

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'status-text',
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

function noBodyResponse(status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'status-text',
    json: vi.fn().mockRejectedValue(new Error('should not be called for a 204/no-body response')),
  } as unknown as Response
}

function mockCookie(token: string | undefined) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (token && name === 'bytebank_session' ? { name, value: token } : undefined),
  } as never)
}

function putRequest(body: unknown): Request {
  return new Request('http://localhost/api/transactions/t1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  process.env.API_BASE_URL = 'https://api.example.com'
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.API_BASE_URL
})

describe('PUT /api/transactions/:id', () => {
  it('updates the transaction and returns it (API-03)', async () => {
    mockCookie('jwt-abc')
    const updated = { id: 't1', accountId: 'acc-1', type: 'Credit', value: 75, date: '2026-01-01' }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { message: 'ok', result: updated }))

    const response = await PUT(putRequest({ value: 75 }), ctx('t1'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(updated)
  })

  it('returns 401 without calling the upstream API when no session cookie is present', async () => {
    mockCookie(undefined)

    const response = await PUT(putRequest({ value: 75 }), ctx('t1'))

    expect(response.status).toBe(401)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns 404 when the upstream API reports the transaction as not found (not-found passthrough)', async () => {
    mockCookie('jwt-abc')
    vi.mocked(fetch).mockResolvedValue(jsonResponse(404, { message: 'not found' }))

    const response = await PUT(putRequest({ value: 75 }), ctx('missing'))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ message: 'Transação não encontrada.' })
  })

  it('returns a generic 502 when the upstream API is unreachable', async () => {
    mockCookie('jwt-abc')
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))

    const response = await PUT(putRequest({ value: 75 }), ctx('t1'))

    expect(response.status).toBe(502)
    const body = (await response.json()) as { message: string }
    expect(body.message).not.toContain('network down')
  })
})

describe('DELETE /api/transactions/:id', () => {
  it('deletes the transaction and returns 204 without attempting to parse a body (API-04)', async () => {
    mockCookie('jwt-abc')
    const upstream = noBodyResponse(204)
    vi.mocked(fetch).mockResolvedValue(upstream)

    const response = await DELETE(new Request('http://localhost/api/transactions/t1', { method: 'DELETE' }), ctx('t1'))

    expect(response.status).toBe(204)
    expect(upstream.json).not.toHaveBeenCalled()
  })

  it('returns 401 without calling the upstream API when no session cookie is present', async () => {
    mockCookie(undefined)

    const response = await DELETE(new Request('http://localhost/api/transactions/t1', { method: 'DELETE' }), ctx('t1'))

    expect(response.status).toBe(401)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns 404 when the upstream API reports the transaction as not found (not-found passthrough)', async () => {
    mockCookie('jwt-abc')
    vi.mocked(fetch).mockResolvedValue(jsonResponse(404, { message: 'not found' }))

    const response = await DELETE(
      new Request('http://localhost/api/transactions/missing', { method: 'DELETE' }),
      ctx('missing')
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ message: 'Transação não encontrada.' })
  })
})
