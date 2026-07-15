import { createElement, type ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'
import type { Transaction } from '@repo/shared/types'
import { makeStore } from '@/store/store'
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

// T46: TransactionListClient now reads `uiError.message` via `useSelector`
// (LiveRegion wiring, A11Y-03) — needs a Provider in the tree, same
// `makeStore()` this component gets from the real `StoreProvider` in
// layout.tsx. `children` passed positionally per this codebase's existing
// react/no-children-prop workaround (see TransactionFormModal.test.ts).
function renderWithStore(initialData: Transaction[]): string {
  return renderToStaticMarkup(
    createElement(
      Provider,
      { store: makeStore() } as ComponentProps<typeof Provider>,
      createElement(TransactionListClient, { initialData })
    )
  )
}

describe('TransactionListClient', () => {
  it('renders every transaction and the type filter controls on initial render (TXN-01)', () => {
    const transactions = [
      tx({ id: 't1', type: 'Credit', from: 'Salário', value: 3500 }),
      tx({ id: 't2', type: 'Debit', to: 'Mercado', value: 240 }),
    ]

    const html = renderWithStore(transactions)

    expect(html).toContain('Salário')
    expect(html).toContain('Mercado')
    expect(html).toContain('Todos')
    expect(html).toContain('Crédito')
    expect(html).toContain('Débito')
  })

  it('renders the empty state with a "clear filters" action when there are no results (TXN-07)', () => {
    const html = renderWithStore([])

    expect(html).toContain('Nenhuma transação encontrada para os filtros aplicados.')
    expect(html).toContain('Limpar filtros')
  })
})
