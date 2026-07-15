import type { CategoryIndex } from '@repo/shared/categoryIndex'
import type { CategoryId, Transaction } from '@repo/shared/types'

export type CategoryFilter = CategoryId | 'all'

// TXN-02: "WHEN o usuário seleciona um filtro de categoria THEN o sistema
// SHALL exibir apenas transações mapeadas para essa categoria no índice
// local." Transactions with no entry in the index fall back to 'outros'
// (spec.md Edge Case: "índice local de categorias é limpo... transações
// SHALL continuar visíveis, apenas sem categoria (fallback 'Outros')").
export function filterByCategory(
  transactions: Transaction[],
  categoryIndex: CategoryIndex,
  filter: CategoryFilter
): Transaction[] {
  if (filter === 'all') return transactions
  return transactions.filter(
    (transaction) => (categoryIndex[transaction.id] ?? 'outros') === filter
  )
}
