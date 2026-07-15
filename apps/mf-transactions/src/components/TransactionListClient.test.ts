import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Transaction } from '@repo/shared/types'
import { TransactionListClient } from './TransactionListClient'

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

describe('TransactionListClient', () => {
  it('renders every transaction and the type filter controls on initial render (TXN-01)', () => {
    const transactions = [
      tx({ id: 't1', type: 'Credit', from: 'Salário', value: 3500 }),
      tx({ id: 't2', type: 'Debit', to: 'Mercado', value: 240 }),
    ]

    const html = renderToStaticMarkup(createElement(TransactionListClient, { initialData: transactions }))

    expect(html).toContain('Salário')
    expect(html).toContain('Mercado')
    expect(html).toContain('Todos')
    expect(html).toContain('Crédito')
    expect(html).toContain('Débito')
  })

  it('renders the empty-table message when initialData has no transactions', () => {
    const html = renderToStaticMarkup(createElement(TransactionListClient, { initialData: [] }))

    expect(html).toContain('Nenhuma transação encontrada para o filtro selecionado.')
  })
})
