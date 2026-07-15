import { fetchStatement } from '@repo/shared/apiClient'
import { getSessionToken } from '@repo/shared/auth'
import { formatBRL, formatDate } from '@repo/shared/formatters'
import type { Transaction } from '@repo/shared/types'

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

// Minimal server-rendered list — T31 replaces this with
// <TransactionListClient initialData={transactions} /> once that component
// exists (filters/search/infinite scroll land in T31-T35). This task's own
// scope is only the initial SSR fetch: rendering the fetched transactions
// directly in the server-rendered HTML proves there's no client-side
// loading flash on first paint.
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

  return (
    <ul aria-label="Transações" className="flex flex-col gap-2">
      {transactions.map((transaction) => (
        <li
          key={transaction.id}
          className="flex justify-between gap-4 border-b border-neutral-200 py-2"
        >
          <span>{transaction.from ?? transaction.to ?? '—'}</span>
          <span>{formatBRL(transaction.value)}</span>
          <span>{formatDate(transaction.date)}</span>
        </li>
      ))}
    </ul>
  )
}
