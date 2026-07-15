// Types aligned with the real API contract (tech-challenge-2).
// See .specs/features/fase-02/design.md ("Data Models") for the source of truth.

export type TransactionAPIType = 'Debit' | 'Credit'

export interface Transaction {
  id: string
  accountId: string
  type: TransactionAPIType
  value: number
  from?: string
  to?: string
  anexo?: string
  urlAnexo?: string
  date: string
}

export type CategoryId =
  | 'alimentacao'
  | 'transporte'
  | 'moradia'
  | 'lazer'
  | 'saude'
  | 'salario'
  | 'outros'

export interface Category {
  id: CategoryId
  label: string
  keywords: string[]
}

export interface Account {
  id: string
  type: string
  userId: string
}

export interface User {
  id: string
  username: string
  email: string
}
