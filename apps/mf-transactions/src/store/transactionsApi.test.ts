import { configureStore } from '@reduxjs/toolkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createTagInvalidatesTags, idAndListTags, transactionsApi } from './transactionsApi'

// fetchBaseQuery always builds a real `Request` internally (and calls
// `response.clone()`/`.text()` on whatever `fetch` resolves with) before
// ever reaching the mocked `fetch` below — a hand-rolled plain-object
// "Response" (as used in the Route Handler tests, which only ever call
// `.json()`) doesn't implement `.clone()`, so real `Response` instances are
// used here instead.
function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function noBodyResponse(status: number): Response {
  const response = new Response(null, { status })
  vi.spyOn(response, 'json').mockRejectedValue(
    new Error('should not be called for a 204/no-body response')
  )
  return response
}

// Node's built-in `Request` (unlike a browser) has no implicit base URL, so
// the relative `/api/transactions` baseUrl used in production (correct for
// the real same-origin browser runtime — see transactionsApi.ts) fails to
// parse under Vitest. Resolves relative input against a fixed dummy origin,
// test-only; production code is untouched.
const RealRequest = globalThis.Request

class LocalOriginRequest extends RealRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === 'string' && input.startsWith('/') ? `http://localhost${input}` : input, init)
  }
}

// Builds a fresh store (independent from `makeStore()`/StoreProvider — see
// T28) wired with the real transactionsApi reducer/middleware.
function makeTestStore() {
  return configureStore({
    reducer: { [transactionsApi.reducerPath]: transactionsApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(transactionsApi.middleware),
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  vi.stubGlobal('Request', LocalOriginRequest)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('transactionsApi', () => {
  it('getTransactions resolves the parsed transaction list (data-layer contract)', async () => {
    const store = makeTestStore()
    const transactions = [
      { id: 't1', accountId: 'acc-1', type: 'Credit', value: 100, date: '2026-01-01' },
    ]
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, transactions))

    const result = await store.dispatch(transactionsApi.endpoints.getTransactions.initiate())

    expect(result.data).toEqual(transactions)
  })

  it('createTransaction resolves the created transaction (API-02)', async () => {
    const store = makeTestStore()
    const created = { id: 't1', accountId: 'acc-1', type: 'Debit', value: 50, date: '2026-01-01' }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(201, created))

    const result = await store.dispatch(
      transactionsApi.endpoints.createTransaction.initiate({ accountId: 'acc-1', type: 'Debit', value: 50 })
    )

    expect('error' in result).toBe(false)
    expect(result.data).toEqual(created)
  })

  it('updateTransaction resolves the updated transaction (API-03)', async () => {
    const store = makeTestStore()
    const updated = { id: 't1', accountId: 'acc-1', type: 'Credit', value: 75, date: '2026-01-01' }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, updated))

    const result = await store.dispatch(
      transactionsApi.endpoints.updateTransaction.initiate({ id: 't1', patch: { value: 75 } })
    )

    expect('error' in result).toBe(false)
    expect(result.data).toEqual(updated)
  })

  it('deleteTransaction resolves a 204 response without a parse error (API-04)', async () => {
    const store = makeTestStore()
    const upstream = noBodyResponse(204)
    vi.mocked(fetch).mockResolvedValue(upstream)

    const result = await store.dispatch(transactionsApi.endpoints.deleteTransaction.initiate('t1'))

    expect('error' in result).toBe(false)
    expect(upstream.json).not.toHaveBeenCalled()
  })
})

// RTK Query's automatic `invalidatesTags`-driven cache invalidation doesn't
// dispatch an observable `<reducerPath>/invalidateTags` action (that type is
// only used by the *manual* `api.util.invalidateTags` escape hatch) — it
// recomputes affected cache entries internally via `selectInvalidatedBy` and
// only emits a visible action (`refetchQuery`/`removeQueryResult`) for
// entries that are actually cached/subscribed. Since this schema has a
// single list query (no per-id query endpoint), that path can't distinguish
// "invalidated by the LIST tag" from "invalidated by an id tag" — both
// happen to refetch the same subscription either way. Testing the declared
// tag sets directly (as exported pure functions, see transactionsApi.ts) is
// the precise, 1:1 way to verify each mutation's declared contract.
describe('transactionsApi tag declarations', () => {
  it('create invalidates only the LIST tag, not any specific id (API-02)', () => {
    expect(createTagInvalidatesTags()).toEqual([{ type: 'Transaction', id: 'LIST' }])
  })

  it('update/delete invalidate the specific id and the LIST tag (API-03, API-04)', () => {
    expect(idAndListTags('t1')).toEqual([
      { type: 'Transaction', id: 't1' },
      { type: 'Transaction', id: 'LIST' },
    ])
  })
})
