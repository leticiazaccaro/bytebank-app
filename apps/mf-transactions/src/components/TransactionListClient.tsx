'use client'

import { useState } from 'react'
import { Table, TableColumn } from '@repo/ui/Table/Table'
import { Select } from '@repo/ui/Select/Select'
import { Input } from '@repo/ui/Input/Input'
import { formatBRL, formatDate } from '@repo/shared/formatters'
import { CATEGORIES } from '@repo/shared/categories'
import { getCategoryIndex, type CategoryIndex } from '@repo/shared/categoryIndex'
import type { Transaction } from '@repo/shared/types'
import { type TypeFilter } from './filterByType'
import { type CategoryFilter } from './filterByCategory'
import { type DateRange } from './filterByDateRange'
import { applyFilters } from './applyFilters'
import { useDebouncedValue } from './useDebouncedValue'

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

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todas as categorias' },
  ...CATEGORIES.map((category) => ({ value: category.id, label: category.label })),
]

export function TransactionListClient({ initialData }: TransactionListClientProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' })
  const [searchInput, setSearchInput] = useState('')
  // TXN-04: 300ms debounce before the search term feeds into filtering.
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  // localStorage isn't available during SSR — the lazy initializer only
  // reads it on the client (typeof window guard), same constraint as any
  // localStorage-backed state in an app-router Client Component. Safe from
  // hydration mismatch: categoryFilter always starts at 'all', and
  // filterByCategory returns the input unchanged for 'all' regardless of
  // categoryIndex content, so the initial render is identical either way.
  const [categoryIndex] = useState<CategoryIndex>(() =>
    typeof window === 'undefined' ? {} : getCategoryIndex()
  )

  // TXN-05: applyFilters combines every active filter with AND.
  const filtered = applyFilters(initialData, categoryIndex, {
    type: typeFilter,
    category: categoryFilter,
    dateRange,
    search: debouncedSearch,
  })

  function clearFilters() {
    setTypeFilter('all')
    setCategoryFilter('all')
    setDateRange({ from: '', to: '' })
    setSearchInput('')
  }

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="w-full sm:w-56">
            <Select
              label="Categoria"
              options={CATEGORY_OPTIONS}
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
            />
          </div>

          <Input
            label="De"
            type="date"
            value={dateRange.from}
            onChange={(event) => setDateRange((range) => ({ ...range, from: event.target.value }))}
          />
          <Input
            label="Até"
            type="date"
            value={dateRange.to}
            onChange={(event) => setDateRange((range) => ({ ...range, to: event.target.value }))}
          />
        </div>
      </div>

      <Input
        label="Buscar"
        type="search"
        placeholder="Buscar por remetente ou destinatário"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
      />

      {/* TXN-07: dedicated empty state with a "clear filters" action —
          initialData is always non-empty here (page.tsx already handles the
          "no transactions at all" case), so an empty `filtered` list can
          only mean the active filters/search excluded everything. */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-neutral-600">Nenhuma transação encontrada para os filtros aplicados.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="text-primary font-medium underline cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <Table columns={columns} data={filtered} />
      )}
    </div>
  )
}
