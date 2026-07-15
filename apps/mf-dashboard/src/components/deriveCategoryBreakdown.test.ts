import { describe, expect, it } from 'vitest'

import { deriveCategoryBreakdown } from './deriveCategoryBreakdown'
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

describe('deriveCategoryBreakdown', () => {
  it('groups Credit and Debit transactions into separate category totals (HOME-02)', () => {
    const transactions = [
      tx({ id: 't1', type: 'Credit', value: 3000 }),
      tx({ id: 't2', type: 'Debit', value: 200 }),
      tx({ id: 't3', type: 'Debit', value: 50 }),
    ]
    const categoryIndex = { t1: 'salario', t2: 'alimentacao', t3: 'alimentacao' } as const

    const breakdown = deriveCategoryBreakdown(transactions, categoryIndex)

    expect(breakdown.credit).toEqual([{ id: 'salario', label: 'Salário', value: 3000 }])
    expect(breakdown.debit).toEqual([{ id: 'alimentacao', label: 'Alimentação', value: 250 }])
  })

  it("falls back uncategorized transactions to 'outros' (Edge Case: índice local limpo)", () => {
    const transactions = [tx({ id: 't1', type: 'Debit', value: 80 })]

    const breakdown = deriveCategoryBreakdown(transactions, {})

    expect(breakdown.debit).toEqual([{ id: 'outros', label: 'Outros', value: 80 }])
  })

  it('returns empty credit/debit slices for an account with no transactions (feeds the HOME-03 empty state)', () => {
    expect(deriveCategoryBreakdown([], {})).toEqual({ credit: [], debit: [] })
  })
})
