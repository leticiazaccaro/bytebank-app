import { describe, expect, it } from 'vitest'
import type { Transaction } from '@repo/shared/types'
import { filterByType } from './filterByType'

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

describe('filterByType', () => {
  it('returns only Debit transactions when filtered by Debit (TXN-01)', () => {
    const transactions = [
      tx({ id: 't1', type: 'Debit' }),
      tx({ id: 't2', type: 'Credit' }),
      tx({ id: 't3', type: 'Debit' }),
    ]

    expect(filterByType(transactions, 'Debit')).toEqual([transactions[0], transactions[2]])
  })

  it('returns only Credit transactions when filtered by Credit (TXN-01)', () => {
    const transactions = [
      tx({ id: 't1', type: 'Debit' }),
      tx({ id: 't2', type: 'Credit' }),
      tx({ id: 't3', type: 'Debit' }),
    ]

    expect(filterByType(transactions, 'Credit')).toEqual([transactions[1]])
  })

  it("returns every transaction unfiltered when the filter is 'all'", () => {
    const transactions = [tx({ id: 't1', type: 'Debit' }), tx({ id: 't2', type: 'Credit' })]

    expect(filterByType(transactions, 'all')).toEqual(transactions)
  })

  it('returns an empty array when no transaction matches the selected type', () => {
    const transactions = [tx({ id: 't1', type: 'Credit' })]

    expect(filterByType(transactions, 'Debit')).toEqual([])
  })
})
