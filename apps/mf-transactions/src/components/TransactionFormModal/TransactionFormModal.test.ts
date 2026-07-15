// @vitest-environment jsdom
//
// Real DOM mount (createRoot + act), same pattern as
// TransactionListClient.infiniteScroll.test.ts — this component needs real
// event dispatch (input/change/submit) and a live Redux store, which
// renderToStaticMarkup can't exercise.
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { transactionsApi } from '@/store/transactionsApi'
import { TransactionFormModal } from './TransactionFormModal'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Same rationale as store/transactionsApi.test.ts: fetchBaseQuery always
// builds a real `Request` from the relative `/api/transactions` baseUrl,
// which needs a base origin to resolve under Node/jsdom (unlike a browser).
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

function clickSubmit(root: HTMLElement) {
  const form = root.querySelector('form')
  if (!form) throw new Error('form not found')
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

let container: HTMLDivElement
let root: Root

// `children` is a required prop on react-redux's ProviderProps — passing it
// as a createElement rest-arg (rather than inline in the props object)
// doesn't satisfy that type outside JSX, so it's built directly here.
function renderModal(
  store: ReturnType<typeof makeTestStore>,
  props: { isOpen: boolean; onClose: () => void; accountId: string }
) {
  act(() => {
    root.render(
      createElement(Provider, { store, children: createElement(TransactionFormModal, props) })
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

describe('TransactionFormModal (create mode)', () => {
  it('blocks submit and shows a field error for each missing required field (FORM-01)', () => {
    const store = makeTestStore()
    const onClose = vi.fn()

    renderModal(store, { isOpen: true, onClose, accountId: 'acc-1' })

    act(() => {
      clickSubmit(document.body)
    })

    expect(document.body.textContent).toContain('Selecione o tipo de transação.')
    expect(document.body.textContent).toContain('Informe a descrição.')
    expect(document.body.textContent).toContain('Informe o valor.')
    expect(fetch).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('blocks submit and shows a field error for a non-numeric value (FORM-02)', () => {
    const store = makeTestStore()
    const onClose = vi.fn()

    renderModal(store, { isOpen: true, onClose, accountId: 'acc-1' })

    setSelectValue(document.body.querySelector('#transaction-type') as HTMLSelectElement, 'Debit')
    setInputValue(document.body.querySelector('#transaction-description') as HTMLInputElement, 'Mercado')
    setInputValue(document.body.querySelector('#transaction-value') as HTMLInputElement, 'abc')

    act(() => {
      clickSubmit(document.body)
    })

    expect(document.body.textContent).toContain('Informe um valor numérico válido.')
    expect(fetch).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('submits a valid transaction, calling the create mutation and closing the modal (API-02)', async () => {
    const store = makeTestStore()
    const onClose = vi.fn()
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, {
        id: 't1',
        accountId: 'acc-1',
        type: 'Credit',
        value: 150.5,
        from: 'Uber para o trabalho',
        date: '2026-07-15',
      })
    )

    renderModal(store, { isOpen: true, onClose, accountId: 'acc-1' })

    setSelectValue(document.body.querySelector('#transaction-type') as HTMLSelectElement, 'Credit')
    setInputValue(
      document.body.querySelector('#transaction-description') as HTMLInputElement,
      'Uber para o trabalho'
    )
    setInputValue(document.body.querySelector('#transaction-value') as HTMLInputElement, '150,50')

    await act(async () => {
      clickSubmit(document.body)
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    const request = vi.mocked(fetch).mock.calls[0][0] as Request
    expect(request.method).toBe('POST')
    expect(request.url).toBe('http://localhost/api/transactions')
    const body = await request.clone().json()
    expect(body).toEqual({
      accountId: 'acc-1',
      type: 'Credit',
      value: 150.5,
      from: 'Uber para o trabalho',
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
