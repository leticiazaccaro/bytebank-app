'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTransactions } from '@/contexts/TransactionsContext'
import { BalanceCard } from '@/components/features/BalanceCard/BalanceCard'
import { TransactionModal } from '@/components/features/TransactionModal/TransactionModal'
import { Badge } from '@/components/ui/Badge/Badge'
import { Card } from '@/components/ui/Card/Card'
import { FAB } from '@/components/ui/FAB/FAB'
import { Transaction } from '@/types/transaction'
import { formatCurrency, formatDate } from '@/lib/formatters'

export default function HomePage() {
  const { transactions, balance, addTransaction } = useTransactions()
  const [modalOpen, setModalOpen] = useState(false)

  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  function handleAdd(data: Omit<Transaction, 'id'>) {
    addTransaction(data)
    setModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-800">Bem-vindo ao ByteBank</h1>
        <p className="text-neutral-500 text-sm mt-1">Gerencie suas finanças com facilidade</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BalanceCard
          balance={balance}
          transactionCount={transactions.length}
          className="md:col-span-2"
        />

        <Card className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-neutral-600">Resumo rápido</p>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Entradas</span>
            <span className="font-semibold text-success">
              {formatCurrency(
                transactions
                  .filter((t) => t.type === 'deposit')
                  .reduce((a, t) => a + t.value, 0)
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Saídas</span>
            <span className="font-semibold text-danger">
              {formatCurrency(
                transactions
                  .filter((t) => t.type !== 'deposit')
                  .reduce((a, t) => a + t.value, 0)
              )}
            </span>
          </div>
          <div className="border-t border-neutral-100 pt-2 flex justify-between text-sm">
            <span className="font-medium text-neutral-700">Total de transações</span>
            <span className="font-bold text-neutral-800">{transactions.length}</span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-neutral-800">Últimas transações</h2>
          <Link
            href="/transactions"
            className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Ver todas →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-sm">
            Nenhuma transação ainda. Adicione a primeira!
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={[
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                      t.type === 'deposit' ? 'bg-success-light' : 'bg-danger-light',
                    ].join(' ')}
                  >
                    {t.type === 'deposit' ? (
                      <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V4m0 0l-4 4m4-4l4 4" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-700 truncate">
                      {t.description || '—'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge type={t.type} />
                      <p className="text-xs text-neutral-400">{formatDate(t.date)}</p>
                    </div>
                  </div>
                </div>
                <span
                  className={[
                    'text-sm font-semibold shrink-0',
                    t.type === 'deposit' ? 'text-success' : 'text-danger',
                  ].join(' ')}
                >
                  {t.type === 'deposit' ? '+' : '-'} {formatCurrency(t.value)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
      />

      <FAB onClick={() => setModalOpen(true)} />
    </div>
  )
}
