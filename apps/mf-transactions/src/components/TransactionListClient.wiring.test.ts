// @vitest-environment jsdom
//
// T58: wires TransactionFormModal (create/edit) and DeleteConfirmationModal
// into TransactionListClient. Needs a real DOM mount (createRoot + act) and
// a live Redux store, same pattern as TransactionFormModal.edit.test.ts /
// DeleteConfirmationModal.test.ts — the modals call RTK Query mutation
// hooks, which need a Provider in the tree.
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

// Same rationale as TransactionFormModal.test.ts / store/transactionsApi.test.ts:
// fetchBaseQuery always builds a real `Request` from the relative
// `/api/transactions` baseUrl, which needs a base origin to resolve under
// Node/jsdom.
const RealRequest = globalThis.Request
class LocalOriginRequest extends RealRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === 'string' && input.startsWith('/') ? `http://localhost${input}` : input, init)
  }
}

// T46: TransactionListClient now reads `uiError.message` via `useSelector`
// (LiveRegion wiring, A11Y-03) — reuses the real `makeStore()` (same one
// `StoreProvider` uses in layout.tsx) instead of a hand-rolled store missing
// that reducer.
function makeTestStore() {
  return makeStore()
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

// See TransactionFormModal.test.ts for why `children` is passed positionally
// (with a type cast) instead of as a literal props key.
function renderList(store: ReturnType<typeof makeTestStore>, props: ComponentProps<typeof TransactionListClient>) {
  act(() => {
    root.render(
      createElement(
        Provider,
        { store } as ComponentProps<typeof Provider>,
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

function dialogTitle(): string | null {
  return document.querySelector('[role="dialog"] #modal-title')?.textContent ?? null
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

describe('TransactionListClient — "Nova transação" control (FORM-01)', () => {
  it('is not present initially and opens TransactionFormModal in create mode when clicked', () => {
    const store = makeTestStore()
    const transactions = [tx({ id: 't1', from: 'Salário', value: 3500 })]

    renderList(store, { initialData: transactions })

    expect(document.querySelector('[role="dialog"]')).toBeNull()

    act(() => {
      findButtonByAriaLabel('Nova transação').click()
    })

    expect(dialogTitle()).toBe('Nova transação')
    // Create mode: no transaction pre-fills the type field.
    expect((document.body.querySelector('#transaction-type') as HTMLSelectElement).value).toBe('')
  })

  it('sends the account id derived from the loaded transactions when a new transaction is created', async () => {
    const store = makeTestStore()
    const transactions = [tx({ id: 't1', accountId: 'acc-42', from: 'Salário', value: 3500 })]
    // T63: TransactionListClient now also holds a live `useGetTransactionsQuery`
    // subscription, so `fetch` receives both that GET (mount, and any refetch
    // after the create invalidates the LIST tag) and the POST below — routed
    // by method instead of assuming call order/count.
    vi.mocked(fetch).mockImplementation(async (input) => {
      const request = input as Request
      if (request.method === 'POST') {
        return jsonResponse(201, {
          id: 't2',
          accountId: 'acc-42',
          type: 'Credit',
          value: 10,
          from: 'Uber',
          date: '2026-07-15',
        })
      }
      return jsonResponse(200, transactions)
    })

    renderList(store, { initialData: transactions })

    act(() => {
      findButtonByAriaLabel('Nova transação').click()
    })

    const setSelectValue = (el: HTMLSelectElement, value: string) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!
      setter.call(el, value)
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    const setInputValue = (el: HTMLInputElement, value: string) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }

    setSelectValue(document.body.querySelector('#transaction-type') as HTMLSelectElement, 'Credit')
    setInputValue(document.body.querySelector('#transaction-description') as HTMLInputElement, 'Uber')
    setInputValue(document.body.querySelector('#transaction-value') as HTMLInputElement, '10')

    await act(async () => {
      const form = document.querySelector('[role="dialog"] form')!
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    const postCall = vi.mocked(fetch).mock.calls.find(([req]) => (req as Request).method === 'POST')
    expect(postCall).toBeDefined()
    const request = postCall![0] as Request
    const body = await request.clone().json()
    expect(body.accountId).toBe('acc-42')
    // A successful save also closes the modal and returns to the list, same
    // as cancelling — no full page reload, no dialog left open.
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('announces a failed create via the list-level live region (A11Y-03, T43/T46)', async () => {
    const store = makeTestStore()
    const transactions = [tx({ id: 't1', accountId: 'acc-42', from: 'Salário', value: 3500 })]
    vi.mocked(fetch).mockResolvedValue(jsonResponse(502, { message: 'Não foi possível criar a transação.' }))

    renderList(store, { initialData: transactions })

    act(() => {
      findButtonByAriaLabel('Nova transação').click()
    })

    const setSelectValue = (el: HTMLSelectElement, value: string) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')!.set!
      setter.call(el, value)
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    const setInputValue = (el: HTMLInputElement, value: string) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }

    setSelectValue(document.body.querySelector('#transaction-type') as HTMLSelectElement, 'Credit')
    setInputValue(document.body.querySelector('#transaction-description') as HTMLInputElement, 'Uber')
    setInputValue(document.body.querySelector('#transaction-value') as HTMLInputElement, '10')

    await act(async () => {
      const form = document.querySelector('[role="dialog"] form')!
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    // The list-level live region (outside the modal, rendered by
    // TransactionListClient itself) picks up the error middleware's message
    // from the shared store — not a message owned by the form.
    const region = container.querySelector('[aria-live="assertive"]')
    expect(region?.textContent).toBe('Não foi possível criar a transação.')
  })
})

describe('TransactionListClient — per-row edit/delete actions (FORM-07, API-04)', () => {
  it('opens TransactionFormModal in edit mode, pre-filled with the clicked row', () => {
    const store = makeTestStore()
    const transactions = [
      tx({ id: 't1', type: 'Credit', from: 'Salário', value: 3500 }),
      tx({ id: 't2', type: 'Debit', to: 'Mercado da esquina', value: 240 }),
    ]

    renderList(store, { initialData: transactions })

    act(() => {
      findButtonByAriaLabel('Editar transação de Mercado da esquina').click()
    })

    expect(dialogTitle()).toBe('Editar transação')
    expect((document.body.querySelector('#transaction-type') as HTMLSelectElement).value).toBe('Debit')
    expect((document.body.querySelector('#transaction-description') as HTMLInputElement).value).toBe(
      'Mercado da esquina'
    )
  })

  it('opens DeleteConfirmationModal scoped to the clicked row and deletes only that transaction', async () => {
    const store = makeTestStore()
    const transactions = [
      tx({ id: 't1', type: 'Credit', from: 'Salário', value: 3500 }),
      tx({ id: 't2', type: 'Debit', to: 'Mercado da esquina', value: 240 }),
    ]
    // T63: TransactionListClient now also holds a live `useGetTransactionsQuery`
    // subscription, so `fetch` receives both that GET (mount, and any refetch
    // after the delete invalidates the LIST tag) and the DELETE below — routed
    // by method instead of assuming call order/count.
    vi.mocked(fetch).mockImplementation(async (input) => {
      const request = input as Request
      if (request.method === 'DELETE') return noBodyResponse(204)
      return jsonResponse(200, transactions)
    })

    renderList(store, { initialData: transactions })

    act(() => {
      findButtonByAriaLabel('Excluir transação de Mercado da esquina').click()
    })

    expect(dialogTitle()).toBe('Excluir transação')

    await act(async () => {
      const confirmButton = Array.from(document.querySelectorAll('[role="dialog"] button')).find(
        (el) => el.textContent === 'Excluir'
      )!
      confirmButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    const deleteCall = vi.mocked(fetch).mock.calls.find(([req]) => (req as Request).method === 'DELETE')
    expect(deleteCall).toBeDefined()
    const request = deleteCall![0] as Request
    expect(request.method).toBe('DELETE')
    expect(request.url).toBe('http://localhost/api/transactions/t2')
  })
})

describe('TransactionListClient — closing a modal returns to the list (no full reload)', () => {
  it('cancelling the create form closes the modal and keeps the list intact', () => {
    const store = makeTestStore()
    const transactions = [tx({ id: 't1', from: 'Salário', value: 3500 })]

    renderList(store, { initialData: transactions })

    act(() => {
      findButtonByAriaLabel('Nova transação').click()
    })
    expect(dialogTitle()).toBe('Nova transação')

    act(() => {
      const cancelButton = Array.from(document.querySelectorAll('[role="dialog"] button')).find(
        (el) => el.textContent === 'Cancelar'
      )!
      cancelButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.textContent).toContain('Salário')
  })

  it('cancelling the delete confirmation closes the modal without removing the transaction', () => {
    const store = makeTestStore()
    const transactions = [tx({ id: 't1', from: 'Salário', value: 3500 })]

    renderList(store, { initialData: transactions })

    act(() => {
      findButtonByAriaLabel('Excluir transação de Salário').click()
    })
    expect(dialogTitle()).toBe('Excluir transação')

    act(() => {
      const cancelButton = Array.from(document.querySelectorAll('[role="dialog"] button')).find(
        (el) => el.textContent === 'Cancelar'
      )!
      cancelButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('Salário')
  })
})
