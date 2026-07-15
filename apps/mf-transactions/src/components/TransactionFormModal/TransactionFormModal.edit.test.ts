// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setCategoryForTransaction } from '@repo/shared/categoryIndex'
import type { Transaction } from '@repo/shared/types'
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

function submitForm(root: HTMLElement) {
  const form = root.querySelector('form')
  if (!form) throw new Error('form not found')
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

let container: HTMLDivElement
let root: Root

function renderModal(
  store: ReturnType<typeof makeTestStore>,
  props: { isOpen: boolean; onClose: () => void; accountId: string; transaction?: Transaction }
) {
  act(() => {
    root.render(
      createElement(Provider, { store, children: createElement(TransactionFormModal, props) })
    )
  })
}

function existingTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 't-existing-1',
    accountId: 'acc-1',
    type: 'Debit',
    value: 45,
    to: 'Mercado da esquina',
    anexo: 'nota-fiscal.pdf',
    urlAnexo: 'data:application/pdf;base64,QUJD',
    date: '2026-07-10',
    ...overrides,
  }
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

describe('TransactionFormModal — edit mode pre-fill (FORM-07)', () => {
  it('pre-fills type, description, value, category, and attachment from the existing transaction', () => {
    const store = makeTestStore()
    const transaction = existingTransaction()
    setCategoryForTransaction(transaction.id, 'lazer')

    renderModal(store, { isOpen: true, onClose: vi.fn(), accountId: 'acc-1', transaction })

    expect((document.body.querySelector('#transaction-type') as HTMLSelectElement).value).toBe('Debit')
    expect((document.body.querySelector('#transaction-description') as HTMLInputElement).value).toBe(
      'Mercado da esquina'
    )
    expect((document.body.querySelector('#transaction-value') as HTMLInputElement).value).toBe('45')
    expect((document.body.querySelector('#transaction-category') as HTMLSelectElement).value).toBe('lazer')
    expect(document.body.textContent).toContain('nota-fiscal.pdf')
    expect(document.body.textContent).toContain('Editar transação')
  })

  it('falls back to "outros" when the transaction has no entry in the local category index', () => {
    const store = makeTestStore()
    const transaction = existingTransaction({ id: 't-uncategorized' })

    renderModal(store, { isOpen: true, onClose: vi.fn(), accountId: 'acc-1', transaction })

    expect((document.body.querySelector('#transaction-category') as HTMLSelectElement).value).toBe('outros')
  })
})

describe('TransactionFormModal — edit mode save (API-03)', () => {
  it('calls updateTransaction (PUT), not createTransaction (POST), when saving an existing transaction', async () => {
    const store = makeTestStore()
    const transaction = existingTransaction()
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { ...transaction, value: 45 }))

    renderModal(store, { isOpen: true, onClose: vi.fn(), accountId: 'acc-1', transaction })

    await act(async () => {
      submitForm(document.body)
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    const request = vi.mocked(fetch).mock.calls[0][0] as Request
    expect(request.method).toBe('PUT')
    expect(request.url).toBe(`http://localhost/api/transactions/${transaction.id}`)
  })
})
