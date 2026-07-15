import type { CategoryIndex } from '@repo/shared/categoryIndex'
import type { Transaction } from '@repo/shared/types'
import { filterByType, type TypeFilter } from './filterByType'
import { filterByCategory, type CategoryFilter } from './filterByCategory'
import { filterByDateRange, type DateRange } from './filterByDateRange'
import { filterBySearch } from './filterBySearch'

export interface TransactionFilters {
  type: TypeFilter
  category: CategoryFilter
  dateRange: DateRange
  search: string
}

// TXN-05: "WHEN múltiplos filtros/busca estão ativos THEN o sistema SHALL
// combiná-los com AND (interseção)." Each filter narrows the previous
// step's result, so the final list only contains transactions that satisfy
// every active filter simultaneously.
export function applyFilters(
  transactions: Transaction[],
  categoryIndex: CategoryIndex,
  filters: TransactionFilters
): Transaction[] {
  const byType = filterByType(transactions, filters.type)
  const byCategory = filterByCategory(byType, categoryIndex, filters.category)
  const byDateRange = filterByDateRange(byCategory, filters.dateRange)
  return filterBySearch(byDateRange, filters.search)
}
