import { configureStore } from '@reduxjs/toolkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { transactionsApi } from './transactionsApi'
import { createErrorMiddleware, uiErrorSlice } from './errorMiddleware'

// Same fetch/Request-mocking approach as transactionsApi.test.ts: fetchBaseQuery
// builds a real `Request` (needs `.clone()`), and the relative baseUrl used in
// production has no implicit origin under Node/Vitest.
function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const RealRequest = globalThis.Request

class LocalOriginRequest extends RealRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === 'string' && input.startsWith('/') ? `http://localhost${input}` : input, init)
  }
}

function makeTestStore(onSessionExpired: () => void) {
  return configureStore({
    reducer: {
      [transactionsApi.reducerPath]: transactionsApi.reducer,
      [uiErrorSlice.name]: uiErrorSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(transactionsApi.middleware)
        .concat(createErrorMiddleware({ onSessionExpired })),
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  vi.stubGlobal('Request', LocalOriginRequest)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('errorMiddleware', () => {
  it('triggers the session-expired handler on a 401 response (AUTH-05)', async () => {
    const onSessionExpired = vi.fn()
    const store = makeTestStore(onSessionExpired)
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { message: 'Sessão expirada.' }))

    await store.dispatch(transactionsApi.endpoints.getTransactions.initiate())

    expect(onSessionExpired).toHaveBeenCalledOnce()
  })

  it('does not surface a generic error message for a 401 (session-expired is handled separately)', async () => {
    const store = makeTestStore(vi.fn())
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { message: 'Sessão expirada.' }))

    await store.dispatch(transactionsApi.endpoints.getTransactions.initiate())

    expect(store.getState().uiError.message).toBeNull()
  })

  it('surfaces the upstream error message for a non-401 failure without calling the session-expired handler (API-05)', async () => {
    const onSessionExpired = vi.fn()
    const store = makeTestStore(onSessionExpired)
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(502, { message: 'Não foi possível carregar as transações. Tente novamente.' })
    )

    await store.dispatch(transactionsApi.endpoints.getTransactions.initiate())

    expect(store.getState().uiError.message).toBe(
      'Não foi possível carregar as transações. Tente novamente.'
    )
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('surfaces a fallback message when the failed response has no message body', async () => {
    const store = makeTestStore(vi.fn())
    vi.mocked(fetch).mockResolvedValue(jsonResponse(500, {}))

    await store.dispatch(transactionsApi.endpoints.getTransactions.initiate())

    expect(store.getState().uiError.message).toBe('Ocorreu um erro. Tente novamente.')
  })

  it('leaves the previously loaded transaction list untouched when a later mutation fails (API-05)', async () => {
    const store = makeTestStore(vi.fn())
    const transactions = [
      { id: 't1', accountId: 'acc-1', type: 'Credit', value: 100, date: '2026-01-01' },
    ]
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, transactions))
    const listResult = await store.dispatch(transactionsApi.endpoints.getTransactions.initiate())
    expect(listResult.data).toEqual(transactions)

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(502, { message: 'Falha ao criar.' }))
    await store.dispatch(
      transactionsApi.endpoints.createTransaction.initiate({ accountId: 'acc-1', type: 'Debit', value: 10 })
    )

    // The cached list query result is exactly what it was before the failed
    // mutation — the error middleware only records the message, it never
    // reaches into transactionsApi's own cache.
    const cached = transactionsApi.endpoints.getTransactions.select()(store.getState())
    expect(cached.data).toEqual(transactions)
    expect(store.getState().uiError.message).toBe('Falha ao criar.')
  })
})

describe('uiErrorSlice reducers', () => {
  it('setError stores the message and clearError resets it to null', () => {
    const state = uiErrorSlice.reducer(undefined, uiErrorSlice.actions.setError('Algo deu errado.'))
    expect(state.message).toBe('Algo deu errado.')

    const cleared = uiErrorSlice.reducer(state, uiErrorSlice.actions.clearError())
    expect(cleared.message).toBeNull()
  })
})
