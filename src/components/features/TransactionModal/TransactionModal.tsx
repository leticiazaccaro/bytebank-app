'use client'

import { Modal } from '@/components/ui/Modal/Modal'
import { Button } from '@/components/ui/Button/Button'
import { TransactionForm } from '@/components/features/TransactionForm/TransactionForm'
import { Transaction } from '@/types/transaction'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  editingTransaction?: Transaction
  onSubmit: (data: Omit<Transaction, 'id'>) => void
}

export function TransactionModal({
  isOpen,
  onClose,
  editingTransaction,
  onSubmit,
}: TransactionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTransaction ? 'Editar transação' : 'Nova transação'}
    >
      <TransactionForm
        initialData={editingTransaction}
        onSubmit={(data) => {
          onSubmit(data)
          onClose()
        }}
        onCancel={onClose}
      />
    </Modal>
  )
}

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm }: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir transação" size="sm">
      <p className="text-sm text-neutral-600">
        Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
      </p>
      <div className="flex gap-2 mt-5 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm}>
          Excluir
        </Button>
      </div>
    </Modal>
  )
}
