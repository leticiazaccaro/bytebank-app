'use client'

import { useState, type FormEvent } from 'react'
import { Modal } from '@repo/ui/Modal/Modal'
import { Input } from '@repo/ui/Input/Input'
import { Select } from '@repo/ui/Select/Select'
import { Button } from '@repo/ui/Button/Button'
import type { CreateTransactionInput } from '@repo/shared/apiClient'
import { CATEGORIES, suggestCategory } from '@repo/shared/categories'
import { getCategoryIndex, setCategoryForTransaction } from '@repo/shared/categoryIndex'
import type { CategoryId, Transaction } from '@repo/shared/types'
import { useCreateTransactionMutation, useUpdateTransactionMutation } from '@/store/transactionsApi'
import { AttachmentField, type AttachmentPayload } from './AttachmentField'
import { transactionFormSchema, type TransactionFormInput } from './schema'

// Visual base: src/components/features/TransactionForm/TransactionForm.tsx,
// TransactionModal.tsx (Fase 01) — adapted to the real API's shape
// (design.md "apps/mf-transactions"): a single free-text `description`
// field maps to `from` (Credit — who the money came from) or `to` (Debit —
// who it went to), since the API models a transaction as `from`/`to`, not a
// `description` string.
//
// FORM-07: when `transaction` is provided, the form opens in edit mode,
// pre-filled from it (plus its category from the local index and its
// attachment, if any), and saving calls `updateTransaction` instead of
// `createTransaction` (API-03).
interface TransactionFormModalProps {
  isOpen: boolean
  onClose: () => void
  accountId: string
  transaction?: Transaction
}

const TYPE_OPTIONS = [
  { value: 'Credit', label: 'Crédito' },
  { value: 'Debit', label: 'Débito' },
]

const CATEGORY_OPTIONS = CATEGORIES.map((category) => ({ value: category.id, label: category.label }))

function initialType(transaction?: Transaction): 'Debit' | 'Credit' | '' {
  return transaction?.type ?? ''
}

function initialDescription(transaction?: Transaction): string {
  return transaction ? (transaction.from ?? transaction.to ?? '') : ''
}

function initialValue(transaction?: Transaction): string {
  return transaction ? String(transaction.value) : ''
}

function initialCategoryId(transaction?: Transaction): CategoryId {
  if (!transaction) return suggestCategory('')
  return getCategoryIndex()[transaction.id] ?? 'outros'
}

function initialAttachment(transaction?: Transaction): AttachmentPayload | undefined {
  if (transaction?.anexo && transaction?.urlAnexo) {
    return { anexo: transaction.anexo, urlAnexo: transaction.urlAnexo }
  }
  return undefined
}

function buildTransactionInput(
  data: TransactionFormInput,
  accountId: string,
  attachment: AttachmentPayload | undefined
): CreateTransactionInput {
  return {
    accountId,
    type: data.type,
    value: data.value,
    ...(data.type === 'Credit' ? { from: data.description } : { to: data.description }),
    ...(attachment ? { anexo: attachment.anexo, urlAnexo: attachment.urlAnexo } : {}),
  }
}

export function TransactionFormModal({ isOpen, onClose, accountId, transaction }: TransactionFormModalProps) {
  const [type, setType] = useState<'Debit' | 'Credit' | ''>(() => initialType(transaction))
  const [description, setDescription] = useState(() => initialDescription(transaction))
  const [value, setValue] = useState(() => initialValue(transaction))
  const [categoryId, setCategoryId] = useState<CategoryId>(() => initialCategoryId(transaction))
  // FORM-03: the suggestion is "aceitável/editável (não bloqueante)" — once
  // the user picks a category directly (or the form opened already
  // pre-filled from an existing transaction), further description edits
  // stop overriding it.
  const [categoryTouched, setCategoryTouched] = useState(() => Boolean(transaction))
  const [attachment, setAttachment] = useState<AttachmentPayload | undefined>(() =>
    initialAttachment(transaction)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [createTransaction, { isLoading: isCreating }] = useCreateTransactionMutation()
  const [updateTransaction, { isLoading: isUpdating }] = useUpdateTransactionMutation()
  const isEditMode = Boolean(transaction)

  function handleDescriptionChange(next: string) {
    setDescription(next)
    if (!categoryTouched) setCategoryId(suggestCategory(next))
  }

  function resetForm() {
    setType('')
    setDescription('')
    setValue('')
    setCategoryId(suggestCategory(''))
    setCategoryTouched(false)
    setAttachment(undefined)
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
    const payload = buildTransactionInput(result.data, accountId, attachment)

    try {
      if (transaction) {
        await updateTransaction({ id: transaction.id, patch: payload }).unwrap()
        // FORM-04: persist the chosen (kept or overridden) category.
        setCategoryForTransaction(transaction.id, categoryId)
      } else {
        const created = await createTransaction(payload).unwrap()
        setCategoryForTransaction(created.id, categoryId)
      }
      resetForm()
      onClose()
    } catch {
      // 401/network-error handling is wired globally in a later task (T43) —
      // this task's scope is the local validation + happy-path submit flow.
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Editar transação' : 'Nova transação'}>
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
          onChange={(event) => handleDescriptionChange(event.target.value)}
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

        <Select
          id="transaction-category"
          label="Categoria"
          options={CATEGORY_OPTIONS}
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value as CategoryId)
            setCategoryTouched(true)
          }}
        />

        <AttachmentField value={attachment} onChange={setAttachment} />

        <div className="flex gap-2 pt-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isEditMode ? 'Salvar alterações' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
