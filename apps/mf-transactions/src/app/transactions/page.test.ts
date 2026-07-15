import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/shared/auth', () => ({
  getSessionToken: vi.fn(),
}))
vi.mock('@repo/shared/apiClient', () => ({
  fetchStatement: vi.fn(),
}))

import { fetchStatement } from '@repo/shared/apiClient'
import { getSessionToken } from '@repo/shared/auth'
import type { Transaction } from '@repo/shared/types'
import TransactionsPage from './page'

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

beforeEach(() => {
  vi.mocked(getSessionToken).mockResolvedValue('jwt-abc')
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('TransactionsPage', () => {
  it('renders the fetched transactions directly in the server-rendered markup — no client-side loading flash (API-01)', async () => {
    vi.mocked(fetchStatement).mockResolvedValue([
      tx({ id: 't1', from: 'Salário', value: 500, date: '2026-01-05' }),
      tx({ id: 't2', to: 'Mercado', value: 80, date: '2026-01-06' }),
    ])

    const element = await TransactionsPage()
    const html = renderToStaticMarkup(element)

    expect(html).toContain('Salário')
    expect(html).toContain('Mercado')
    expect(html).toContain('500,00')
    expect(html).toContain('80,00')
  })

  it('renders an informative empty state for a new account with no transactions', async () => {
    vi.mocked(fetchStatement).mockResolvedValue([])

    const element = await TransactionsPage()
    const html = renderToStaticMarkup(element)

    expect(html).toContain('Você ainda não tem transações.')
  })

  it('renders a retry error state instead of crashing when the initial fetch fails (Edge Case: API fora do ar)', async () => {
    vi.mocked(fetchStatement).mockRejectedValue(new Error('network down'))

    const element = await TransactionsPage()

    expect(element.props).toMatchObject({ role: 'alert' })
  })
})
