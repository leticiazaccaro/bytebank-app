'use client'

import { createContext, useContext, useEffect, useReducer } from 'react'
import { Transaction, TransactionType } from '@/types/transaction'
import { initialTransactions } from '@/data/transactions'

interface TransactionsState {
  transactions: Transaction[]
}

type TransactionsAction =
  | { type: 'ADD'; payload: Omit<Transaction, 'id'> }
  | { type: 'EDIT'; payload: Transaction }
  | { type: 'DELETE'; payload: string }
  | { type: 'LOAD'; payload: Transaction[] }

function reducer(state: TransactionsState, action: TransactionsAction): TransactionsState {
  switch (action.type) {
    case 'LOAD':
      return { transactions: action.payload }
    case 'ADD':
      return {
        transactions: [
          ...state.transactions,
          { ...action.payload, id: crypto.randomUUID() },
        ],
      }
    case 'EDIT':
      return {
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      }
    case 'DELETE':
      return {
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      }
    default:
      return state
  }
}

interface TransactionsContextValue {
  transactions: Transaction[]
  balance: number
  addTransaction: (data: Omit<Transaction, 'id'>) => void
  editTransaction: (transaction: Transaction) => void
  deleteTransaction: (id: string) => void
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null)

const STORAGE_KEY = 'bytebank_transactions'

const CREDIT_TYPES: TransactionType[] = ['deposit']

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { transactions: [] })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const loaded = stored ? (JSON.parse(stored) as Transaction[]) : initialTransactions
      dispatch({ type: 'LOAD', payload: loaded })
    } catch {
      dispatch({ type: 'LOAD', payload: initialTransactions })
    }
  }, [])

  useEffect(() => {
    if (state.transactions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions))
    }
  }, [state.transactions])

  const balance = state.transactions.reduce((acc, t) => {
    return CREDIT_TYPES.includes(t.type) ? acc + t.value : acc - t.value
  }, 0)

  return (
    <TransactionsContext.Provider
      value={{
        transactions: state.transactions,
        balance,
        addTransaction: (data) => dispatch({ type: 'ADD', payload: data }),
        editTransaction: (t) => dispatch({ type: 'EDIT', payload: t }),
        deleteTransaction: (id) => dispatch({ type: 'DELETE', payload: id }),
      }}
    >
      {children}
    </TransactionsContext.Provider>
  )
}

export function useTransactions(): TransactionsContextValue {
  const ctx = useContext(TransactionsContext)
  if (!ctx) throw new Error('useTransactions must be used inside TransactionsProvider')
  return ctx
}
