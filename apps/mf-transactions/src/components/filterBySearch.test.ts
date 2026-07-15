import { describe, expect, it } from 'vitest'
import type { Transaction } from '@repo/shared/types'
import { filterBySearch } from './filterBySearch'

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

describe('filterBySearch', () => {
  it('matches transactions whose "from" contains the term, case-insensitively (TXN-04)', () => {
    const transactions = [tx({ id: 't1', from: 'Uber Eats' }), tx({ id: 't2', from: 'Mercado' })]

    expect(filterBySearch(transactions, 'UBER')).toEqual([transactions[0]])
  })

  it('matches transactions whose "to" contains the term, case-insensitively (TXN-04)', () => {
    const transactions = [tx({ id: 't1', to: 'João Silva' }), tx({ id: 't2', to: 'Mercado' })]

    expect(filterBySearch(transactions, 'joão')).toEqual([transactions[0]])
  })

  it('returns every transaction unfiltered when the term is empty', () => {
    const transactions = [tx({ id: 't1', from: 'Uber' }), tx({ id: 't2', to: 'Mercado' })]

    expect(filterBySearch(transactions, '')).toEqual(transactions)
  })

  it('returns an empty array when no transaction matches the term', () => {
    const transactions = [tx({ id: 't1', from: 'Uber' })]

    expect(filterBySearch(transactions, 'inexistente')).toEqual([])
  })
})
