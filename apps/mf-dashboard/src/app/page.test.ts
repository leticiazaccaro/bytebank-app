import type { ReactElement, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/shared/auth', () => ({
  getSessionToken: vi.fn(),
}))
vi.mock('@repo/shared/apiClient', () => ({
  fetchStatement: vi.fn(),
}))

import { fetchStatement } from '@repo/shared/apiClient'
import { getSessionToken } from '@repo/shared/auth'
import { BalanceCard } from '@/components/BalanceCard'
import { BalanceChart } from '@/components/BalanceChart'
import { CategoryBreakdownChart } from '@/components/CategoryBreakdownChart'
import type { Transaction } from '@repo/shared/types'
import DashboardPage from './page'

function isReactElement(node: ReactNode): node is ReactElement {
  return typeof node === 'object' && node !== null && 'type' in node && 'props' in node
}

// DashboardPage is an async Server Component — calling it directly returns a
// plain React element tree (no rendering/DOM involved), so the composed
// children and their props can be asserted on directly. Mirrors the
// dependency-injectable-function testing pattern already used in
// apps/shell (submitLogin.ts/submitRegister.ts) without pulling in a DOM
// renderer for a single page.
function findByType(node: ReactNode, type: unknown): ReactElement | undefined {
  if (!isReactElement(node)) return undefined
  if (node.type === type) return node

  const children = (node.props as { children?: ReactNode }).children
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findByType(child, type)
      if (found) return found
    }
  } else if (children !== undefined) {
    return findByType(children, type)
  }
  return undefined
}

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

beforeEach(() => {
  vi.mocked(getSessionToken).mockResolvedValue('jwt-abc')
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('DashboardPage', () => {
  it('composes BalanceCard, BalanceChart, and CategoryBreakdownChart from the fetched statement (HOME-01, HOME-02)', async () => {
    const transactions = [
      tx({ id: 't1', type: 'Credit', value: 500 }),
      tx({ id: 't2', type: 'Debit', value: 120 }),
    ]
    vi.mocked(fetchStatement).mockResolvedValue(transactions)

    const element = await DashboardPage()

    const balanceCard = findByType(element, BalanceCard)
    expect(balanceCard?.props).toMatchObject({ balance: 380, transactionCount: 2 })

    const balanceChart = findByType(element, BalanceChart)
    expect(balanceChart?.props).toMatchObject({ transactions })

    const categoryChart = findByType(element, CategoryBreakdownChart)
    expect(categoryChart?.props).toMatchObject({ transactions })
  })

  it('renders all three sections without crashing for a new account with no transactions', async () => {
    vi.mocked(fetchStatement).mockResolvedValue([])

    const element = await DashboardPage()

    expect(findByType(element, BalanceCard)?.props).toMatchObject({ balance: 0, transactionCount: 0 })
    expect(findByType(element, BalanceChart)).toBeDefined()
    expect(findByType(element, CategoryBreakdownChart)).toBeDefined()
  })

  it('renders a retry error state instead of crashing when the initial fetch fails (Edge Case: API fora do ar)', async () => {
    vi.mocked(fetchStatement).mockRejectedValue(new Error('network down'))

    const element = await DashboardPage()

    expect(findByType(element, BalanceCard)).toBeUndefined()
    expect(element.props).toMatchObject({ role: 'alert' })
  })
})
