import { Account, Transaction, TransactionAPIType, User } from './types'

// Thin fetch wrappers against the real tech-challenge-2 API.
// Base URL comes from the API_BASE_URL env var (never hardcoded — see
// design.md Tech Decisions / spec.md AC INFRA-03).

export class ApiClientError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
  }
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown }
    if (body && typeof body.message === 'string') return body.message
  } catch {
    // response body isn't JSON (or is empty) — fall back to statusText
  }
  return response.statusText || 'Request failed'
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${process.env.API_BASE_URL ?? ''}${path}`, init)

  if (!response.ok) {
    const message = await extractErrorMessage(response)
    throw new ApiClientError(response.status, message)
  }

  // DELETE responds 204 with no body — never attempt to parse it as JSON.
  if (response.status === 204) {
    return undefined as T
  }

  // The real API wraps every response body in `{ message, result }` — the
  // actual payload callers care about is always under `result`.
  const body = (await response.json()) as unknown
  if (body && typeof body === 'object' && 'result' in body) {
    return (body as { result: T }).result
  }
  return body as T
}

export interface RegisterInput {
  username: string
  email: string
  password: string
}

export async function register(input: RegisterInput): Promise<User> {
  return request<User>('/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

// The real API's /user/auth response only carries a token — no user object.
export async function login(email: string, password: string): Promise<{ token: string }> {
  return request<{ token: string }>('/user/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

/**
 * The API supports a single account per user (see spec.md Out of Scope).
 * Resolves the account via GET /account, then fetches its statement.
 *
 * GET /account's `result` nests the account list under `account` (alongside
 * `transactions`/`cards`, unused here); GET /account/:id/statement's
 * `result` nests the statement under `transactions` — neither is the bare
 * array `request<T>`'s generic `.result` unwrap would suggest.
 */
export async function fetchStatement(token: string): Promise<Transaction[]> {
  const accountId = await fetchAccountId(token)
  if (!accountId) return []

  const { transactions } = await request<{ transactions: Transaction[] }>(
    `/account/${accountId}/statement`,
    { headers: authHeaders(token) }
  )
  return transactions
}

/**
 * Resolves the user's account id via GET /account, independent of any
 * statement — needed to create the user's very first transaction, when
 * there's no existing transaction to read an accountId off of.
 */
export async function fetchAccountId(token: string): Promise<string | null> {
  const { account } = await request<{ account: Account[] }>('/account', {
    headers: authHeaders(token),
  })
  return account[0]?.id ?? null
}

export interface CreateTransactionInput {
  accountId: string
  type: TransactionAPIType
  value: number
  from?: string
  to?: string
  anexo?: string
  urlAnexo?: string
}

export async function createTransaction(
  token: string,
  input: CreateTransactionInput
): Promise<Transaction> {
  return request<Transaction>('/account/transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    // API-06: value is always sent positive — the backend applies the sign
    // itself based on `type`.
    body: JSON.stringify({ ...input, value: Math.abs(input.value) }),
  })
}

export async function updateTransaction(
  token: string,
  id: string,
  patch: Partial<CreateTransactionInput>
): Promise<Transaction> {
  return request<Transaction>(`/account/transaction/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(
      patch.value === undefined ? patch : { ...patch, value: Math.abs(patch.value) }
    ),
  })
}

export async function deleteTransaction(token: string, id: string): Promise<void> {
  await request<void>(`/account/transaction/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}
