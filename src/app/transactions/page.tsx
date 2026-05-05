'use client'

import { useState } from 'react'
import { useTransactions } from '@/contexts/TransactionsContext'
import { TransactionList } from '@/components/features/TransactionList/TransactionList'
import { TransactionModal, DeleteConfirmModal } from '@/components/features/TransactionModal/TransactionModal'
import { FAB } from '@/components/ui/FAB/FAB'
import { Transaction } from '@/types/transaction'

export default function TransactionsPage() {
  const { transactions, addTransaction, editTransaction, deleteTransaction } = useTransactions()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>()
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | undefined>()

  function handleSubmit(data: Omit<Transaction, 'id'>) {
    if (editingTransaction) {
      editTransaction({ ...data, id: editingTransaction.id })
    } else {
      addTransaction(data)
    }
    setEditingTransaction(undefined)
    setAddModalOpen(false)
  }

  function handleDelete() {
    if (deletingTransaction) {
      deleteTransaction(deletingTransaction.id)
      setDeletingTransaction(undefined)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-800">Transações</h1>
        <p className="text-neutral-500 text-sm mt-1">
          {transactions.length} transaç{transactions.length > 1 ? 'ões' : 'ão'} registrada{transactions.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4 sm:p-5">
        <TransactionList
          transactions={transactions}
          onEdit={(t) => setEditingTransaction(t)}
          onDelete={(t) => setDeletingTransaction(t)}
        />
      </div>

      <TransactionModal
        isOpen={addModalOpen || !!editingTransaction}
        onClose={() => {
          setAddModalOpen(false)
          setEditingTransaction(undefined)
        }}
        editingTransaction={editingTransaction}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmModal
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(undefined)}
        onConfirm={handleDelete}
      />

      <FAB onClick={() => setAddModalOpen(true)} />
    </div>
  )
}
