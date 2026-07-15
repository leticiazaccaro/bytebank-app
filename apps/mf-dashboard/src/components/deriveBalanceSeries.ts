import type { Transaction } from '@repo/shared/types'

export interface BalancePoint {
  x: string
  y: number
}

export interface BalanceSeries {
  id: string
  data: BalancePoint[]
}

/**
 * Derives a cumulative-balance-over-time series from the full statement, for
 * the "evolução de saldo" line chart (spec.md HOME-01). Transactions are
 * sorted chronologically (ascending by ISO date) before accumulating; Credit
 * adds to the running balance, Debit subtracts (the API always sends `value`
 * positive — see design.md Data Models).
 */
export function deriveBalanceSeries(transactions: Transaction[]): BalanceSeries[] {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))

  let running = 0
  const data: BalancePoint[] = sorted.map((t) => {
    running += t.type === 'Credit' ? t.value : -t.value
    return { x: t.date, y: running }
  })

  return [{ id: 'saldo', data }]
}
