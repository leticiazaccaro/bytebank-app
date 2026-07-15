import { describe, expect, it } from 'vitest'
import type { Transaction } from '@repo/shared/types'
import { filterByCategory } from './filterByCategory'

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

describe('filterByCategory', () => {
  it('returns only transactions mapped to the selected category in the index (TXN-02)', () => {
    const transactions = [tx({ id: 't1' }), tx({ id: 't2' }), tx({ id: 't3' })]
    const index = { t1: 'alimentacao' as const, t2: 'transporte' as const, t3: 'alimentacao' as const }

    expect(filterByCategory(transactions, index, 'alimentacao')).toEqual([
      transactions[0],
      transactions[2],
    ])
  })

  it('falls back to "outros" for transactions with no entry in the index (Edge Case: índice limpo)', () => {
    const transactions = [tx({ id: 't1' }), tx({ id: 't2' })]
    const index = { t1: 'alimentacao' as const }

    expect(filterByCategory(transactions, index, 'outros')).toEqual([transactions[1]])
  })

  it("returns every transaction unfiltered when the filter is 'all'", () => {
    const transactions = [tx({ id: 't1' }), tx({ id: 't2' })]

    expect(filterByCategory(transactions, {}, 'all')).toEqual(transactions)
  })

  it('returns an empty array when no transaction matches the selected category', () => {
    const transactions = [tx({ id: 't1' })]
    const index = { t1: 'alimentacao' as const }

    expect(filterByCategory(transactions, index, 'saude')).toEqual([])
  })
})
