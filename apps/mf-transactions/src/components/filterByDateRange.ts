import type { Transaction } from '@repo/shared/types'

export interface DateRange {
  from: string // ISO date string ('' means unset), inclusive lower bound
  to: string // ISO date string ('' means unset), inclusive upper bound
}

// TXN-03: "WHEN o usuário define um intervalo de datas THEN o sistema SHALL
// exibir apenas transações com date dentro do intervalo (inclusive)." Plain
// string comparison is safe here since Transaction.date is always ISO 8601
// (design.md Data Models), which sorts lexicographically the same as
// chronologically.
export function filterByDateRange(transactions: Transaction[], range: DateRange): Transaction[] {
  return transactions.filter((transaction) => {
    if (range.from && transaction.date < range.from) return false
    if (range.to && transaction.date > range.to) return false
    return true
  })
}
