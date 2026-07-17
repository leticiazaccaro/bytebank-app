// @vitest-environment jsdom
import { act, createElement, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCategoryIndex } from '@repo/shared/categoryIndex'
import { transactionsApi } from '@/store/transactionsApi'
import { TransactionFormModal } from './TransactionFormModal'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Same rationale as TransactionFormModal.test.ts / store/transactionsApi.test.ts.
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

function submitForm(root: HTMLElement) {
  const form = root.querySelector('form')
  if (!form) throw new Error('form not found')
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

let container: HTMLDivElement
let root: Root

// See TransactionFormModal.test.ts for why `children` is passed positionally
// (with a type cast) instead of as a literal props key.
function renderModal(
  store: ReturnType<typeof makeTestStore>,
  props: { isOpen: boolean; onClose: () => void; accountId: string }
) {
  act(() => {
    root.render(
      createElement(
        Provider,
        { store } as ComponentProps<typeof Provider>,
        createElement(TransactionFormModal, props)
      )
    )
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  vi.stubGlobal('Request', LocalOriginRequest)
  localStorage.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('TransactionFormModal — category suggestion (FORM-03)', () => {
  it('pre-selects the category suggested from a known-keyword description', () => {
    const store = makeTestStore()
    renderModal(store, { isOpen: true, onClose: vi.fn(), accountId: 'acc-1' })

    setInputValue(
      document.body.querySelector('#transaction-description') as HTMLInputElement,
      'Uber para o trabalho'
    )

    const categorySelect = document.body.querySelector('#transaction-category') as HTMLSelectElement
    expect(categorySelect.value).toBe('transporte')
  })

  it('keeps a manually chosen category even after the description changes further', () => {
    const store = makeTestStore()
    renderModal(store, { isOpen: true, onClose: vi.fn(), accountId: 'acc-1' })

    setInputValue(document.body.querySelector('#transaction-description') as HTMLInputElement, 'Uber')
    setSelectValue(document.body.querySelector('#transaction-category') as HTMLSelectElement, 'lazer')
    setInputValue(
      document.body.querySelector('#transaction-description') as HTMLInputElement,
      'Uber e depois farmácia'
    )

    const categorySelect = document.body.querySelector('#transaction-category') as HTMLSelectElement
    expect(categorySelect.value).toBe('lazer')
  })
})

describe('TransactionFormModal — category persistence (FORM-04)', () => {
  it('persists transactionId -> category in the local index after a successful save', async () => {
    const store = makeTestStore()
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, {
        id: 't-created-1',
        accountId: 'acc-1',
        type: 'Debit',
        value: 45,
        to: 'Mercado da esquina',
        date: '2026-07-15',
      })
    )

    renderModal(store, { isOpen: true, onClose: vi.fn(), accountId: 'acc-1' })

    setSelectValue(document.body.querySelector('#transaction-type') as HTMLSelectElement, 'Debit')
    setInputValue(
      document.body.querySelector('#transaction-description') as HTMLInputElement,
      'Mercado da esquina'
    )
    // FORM-08: the value field is masked — typing digit-by-digit "4500"
    // (not "45") is what produces "45,00".
    setInputValue(document.body.querySelector('#transaction-value') as HTMLInputElement, '4500')

    await act(async () => {
      submitForm(document.body)
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(getCategoryIndex()).toEqual({ 't-created-1': 'alimentacao' })
  })
})
