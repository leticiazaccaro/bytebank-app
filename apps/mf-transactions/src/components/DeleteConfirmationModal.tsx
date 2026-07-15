'use client'

import { Modal } from '@repo/ui/Modal/Modal'
import { Button } from '@repo/ui/Button/Button'
import { useDeleteTransactionMutation } from '@/store/transactionsApi'

// Visual base: src/components/features/TransactionModal/TransactionModal.tsx
// ("DeleteConfirmModal", Fase 01) — extended to own the real delete request
// (API-04) instead of delegating to a parent callback.
interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  transactionId: string
}

export function DeleteConfirmationModal({ isOpen, onClose, transactionId }: DeleteConfirmationModalProps) {
  const [deleteTransaction, { isLoading }] = useDeleteTransactionMutation()

  async function handleConfirm() {
    try {
      // API-04: deleting invalidates the transaction's own tag and LIST
      // (transactionsApi.ts), which removes it from any subscribed list.
      await deleteTransaction(transactionId).unwrap()
      onClose()
    } catch {
      // 401/network-error handling is wired globally in a later task (T43) —
      // this task's scope is the confirm/cancel + happy-path delete flow.
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir transação" size="sm">
      <p className="text-sm text-neutral-600">
        Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
      </p>
      <div className="flex gap-2 mt-5 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant="danger" size="sm" onClick={handleConfirm} disabled={isLoading}>
          Excluir
        </Button>
      </div>
    </Modal>
  )
}
