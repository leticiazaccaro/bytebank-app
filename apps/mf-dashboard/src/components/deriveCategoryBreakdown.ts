import { CATEGORIES } from '@repo/shared/categories'
import type { CategoryIndex } from '@repo/shared/categoryIndex'
import type { CategoryId, Transaction } from '@repo/shared/types'

export interface CategorySlice {
  id: CategoryId
  label: string
  value: number
}

export interface CategoryBreakdown {
  credit: CategorySlice[]
  debit: CategorySlice[]
}

const LABEL_BY_ID: Record<CategoryId, string> = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category.label])
) as Record<CategoryId, string>

function groupByCategory(transactions: Transaction[], categoryIndex: CategoryIndex): CategorySlice[] {
  const totals = new Map<CategoryId, number>()

  for (const transaction of transactions) {
    const categoryId = categoryIndex[transaction.id] ?? 'outros'
    totals.set(categoryId, (totals.get(categoryId) ?? 0) + transaction.value)
  }

  return [...totals.entries()]
    .map(([id, value]) => ({ id, label: LABEL_BY_ID[id], value }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Groups the statement into entradas (Credit) vs. saídas (Debit) totals per
 * category, using the client-side category index (spec.md HOME-02).
 * Transactions with no entry in the index fall back to 'outros' (spec.md
 * Edge Case: "índice local de categorias é limpo").
 */
export function deriveCategoryBreakdown(
  transactions: Transaction[],
  categoryIndex: CategoryIndex
): CategoryBreakdown {
  return {
    credit: groupByCategory(
      transactions.filter((t) => t.type === 'Credit'),
      categoryIndex
    ),
    debit: groupByCategory(
      transactions.filter((t) => t.type === 'Debit'),
      categoryIndex
    ),
  }
}
