import type { Transaction, TransactionAPIType } from '@repo/shared/types'

export type TypeFilter = TransactionAPIType | 'all'

// TXN-01: "WHEN o usuário seleciona um filtro de tipo (Débito/Crédito) THEN
// o sistema SHALL exibir apenas transações do tipo selecionado." 'all'
// passes every transaction through unfiltered (no filter selected).
export function filterByType(transactions: Transaction[], filter: TypeFilter): Transaction[] {
  if (filter === 'all') return transactions
  return transactions.filter((transaction) => transaction.type === filter)
}
