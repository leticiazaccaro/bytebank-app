'use client'

import { useState, type FormEvent } from 'react'
import { Modal } from '@repo/ui/Modal/Modal'
import { Input } from '@repo/ui/Input/Input'
import { Select } from '@repo/ui/Select/Select'
import { Button } from '@repo/ui/Button/Button'
import type { CreateTransactionInput } from '@repo/shared/apiClient'
import { useCreateTransactionMutation } from '@/store/transactionsApi'
import { transactionFormSchema, type TransactionFormInput } from './schema'

// Visual base: src/components/features/TransactionForm/TransactionForm.tsx,
// TransactionModal.tsx (Fase 01) — adapted to the real API's shape
// (design.md "apps/mf-transactions"): a single free-text `description`
// field maps to `from` (Credit — who the money came from) or `to` (Debit —
// who it went to), since the API models a transaction as `from`/`to`, not a
// `description` string.
interface TransactionFormModalProps {
  isOpen: boolean
  onClose: () => void
  accountId: string
}

const TYPE_OPTIONS = [
  { value: 'Credit', label: 'Crédito' },
  { value: 'Debit', label: 'Débito' },
]

function toCreateTransactionInput(data: TransactionFormInput, accountId: string): CreateTransactionInput {
  return {
    accountId,
    type: data.type,
    value: data.value,
    ...(data.type === 'Credit' ? { from: data.description } : { to: data.description }),
  }
}

export function TransactionFormModal({ isOpen, onClose, accountId }: TransactionFormModalProps) {
  const [type, setType] = useState<'Debit' | 'Credit' | ''>('')
  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [createTransaction, { isLoading }] = useCreateTransactionMutation()

  function resetForm() {
    setType('')
    setDescription('')
    setValue('')
    setErrors({})
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    // FORM-01/FORM-02: block submission and surface a per-field error
    // message instead of calling the mutation.
    const result = transactionFormSchema.safeParse({ type, description, value })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = String(issue.path[0])
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    try {
      await createTransaction(toCreateTransactionInput(result.data, accountId)).unwrap()
      resetForm()
      onClose()
    } catch {
      // 401/network-error handling is wired globally in a later task (T43) —
      // this task's scope is the local validation + happy-path submit flow.
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova transação">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Select
          id="transaction-type"
          label="Tipo de transação"
          options={TYPE_OPTIONS}
          placeholder="Selecione..."
          value={type}
          error={errors.type}
          onChange={(event) => setType(event.target.value as 'Debit' | 'Credit')}
        />

        <Input
          id="transaction-description"
          label="Descrição"
          type="text"
          placeholder="Ex: Uber para o trabalho"
          value={description}
          error={errors.description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <Input
          id="transaction-value"
          label="Valor (R$)"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={value}
          error={errors.value}
          onChange={(event) => setValue(event.target.value)}
        />

        <div className="flex gap-2 pt-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            Adicionar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
