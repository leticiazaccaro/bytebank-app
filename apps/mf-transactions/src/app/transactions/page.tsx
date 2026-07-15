import { fetchStatement } from '@repo/shared/apiClient'
import { getSessionToken } from '@repo/shared/auth'
import type { Transaction } from '@repo/shared/types'
import { TransactionListClient } from '@/components/TransactionListClient'

// Server Component fetches the initial statement directly (apiClient +
// getSessionToken), never self-fetching this zone's own /api/transactions
// Route Handler — that handler exists for the client-side RTK Query slice
// (T29), not for server-to-server calls. Same pattern as
// apps/mf-dashboard/src/app/page.tsx (T21). See local Next docs,
// "backend-for-frontend.md", "Caveats > Server Components".
async function loadTransactions(): Promise<Transaction[]> {
  const token = await getSessionToken()
  if (!token) return []
  return fetchStatement(token)
}

export default async function TransactionsPage() {
  let transactions: Transaction[]

  try {
    transactions = await loadTransactions()
  } catch {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-neutral-600">
          Não foi possível carregar suas transações. Tente novamente.
        </p>
      </div>
    )
  }

  if (transactions.length === 0) {
    return <p className="text-neutral-600 py-12 text-center">Você ainda não tem transações.</p>
  }

  // Passed as initialData (design.md "apps/mf-transactions") — rendering the
  // fetched list directly in the server-rendered HTML is what proves there's
  // no client-side loading flash on first paint (T30's own scope); filtering
  // (TXN-01) is TransactionListClient's own client-side state (T31).
  return <TransactionListClient initialData={transactions} />
}
