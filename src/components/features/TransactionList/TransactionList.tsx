'use client'

import { useState } from 'react'
import { Table, TableColumn } from '@/components/ui/Table/Table'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { Transaction, TransactionType } from '@/types/transaction'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

const FILTER_OPTIONS = [
  {
    value: 'all' as const,
    label: 'Todos',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
  {
    value: 'deposit' as TransactionType,
    label: 'Depósito',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
      </svg>
    ),
  },
  {
    value: 'withdrawal' as TransactionType,
    label: 'Saque',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V4m0 0l-4 4m4-4l4 4" />
      </svg>
    ),
  },
  {
    value: 'transfer' as TransactionType,
    label: 'Transferência',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    value: 'pix' as TransactionType,
    label: 'PIX',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
]

const TYPE_BG: Record<TransactionType, string> = {
  deposit: 'bg-success-light',
  withdrawal: 'bg-danger-light',
  transfer: 'bg-secondary-light',
  pix: 'bg-warning-light',
}

const TYPE_ICON_COLOR: Record<TransactionType, string> = {
  deposit: 'text-success',
  withdrawal: 'text-danger',
  transfer: 'text-secondary',
  pix: 'text-warning',
}

function TypeIconCircle({ type }: { type: TransactionType }) {
  const icon = FILTER_OPTIONS.find((o) => o.value === type)?.icon
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${TYPE_BG[type]} ${TYPE_ICON_COLOR[type]}`}>
      {icon}
    </div>
  )
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  const [filter, setFilter] = useState<TransactionType | 'all'>('all')

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter((t) => t.type === filter)

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date))

  const columns: TableColumn<Transaction>[] = [
    {
      key: 'date',
      header: 'Data',
      render: (t) => <span className="text-neutral-500 whitespace-nowrap">{formatDate(t.date)}</span>,
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (t) => <Badge type={t.type} />,
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (t) => <span className="text-neutral-700">{t.description || '—'}</span>,
    },
    {
      key: 'value',
      header: 'Valor',
      align: 'right',
      render: (t) => (
        <span className={t.type === 'deposit' ? 'font-semibold text-success' : 'font-semibold text-danger'}>
          {t.type === 'deposit' ? '+' : '–'} {formatCurrency(t.value)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'center',
      render: (t) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onEdit(t)}
            title="Editar"
            aria-label="Editar transação"
            className="p-1.5 rounded-md text-neutral-400 hover:text-secondary hover:bg-secondary-light transition-colors cursor-pointer"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => onDelete(t)}
            title="Excluir"
            aria-label="Excluir transação"
            className="p-1.5 rounded-md text-neutral-400 hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
          >
            <TrashIcon />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Filter pills — scrollable on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              'transition-colors cursor-pointer whitespace-nowrap shrink-0',
              filter === opt.value
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
            ].join(' ')}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden">
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">
            Nenhuma transação encontrada para o filtro selecionado.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {sorted.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <TypeIconCircle type={t.type} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">
                    {t.description || '—'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge type={t.type} />
                    <span className="text-xs text-neutral-400">{formatDate(t.date)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={[
                    'text-sm font-semibold',
                    t.type === 'deposit' ? 'text-success' : 'text-danger',
                  ].join(' ')}>
                    {t.type === 'deposit' ? '+' : '–'} {formatCurrency(t.value)}
                  </span>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => onEdit(t)}
                      aria-label="Editar"
                      className="p-1.5 rounded-md text-neutral-400 hover:text-secondary hover:bg-secondary-light transition-colors cursor-pointer"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => onDelete(t)}
                      aria-label="Excluir"
                      className="p-1.5 rounded-md text-neutral-400 hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <Table
          columns={columns}
          data={sorted}
          emptyMessage="Nenhuma transação encontrada para o filtro selecionado."
        />
      </div>
    </div>
  )
}
