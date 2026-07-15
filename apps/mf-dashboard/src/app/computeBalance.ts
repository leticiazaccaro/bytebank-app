import type { Transaction } from '@repo/shared/types'

/**
 * Sums the account balance from the full statement for the Home page's
 * BalanceCard (spec.md HOME-01). Credit transactions add to the balance,
 * Debit transactions subtract — the API always sends `value` positive (see
 * design.md Data Models), so the sign is applied here based on `type`.
 */
export function computeBalance(transactions: Transaction[]): number {
  return transactions.reduce((total, t) => total + (t.type === 'Credit' ? t.value : -t.value), 0)
}
