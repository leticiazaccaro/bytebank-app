'use client'

import { useState } from 'react'
import { Table, TableColumn } from '@repo/ui/Table/Table'
import { formatBRL, formatDate } from '@repo/shared/formatters'
import type { Transaction } from '@repo/shared/types'
import { filterByType, type TypeFilter } from './filterByType'

// Visual base: src/components/features/TransactionList/TransactionList.tsx
// (Fase 01) — adapted to the real API's shape (design.md "apps/mf-transactions"):
// `description` -> `from`/`to`, `type` deposit/withdrawal/transfer/pix ->
// Debit/Credit. packages/ui's Badge only knows the Fase 01 type union, so
// type is rendered with a small inline style here instead of reusing it.
interface TransactionListClientProps {
  initialData: Transaction[]
}

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'Credit', label: 'Crédito' },
  { value: 'Debit', label: 'Débito' },
]

export function TransactionListClient({ initialData }: TransactionListClientProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const filtered = filterByType(initialData, typeFilter)

  const columns: TableColumn<Transaction>[] = [
    {
      key: 'date',
      header: 'Data',
      render: (transaction) => (
        <span className="text-neutral-500 whitespace-nowrap">{formatDate(transaction.date)}</span>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (transaction) => (
        <span
          className={transaction.type === 'Credit' ? 'text-success font-medium' : 'text-danger font-medium'}
        >
          {transaction.type === 'Credit' ? 'Crédito' : 'Débito'}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (transaction) => (
        <span className="text-neutral-700">{transaction.from ?? transaction.to ?? '—'}</span>
      ),
    },
    {
      key: 'value',
      header: 'Valor',
      align: 'right',
      render: (transaction) => (
        <span
          className={
            transaction.type === 'Credit' ? 'font-semibold text-success' : 'font-semibold text-danger'
          }
        >
          {transaction.type === 'Credit' ? '+' : '–'} {formatBRL(transaction.value)}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2" role="group" aria-label="Filtrar por tipo">
        {TYPE_FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTypeFilter(option.value)}
            aria-pressed={typeFilter === option.value}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer',
              typeFilter === option.value
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={filtered}
        emptyMessage="Nenhuma transação encontrada para o filtro selecionado."
      />
    </div>
  )
}
