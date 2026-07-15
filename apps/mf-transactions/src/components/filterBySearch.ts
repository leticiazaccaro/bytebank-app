import type { Transaction } from '@repo/shared/types'

// TXN-04: "WHEN o usuário digita um termo de busca THEN o sistema SHALL
// filtrar transações cujo from ou to contenha o termo (case-insensitive)."
// An empty/whitespace-only term matches everything (no search applied).
export function filterBySearch(transactions: Transaction[], term: string): Transaction[] {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return transactions

  return transactions.filter((transaction) => {
    const from = transaction.from?.toLowerCase() ?? ''
    const to = transaction.to?.toLowerCase() ?? ''
    return from.includes(normalized) || to.includes(normalized)
  })
}
