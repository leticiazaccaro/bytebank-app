// @vitest-environment jsdom
//
// T63/API-02: TransactionListClient now subscribes to `useGetTransactionsQuery`
// (previously it only ever rendered the static `initialData` SSR snapshot).
// This verifies spec.md's "Integração de transações com a API real" AC #2 —
// after create/edit/delete, the visible list reflects the change via RTK
// Query cache invalidation, without a full page reload — while T30's
// original "no loading flash" first-paint guarantee still holds.
import { act, createElement, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@repo/shared/types'
import { makeStore } from '@/store/store'
import { TransactionListClient } from './TransactionListClient'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function noBodyResponse(status: number): Response {
  return new Response(null, { status })
}

// Same rationale as TransactionListClient.wiring.test.ts / store/transactionsApi.test.ts:
// fetchBaseQuery always builds a real `Request` from the relative
// `/api/transactions` baseUrl, which needs a base origin to resolve under
// Node/jsdom.
const RealRequest = globalThis.Request
class LocalOriginRequest extends RealRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === 'string' && input.startsWith('/') ? `http://localhost${input}` : input, init)
  }
}

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

function renderList(props: ComponentProps<typeof TransactionListClient>) {
  act(() => {
    root.render(
      createElement(
        Provider,
        { store: makeStore() } as ComponentProps<typeof Provider>,
        createElement(TransactionListClient, props)
      )
    )
  })
}

function findButtonByAriaLabel(label: string): HTMLButtonElement {
  const button = Array.from(document.querySelectorAll('button')).find(
    (el) => el.getAttribute('aria-label') === label
  )
  if (!button) throw new Error(`button with aria-label "${label}" not found`)
  return button
}

function setInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
  setter.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

function setSelectValue(el: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!
  setter.call(el, value)
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

// Lets the whole microtask chain of a mutation's fetch -> json -> dispatch ->
// tag-invalidation-triggered refetch -> json -> dispatch sequence drain,
// without hard-coding how many `await Promise.resolve()` rounds that chain
// needs — a macrotask boundary is only reached once every queued microtask
// (however deep the chain) has run.
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  vi.stubGlobal('Request', LocalOriginRequest)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('TransactionListClient — SSR-first paint still holds (regression, T30)', () => {
  it('renders initialData immediately on mount, before the live query resolves', () => {
    // The live query's fetch never resolves — proves first paint doesn't
    // wait on it: `data ?? initialData` falls back synchronously.
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
    const transactions = [tx({ id: 't1', from: 'Salário', value: 3500 })]

    renderList({ initialData: transactions })

    expect(container.textContent).toContain('Salário')
  })
})

describe('TransactionListClient — live cache updates after mutations (API-02, T63)', () => {
  it('shows a newly created transaction without a page reload', async () => {
    let backend = [tx({ id: 't1', accountId: 'acc-42', from: 'Salário', value: 3500 })]
    vi.mocked(fetch).mockImplementation(async (input) => {
      const request = input as Request
      if (request.method === 'POST') {
        const body = await request.clone().json()
        const created = { id: 't-new', date: '2026-07-15', ...body }
        backend = [...backend, created]
        return jsonResponse(201, created)
      }
      return jsonResponse(200, backend)
    })

    renderList({ initialData: [backend[0]] })

    expect(container.textContent).toContain('Salário')
    expect(container.textContent).not.toContain('Uber')

    act(() => {
      findButtonByAriaLabel('Nova transação').click()
    })

    setSelectValue(document.body.querySelector('#transaction-type') as HTMLSelectElement, 'Credit')
    setInputValue(document.body.querySelector('#transaction-description') as HTMLInputElement, 'Uber')
    setInputValue(document.body.querySelector('#transaction-value') as HTMLInputElement, '10')

    await act(async () => {
      const form = document.querySelector('[role="dialog"] form')!
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await flush()
    })

    // The create closed the modal (no full reload/navigation happened) and
    // the list — driven by the RTK Query cache, not the static prop — now
    // includes the new transaction alongside the original one.
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(container.textContent).toContain('Uber')
    expect(container.textContent).toContain('Salário')
  })

  it('reflects an edited transaction without a page reload', async () => {
    let backend = [tx({ id: 't1', accountId: 'acc-42', type: 'Debit', to: 'Mercado', value: 240 })]
    vi.mocked(fetch).mockImplementation(async (input) => {
      const request = input as Request
      if (request.method === 'PUT') {
        const body = await request.clone().json()
        backend = backend.map((t) => (t.id === 't1' ? { ...t, ...body } : t))
        return jsonResponse(200, backend[0])
      }
      return jsonResponse(200, backend)
    })

    renderList({ initialData: backend })

    expect(container.textContent).toContain('240')

    act(() => {
      findButtonByAriaLabel('Editar transação de Mercado').click()
    })

    setInputValue(document.body.querySelector('#transaction-value') as HTMLInputElement, '999')

    await act(async () => {
      const form = document.querySelector('[role="dialog"] form')!
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await flush()
    })

    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(container.textContent).toContain('999')
    expect(container.textContent).not.toContain('240')
  })

  it('removes a deleted transaction without a page reload', async () => {
    let backend = [
      tx({ id: 't1', from: 'Salário', value: 3500 }),
      tx({ id: 't2', to: 'Mercado da esquina', type: 'Debit', value: 240 }),
    ]
    vi.mocked(fetch).mockImplementation(async (input) => {
      const request = input as Request
      if (request.method === 'DELETE') {
        const id = request.url.split('/').pop()
        backend = backend.filter((t) => t.id !== id)
        return noBodyResponse(204)
      }
      return jsonResponse(200, backend)
    })

    renderList({ initialData: backend })

    expect(container.textContent).toContain('Mercado da esquina')

    act(() => {
      findButtonByAriaLabel('Excluir transação de Mercado da esquina').click()
    })

    await act(async () => {
      const confirmButton = Array.from(document.querySelectorAll('[role="dialog"] button')).find(
        (el) => el.textContent === 'Excluir'
      )!
      confirmButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await flush()
    })

    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(container.textContent).not.toContain('Mercado da esquina')
    expect(container.textContent).toContain('Salário')
  })
})
