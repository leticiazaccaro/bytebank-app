// Test-only fixture (T55) — seeds transactions directly against the stub
// API fixture (stub-api-server.mjs), bypassing the UI. Two reasons this is
// needed rather than always driving the form:
//
// 1. A brand-new account has zero transactions, and
//    apps/mf-transactions/src/app/transactions/page.tsx renders a plain
//    "Você ainda não tem transações." message with no reachable "Nova
//    transação" control in that case (TransactionListClient, which owns the
//    FAB, is never mounted). At least one transaction must exist server-side
//    before any UI-driven scenario can begin.
// 2. The 20+ transaction scroll scenario is impractical to build one-by-one
//    through the form UI — tasks.md's T55 definition explicitly allows
//    seeding this via direct calls to the stub API.
//
// Never used by application code — e2e-only, same status as
// stub-api-server.mjs itself.
const STUB_API_URL = 'http://localhost:4310'

export interface SeedTransactionInput {
  type: 'Debit' | 'Credit'
  value: number
  from?: string
  to?: string
}

/** Reads the session token the shell's login Route Handler stored in the httpOnly cookie. */
export function sessionToken(cookies: { name: string; value: string }[]): string {
  const cookie = cookies.find((c) => c.name === 'bytebank_session')
  if (!cookie) throw new Error('Seed setup: session cookie not found — is the user logged in?')
  return cookie.value
}

export async function getAccountId(token: string): Promise<string> {
  const response = await fetch(`${STUB_API_URL}/account`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const accounts = (await response.json()) as { id: string }[]
  if (!accounts[0]) throw new Error('Seed setup: no account found for this session token.')
  return accounts[0].id
}

export async function seedTransaction(
  token: string,
  accountId: string,
  input: SeedTransactionInput
): Promise<void> {
  const response = await fetch(`${STUB_API_URL}/account/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ accountId, ...input }),
  })
  if (!response.ok) {
    throw new Error(`Seed setup: failed to create transaction (${response.status}).`)
  }
}
