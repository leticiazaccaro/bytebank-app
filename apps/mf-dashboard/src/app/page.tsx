import Link from 'next/link'
import { fetchStatement } from '@repo/shared/apiClient'
import { getSessionToken } from '@repo/shared/auth'
import type { Transaction } from '@repo/shared/types'
import { BalanceCard } from '@/components/BalanceCard'
import { BalanceChart } from '@/components/BalanceChart'
import { CategoryBreakdownChart } from '@/components/CategoryBreakdownChart'
import { computeBalance } from './computeBalance'

async function loadTransactions(): Promise<Transaction[]> {
  const token = await getSessionToken()
  if (!token) return []
  return fetchStatement(token)
}

export default async function DashboardPage() {
  let transactions: Transaction[]

  try {
    transactions = await loadTransactions()
  } catch {
    // Generic initial-fetch failure state (Edge Case: "API está fora do ar").
    // The 401-vs-network distinction and auto-logout/redirect are wired in
    // T44, which extends this same pattern once the shared error middleware
    // from T43 exists.
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-neutral-600">
          Não foi possível carregar seus dados financeiros. Tente novamente.
        </p>
        <Link href="/" className="text-primary font-medium underline">
          Tentar novamente
        </Link>
      </div>
    )
  }

  const balance = computeBalance(transactions)

  return (
    <div className="flex flex-col gap-6">
      <BalanceCard balance={balance} transactionCount={transactions.length} />
      <BalanceChart transactions={transactions} />
      <CategoryBreakdownChart transactions={transactions} />
    </div>
  )
}
