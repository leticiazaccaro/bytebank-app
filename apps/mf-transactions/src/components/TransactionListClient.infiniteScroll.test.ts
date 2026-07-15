// @vitest-environment jsdom
//
// The other TransactionListClient tests use renderToStaticMarkup (no DOM,
// no effects) — infinite scroll needs a real mount so the sentinel ref
// attaches and the IntersectionObserver effect actually runs. Scoped to
// this file only; the rest of the app's tests keep running under 'node'.
import { act, createElement, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

type ObserverCallback = (entries: Pick<IntersectionObserverEntry, 'isIntersecting'>[]) => void
let observerCallback: ObserverCallback | null = null

class MockIntersectionObserver {
  constructor(callback: ObserverCallback) {
    observerCallback = callback
  }
  observe() {}
  disconnect() {}
  unobserve() {}
}

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  observerCallback = null
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('TransactionListClient infinite scroll (TXN-06)', () => {
  it('reveals more items as the sentinel intersects, without any network request', () => {
    const transactions = Array.from({ length: 45 }, (_, index) =>
      tx({ id: `t${index}`, from: `Transação ${index}`, date: '2026-01-05' })
    )

    act(() => {
      root.render(
        createElement(
          Provider,
          { store: makeStore() } as ComponentProps<typeof Provider>,
          createElement(TransactionListClient, { initialData: transactions })
        )
      )
    })

    expect(container.querySelectorAll('tbody tr').length).toBe(20)

    act(() => {
      observerCallback?.([{ isIntersecting: true }])
    })

    expect(container.querySelectorAll('tbody tr').length).toBe(40)

    act(() => {
      observerCallback?.([{ isIntersecting: true }])
    })

    expect(container.querySelectorAll('tbody tr').length).toBe(45)

    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not reveal more items when the sentinel is not intersecting', () => {
    const transactions = Array.from({ length: 45 }, (_, index) => tx({ id: `t${index}`, date: '2026-01-05' }))

    act(() => {
      root.render(
        createElement(
          Provider,
          { store: makeStore() } as ComponentProps<typeof Provider>,
          createElement(TransactionListClient, { initialData: transactions })
        )
      )
    })

    act(() => {
      observerCallback?.([{ isIntersecting: false }])
    })

    expect(container.querySelectorAll('tbody tr').length).toBe(20)
  })
})
