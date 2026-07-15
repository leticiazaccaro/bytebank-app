'use client'

import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Table, TableColumn } from '@repo/ui/Table/Table'
import { Select } from '@repo/ui/Select/Select'
import { Input } from '@repo/ui/Input/Input'
import { FAB } from '@repo/ui/FAB/FAB'
import { LiveRegion } from '@repo/ui/LiveRegion/LiveRegion'
import { formatBRL, formatDate } from '@repo/shared/formatters'
import { CATEGORIES } from '@repo/shared/categories'
import { getCategoryIndex, type CategoryIndex } from '@repo/shared/categoryIndex'
import type { Transaction } from '@repo/shared/types'
import { type TypeFilter } from './filterByType'
import { type CategoryFilter } from './filterByCategory'
import { type DateRange } from './filterByDateRange'
import { applyFilters } from './applyFilters'
import { useDebouncedValue } from './useDebouncedValue'
import { nextVisibleCount } from './nextVisibleCount'
import { TransactionFormModal } from './TransactionFormModal/TransactionFormModal'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import type { RootState } from '@/store/store'

// TXN-06: initial page size for the infinite-scroll window over the
// already-fully-loaded dataset.
const PAGE_SIZE = 20

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

  // T58: 'new' opens TransactionFormModal in create mode, a Transaction opens
  // it in edit mode pre-filled from that row, null keeps it unmounted. Kept
  // unmounted (not always-mounted-but-closed) when idle — TransactionFormModal
  // calls RTK Query mutation hooks unconditionally, which need a Provider in
  // the tree, and this component has callers/tests that render it without one.
  const [formTarget, setFormTarget] = useState<Transaction | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  // A11Y-03/API-05: surfaces the error middleware's message (T43) — set by
  // any failed query/mutation across this zone's store, not just ones
  // triggered from this component — to an assertive live region.
  const errorMessage = useSelector((state: RootState) => state.uiError.message)
  // Every transaction in this zone belongs to the same account (the API has
  // no multi-account concept here — see apiClient.ts's fetchStatement, which
  // always resolves accounts[0]); reused as the account a newly created
  // transaction is filed under.
  const accountId = initialData[0]?.accountId ?? ''

  // TXN-05: applyFilters combines every active filter with AND.
  const filtered = applyFilters(initialData, categoryIndex, {
    type: typeFilter,
    category: categoryFilter,
    dateRange,
    search: debouncedSearch,
  })

  // TXN-06: infinite scroll over `filtered` — no re-fetch, the API already
  // returned the complete list (design.md). Resetting `visibleCount` when
  // the active filters change is done during render (React's documented
  // "adjusting state when a prop changes" pattern), not in an effect, so it
  // doesn't trigger a synchronous setState-in-effect cascade.
  const filterKey = `${typeFilter}|${categoryFilter}|${dateRange.from}|${dateRange.to}|${debouncedSearch}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setVisibleCount(PAGE_SIZE)
  }

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasMore) return
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount((count) => nextVisibleCount(count, filtered.length, PAGE_SIZE))
      }
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, filtered.length])

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
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (transaction) => {
        const label = transaction.from ?? transaction.to ?? 'transação'
        return (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormTarget(transaction)}
              aria-label={`Editar transação de ${label}`}
              className="text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(transaction)}
              aria-label={`Excluir transação de ${label}`}
              className="text-xs font-medium text-danger hover:underline cursor-pointer"
            >
              Excluir
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <LiveRegion message={errorMessage} politeness="assertive" />
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
        <>
          <Table columns={columns} data={visible} />
          {/* TXN-06: sentinel observed by IntersectionObserver — reaching it
              reveals the next page over the already-loaded dataset, no
              re-fetch. Only rendered while there's more to reveal. */}
          {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-1" />}
        </>
      )}

      {/* FORM-01: always reachable, regardless of active filters/search —
          the empty state above only covers "no results for the current
          filters", not "no way to add a transaction". */}
      <FAB onClick={() => setFormTarget('new')} />

      {formTarget !== null && (
        <TransactionFormModal
          isOpen
          onClose={() => setFormTarget(null)}
          accountId={accountId}
          transaction={formTarget === 'new' ? undefined : formTarget}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmationModal
          isOpen
          onClose={() => setDeleteTarget(null)}
          transactionId={deleteTarget.id}
        />
      )}
    </div>
  )
}
