import { describe, expect, it } from 'vitest'
import type { Transaction } from '@repo/shared/types'
import { applyFilters } from './applyFilters'

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

const noFilters = { type: 'all' as const, category: 'all' as const, dateRange: { from: '', to: '' }, search: '' }

describe('applyFilters', () => {
  it('intersects type + search filters — only transactions matching both survive (TXN-05)', () => {
    const transactions = [
      tx({ id: 't1', type: 'Credit', from: 'Uber Eats' }),
      tx({ id: 't2', type: 'Debit', from: 'Uber' }),
      tx({ id: 't3', type: 'Credit', from: 'Mercado' }),
    ]

    const result = applyFilters(transactions, {}, { ...noFilters, type: 'Credit', search: 'uber' })

    expect(result).toEqual([transactions[0]])
  })

  it('intersects category + date-range filters — only transactions matching both survive (TXN-05)', () => {
    const transactions = [
      tx({ id: 't1', date: '2026-01-05' }),
      tx({ id: 't2', date: '2026-02-10' }),
      tx({ id: 't3', date: '2026-01-20' }),
    ]
    const categoryIndex = { t1: 'alimentacao' as const, t2: 'alimentacao' as const, t3: 'transporte' as const }

    const result = applyFilters(transactions, categoryIndex, {
      ...noFilters,
      category: 'alimentacao',
      dateRange: { from: '2026-01-01', to: '2026-01-31' },
    })

    expect(result).toEqual([transactions[0]])
  })

  it('returns every transaction unfiltered when no filter is active', () => {
    const transactions = [tx({ id: 't1' }), tx({ id: 't2' })]

    expect(applyFilters(transactions, {}, noFilters)).toEqual(transactions)
  })
})
