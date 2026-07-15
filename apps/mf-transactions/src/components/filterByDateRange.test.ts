import { describe, expect, it } from 'vitest'
import type { Transaction } from '@repo/shared/types'
import { filterByDateRange } from './filterByDateRange'

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    accountId: 'acc-1',
    type: 'Credit',
    value: 100,
    date: '2026-01-05',
    ...overrides,
  }
}

describe('filterByDateRange', () => {
  it('includes a transaction dated exactly on the "from" boundary (TXN-03 inclusive bound)', () => {
    const transactions = [tx({ id: 't1', date: '2026-01-10' })]

    expect(filterByDateRange(transactions, { from: '2026-01-10', to: '' })).toEqual(transactions)
  })

  it('includes a transaction dated exactly on the "to" boundary (TXN-03 inclusive bound)', () => {
    const transactions = [tx({ id: 't1', date: '2026-01-20' })]

    expect(filterByDateRange(transactions, { from: '', to: '2026-01-20' })).toEqual(transactions)
  })

  it('excludes transactions outside the [from, to] interval', () => {
    const transactions = [
      tx({ id: 't1', date: '2026-01-05' }),
      tx({ id: 't2', date: '2026-01-15' }),
      tx({ id: 't3', date: '2026-01-25' }),
    ]

    expect(filterByDateRange(transactions, { from: '2026-01-10', to: '2026-01-20' })).toEqual([
      transactions[1],
    ])
  })

  it('returns every transaction unfiltered when both bounds are unset', () => {
    const transactions = [tx({ id: 't1', date: '2026-01-05' }), tx({ id: 't2', date: '2026-06-01' })]

    expect(filterByDateRange(transactions, { from: '', to: '' })).toEqual(transactions)
  })
})
