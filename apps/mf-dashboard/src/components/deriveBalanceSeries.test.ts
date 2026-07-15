import { describe, expect, it } from 'vitest'

import { deriveBalanceSeries } from './deriveBalanceSeries'
import type { Transaction } from '@repo/shared/types'

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    accountId: 'acc-1',
    type: 'Credit',
    value: 100,
    date: '2024-01-01',
    ...overrides,
  }
}

describe('deriveBalanceSeries', () => {
  it('sorts out-of-order transactions chronologically and accumulates the running balance (HOME-01)', () => {
    const transactions = [
      tx({ id: 't2', type: 'Debit', value: 50, date: '2024-01-02' }),
      tx({ id: 't1', type: 'Credit', value: 100, date: '2024-01-01' }),
      tx({ id: 't3', type: 'Credit', value: 20, date: '2024-01-03' }),
    ]

    const series = deriveBalanceSeries(transactions)

    expect(series).toEqual([
      {
        id: 'saldo',
        data: [
          { x: '2024-01-01', y: 100 },
          { x: '2024-01-02', y: 50 },
          { x: '2024-01-03', y: 70 },
        ],
      },
    ])
  })

  it('returns an empty data series for an account with no transactions (feeds the HOME-03 empty state)', () => {
    expect(deriveBalanceSeries([])).toEqual([{ id: 'saldo', data: [] }])
  })
})
