import { describe, expect, it } from 'vitest'

import { computeBalance } from './computeBalance'
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

describe('computeBalance', () => {
  it('sums mixed Credit and Debit transactions into the correct net balance (HOME-01)', () => {
    const transactions = [
      tx({ id: 't1', type: 'Credit', value: 500 }),
      tx({ id: 't2', type: 'Debit', value: 120 }),
      tx({ id: 't3', type: 'Credit', value: 50 }),
    ]

    expect(computeBalance(transactions)).toBe(430)
  })

  it('returns 0 for an empty statement (new account, no transactions)', () => {
    expect(computeBalance([])).toBe(0)
  })

  it('returns a negative balance when debits outweigh credits', () => {
    const transactions = [tx({ id: 't1', type: 'Credit', value: 30 }), tx({ id: 't2', type: 'Debit', value: 100 })]

    expect(computeBalance(transactions)).toBe(-70)
  })
})
