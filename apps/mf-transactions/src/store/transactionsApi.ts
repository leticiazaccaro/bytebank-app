import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { TagDescription } from '@reduxjs/toolkit/query/react'
import type { CreateTransactionInput } from '@repo/shared/apiClient'
import type { Transaction } from '@repo/shared/types'

// Points at this zone's own Route Handlers (T26/T27) — never the real API
// directly. Those Route Handlers are this zone's BFF: they read the session
// cookie server-side and forward to the real tech-challenge-2 API
// (design.md "apps/mf-transactions").
const BASE_URL = '/api/transactions'

// The real API's DELETE responds 204 with no body — parsing it as JSON
// throws, so this custom responseHandler always short-circuits on 204
// before attempting to parse (design.md Error Handling Strategy).
async function responseHandler(response: Response): Promise<unknown> {
  if (response.status === 204) return null
  return response.json()
}

export interface UpdateTransactionArgs {
  id: string
  patch: Partial<CreateTransactionInput>
}

// Extracted as plain functions (not inlined in the endpoint config below) so
// the exact declared tag set — LIST-only for create, id+LIST for
// update/delete, per design.md's tag pattern (API-02..04) — is directly
// unit-testable without simulating RTK Query's internal invalidation
// dispatch machinery.
export function createTagInvalidatesTags(): TagDescription<'Transaction'>[] {
  return [{ type: 'Transaction', id: 'LIST' }]
}

export function idAndListTags(id: string): TagDescription<'Transaction'>[] {
  return [
    { type: 'Transaction', id },
    { type: 'Transaction', id: 'LIST' },
  ]
}

export const transactionsApi = createApi({
  reducerPath: 'transactionsApi',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL, responseHandler }),
  tagTypes: ['Transaction'],
  endpoints: (builder) => ({
    getTransactions: builder.query<Transaction[], void>({
      query: () => '',
      providesTags: (result) =>
        result
          ? [
              ...result.map((transaction) => ({ type: 'Transaction' as const, id: transaction.id })),
              { type: 'Transaction' as const, id: 'LIST' },
            ]
          : [{ type: 'Transaction' as const, id: 'LIST' }],
    }),
    createTransaction: builder.mutation<Transaction, CreateTransactionInput>({
      query: (body) => ({ url: '', method: 'POST', body }),
      // API-02: creating a transaction only affects the list membership, not
      // any single existing transaction — invalidate LIST only.
      invalidatesTags: createTagInvalidatesTags,
    }),
    updateTransaction: builder.mutation<Transaction, UpdateTransactionArgs>({
      query: ({ id, patch }) => ({ url: `/${id}`, method: 'PUT', body: patch }),
      // API-03: refresh the edited transaction's own cache entry and the
      // list (its summary/sort position may have changed).
      invalidatesTags: (_result, _error, { id }) => idAndListTags(id),
    }),
    deleteTransaction: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}`, method: 'DELETE' }),
      // API-04: same reasoning as update — the deleted id and the list.
      invalidatesTags: (_result, _error, id) => idAndListTags(id),
    }),
  }),
})

export const {
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionsApi
