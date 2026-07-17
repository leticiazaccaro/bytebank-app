import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ApiClientError,
  createTransaction,
  deleteTransaction,
  fetchAccountId,
  fetchStatement,
  login,
  register,
  updateTransaction,
} from './apiClient'

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

beforeEach(() => {
  process.env.API_BASE_URL = 'https://api.example.com'
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.API_BASE_URL
})

describe('register', () => {
  it('POSTs to /user with the registration payload and returns the created user', async () => {
    const user = { id: 'u1', username: 'ana', email: 'ana@example.com' }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(201, { message: 'ok', result: user }))

    const result = await register({ username: 'ana', email: 'ana@example.com', password: 'secret' })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/user',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'ana', email: 'ana@example.com', password: 'secret' }),
      })
    )
    expect(result).toEqual(user)
  })

  it('throws ApiClientError on a 4xx response (e.g. duplicate email)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(400, { message: 'email already in use' }))

    await expect(
      register({ username: 'ana', email: 'ana@example.com', password: 'secret' })
    ).rejects.toMatchObject({ status: 400, message: 'email already in use' })
  })
})

describe('login', () => {
  it('POSTs to /user/auth and returns { token } (the real API returns no user object)', async () => {
    const result_ = { token: 'jwt-abc' }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { message: 'ok', result: result_ }))

    const result = await login('ana@example.com', 'secret')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/user/auth',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'ana@example.com', password: 'secret' }),
      })
    )
    expect(result).toEqual(result_)
  })

  it('throws ApiClientError on a 401 (invalid credentials) without a client-unsafe leak', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { message: 'invalid credentials' }))

    await expect(login('ana@example.com', 'wrong')).rejects.toBeInstanceOf(ApiClientError)
    await expect(login('ana@example.com', 'wrong')).rejects.toMatchObject({ status: 401 })
  })
})

describe('fetchStatement', () => {
  it('resolves the account via GET /account, then GETs its statement with the bearer token', async () => {
    const accounts = [{ id: 'acc-1', type: 'checking', userId: 'u1' }]
    const transactions = [
      { id: 't1', accountId: 'acc-1', type: 'Credit', value: 100, date: '2026-01-01' },
    ]
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(200, { message: 'ok', result: { account: accounts, transactions: [], cards: [] } })
      )
      .mockResolvedValueOnce(jsonResponse(200, { message: 'ok', result: { transactions } }))

    const result = await fetchStatement('jwt-abc')

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/account',
      expect.objectContaining({ headers: { Authorization: 'Bearer jwt-abc' } })
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/account/acc-1/statement',
      expect.objectContaining({ headers: { Authorization: 'Bearer jwt-abc' } })
    )
    expect(result).toEqual(transactions)
  })

  it('throws ApiClientError on a 5xx (API down / network failure surfaced as a failed response)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(502, { message: 'upstream unavailable' }))

    await expect(fetchStatement('jwt-abc')).rejects.toMatchObject({ status: 502 })
  })
})

describe('fetchAccountId', () => {
  it('resolves the account id via GET /account, independent of any statement — needed to create a brand-new account\'s first transaction', async () => {
    const accounts = [{ id: 'acc-1', type: 'checking', userId: 'u1' }]
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, { message: 'ok', result: { account: accounts, transactions: [], cards: [] } })
    )

    const result = await fetchAccountId('jwt-abc')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/account',
      expect.objectContaining({ headers: { Authorization: 'Bearer jwt-abc' } })
    )
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(result).toBe('acc-1')
  })

  it('resolves to null when the account list is empty', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, { message: 'ok', result: { account: [], transactions: [], cards: [] } })
    )

    await expect(fetchAccountId('jwt-abc')).resolves.toBeNull()
  })

  it('throws ApiClientError on a 5xx (API down / network failure surfaced as a failed response)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(502, { message: 'upstream unavailable' }))

    await expect(fetchAccountId('jwt-abc')).rejects.toMatchObject({ status: 502 })
  })
})

describe('createTransaction', () => {
  it('POSTs to /account/transaction with the bearer token and a positive value', async () => {
    const created = { id: 't1', accountId: 'acc-1', type: 'Debit', value: 50, date: '2026-01-01' }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(201, { message: 'ok', result: created }))

    const result = await createTransaction('jwt-abc', {
      accountId: 'acc-1',
      type: 'Debit',
      value: -50, // caller passes a negative value — API-06 requires normalization
      from: 'Uber',
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/account/transaction',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-abc' },
        body: JSON.stringify({ accountId: 'acc-1', type: 'Debit', value: 50, from: 'Uber' }),
      })
    )
    expect(result).toEqual(created)
  })

  it('throws ApiClientError on a 4xx validation failure', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(422, { message: 'value is required' }))

    await expect(
      createTransaction('jwt-abc', { accountId: 'acc-1', type: 'Debit', value: 10 })
    ).rejects.toMatchObject({ status: 422 })
  })
})

describe('updateTransaction', () => {
  it('PUTs to /account/transaction/:id with a positive value', async () => {
    const updated = { id: 't1', accountId: 'acc-1', type: 'Credit', value: 75, date: '2026-01-01' }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { message: 'ok', result: updated }))

    const result = await updateTransaction('jwt-abc', 't1', { value: -75 })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/account/transaction/t1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ value: 75 }),
      })
    )
    expect(result).toEqual(updated)
  })

  it('throws ApiClientError on a 404 (transaction not found)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(404, { message: 'not found' }))

    await expect(updateTransaction('jwt-abc', 'missing', { value: 10 })).rejects.toMatchObject({
      status: 404,
    })
  })
})

describe('deleteTransaction', () => {
  it('DELETEs /account/transaction/:id and resolves without parsing the 204 body as JSON', async () => {
    const response = noBodyResponse(204)
    vi.mocked(fetch).mockResolvedValue(response)

    await expect(deleteTransaction('jwt-abc', 't1')).resolves.toBeUndefined()

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/account/transaction/t1',
      expect.objectContaining({ method: 'DELETE', headers: { Authorization: 'Bearer jwt-abc' } })
    )
    expect(response.json).not.toHaveBeenCalled()
  })

  it('throws ApiClientError on a 404 (transaction not found)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(404, { message: 'not found' }))

    await expect(deleteTransaction('jwt-abc', 'missing')).rejects.toMatchObject({ status: 404 })
  })
})
