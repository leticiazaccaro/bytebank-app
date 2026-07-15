// @vitest-environment jsdom
import { act, createElement, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { transactionsApi } from '@/store/transactionsApi'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function noBodyResponse(status: number): Response {
  return new Response(null, { status })
}

// Same rationale as store/transactionsApi.test.ts.
const RealRequest = globalThis.Request
class LocalOriginRequest extends RealRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === 'string' && input.startsWith('/') ? `http://localhost${input}` : input, init)
  }
}

function makeTestStore() {
  return configureStore({
    reducer: { [transactionsApi.reducerPath]: transactionsApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(transactionsApi.middleware),
  })
}

function clickButton(root: HTMLElement, text: string) {
  const button = Array.from(root.querySelectorAll('button')).find((el) => el.textContent === text)
  if (!button) throw new Error(`button "${text}" not found`)
  button.click()
}

let container: HTMLDivElement
let root: Root

// `children` is a required prop on react-redux's ProviderProps, but passing
// it as a literal object key trips `react/no-children-prop` — passed
// positionally instead, per that rule, with a type cast since a props
// object without `children` doesn't satisfy ProviderProps outside JSX.
function renderModal(
  store: ReturnType<typeof makeTestStore>,
  props: { isOpen: boolean; onClose: () => void; transactionId: string }
) {
  act(() => {
    root.render(
      createElement(
        Provider,
        { store } as ComponentProps<typeof Provider>,
        createElement(DeleteConfirmationModal, props)
      )
    )
  })
}

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

describe('DeleteConfirmationModal — confirm (API-04)', () => {
  it('removes the transaction from the local list after confirming', async () => {
    const store = makeTestStore()
    const initial = [
      { id: 't1', accountId: 'acc-1', type: 'Debit', value: 50, date: '2026-01-01' },
      { id: 't2', accountId: 'acc-1', type: 'Credit', value: 100, date: '2026-01-02' },
    ]
    const afterDelete = [initial[1]]

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(200, initial))
      .mockResolvedValueOnce(noBodyResponse(204))
      .mockResolvedValueOnce(jsonResponse(200, afterDelete))

    // Establishes a live subscription on the LIST query — matches how a
    // mounted TransactionListClient would consume the cache — so the
    // delete mutation's tag invalidation triggers an observable refetch.
    await store.dispatch(transactionsApi.endpoints.getTransactions.initiate())

    const onClose = vi.fn()
    renderModal(store, { isOpen: true, onClose, transactionId: 't1' })

    await act(async () => {
      clickButton(document.body, 'Excluir')
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    const selected = transactionsApi.endpoints.getTransactions.select()(store.getState())
    expect(selected.data).toEqual(afterDelete)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('DeleteConfirmationModal — cancel', () => {
  it('sends no request and leaves the transaction untouched when cancelled', () => {
    const store = makeTestStore()
    const onClose = vi.fn()

    renderModal(store, { isOpen: true, onClose, transactionId: 't1' })

    act(() => {
      clickButton(document.body, 'Cancelar')
    })

    expect(fetch).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
