export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'pix'

export interface Transaction {
  id: string
  type: TransactionType
  value: number
  date: string
  description: string
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  deposit: 'Depósito',
  withdrawal: 'Saque',
  transfer: 'Transferência',
  pix: 'PIX',
}
