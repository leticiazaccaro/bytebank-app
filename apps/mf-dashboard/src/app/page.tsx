import { fetchStatement } from '@repo/shared/apiClient'
import { getSessionToken } from '@repo/shared/auth'
import { BalanceCard } from '@/components/BalanceCard'
import { computeBalance } from './computeBalance'

export default async function DashboardPage() {
  const token = await getSessionToken()
  const transactions = token ? await fetchStatement(token) : []
  const balance = computeBalance(transactions)

  return (
    <div className="flex flex-col gap-6">
      <BalanceCard balance={balance} transactionCount={transactions.length} />
    </div>
  )
}
