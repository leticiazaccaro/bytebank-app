import { redirect } from 'next/navigation'
import { ApiClientError, fetchAccountId, fetchStatement } from '@repo/shared/apiClient'
import { getSessionToken } from '@repo/shared/auth'
import type { Transaction } from '@repo/shared/types'
import { TransactionListClient } from '@/components/TransactionListClient'

// Server Component fetches the initial statement directly (apiClient +
// getSessionToken), never self-fetching this zone's own /api/transactions
// Route Handler — that handler exists for the client-side RTK Query slice
// (T29), not for server-to-server calls. Same pattern as
// apps/mf-dashboard/src/app/page.tsx (T21). See local Next docs,
// "backend-for-frontend.md", "Caveats > Server Components".
//
// accountId is fetched alongside the statement (not derived from
// transactions[0]) because a brand-new account has no transaction to read
// one off of, yet still needs it to create its very first transaction.
async function loadTransactionsAndAccount(): Promise<{
  transactions: Transaction[]
  accountId: string
}> {
  const token = await getSessionToken()
  if (!token) return { transactions: [], accountId: '' }

  const [transactions, accountId] = await Promise.all([
    fetchStatement(token),
    fetchAccountId(token),
  ])
  return { transactions, accountId: accountId ?? '' }
}

export default async function TransactionsPage() {
  let data: { transactions: Transaction[]; accountId: string }

  try {
    data = await loadTransactionsAndAccount()
  } catch (error) {
    // AUTH-05: same 401-vs-network distinction as mf-dashboard's page.tsx
    // (T44) — an expired/invalid session sends the user to log in again
    // instead of stranding them on a retry state that can never succeed.
    if (error instanceof ApiClientError && error.status === 401) {
      redirect('/login')
    }

    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-neutral-600">
          Não foi possível carregar suas transações. Tente novamente.
        </p>
      </div>
    )
  }

  // Always renders TransactionListClient, even with zero transactions —
  // the "Nova transação" FAB (and the ability to add the account's very
  // first transaction) lives inside it, and previously only rendered when
  // there was already at least one transaction to show.
  return <TransactionListClient initialData={data.transactions} initialAccountId={data.accountId} />
}
