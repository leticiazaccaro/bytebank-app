'use client'

import { useState, type FormEvent } from 'react'
import { Modal } from '@repo/ui/Modal/Modal'
import { Input } from '@repo/ui/Input/Input'
import { Select } from '@repo/ui/Select/Select'
import { Button } from '@repo/ui/Button/Button'
import type { CreateTransactionInput } from '@repo/shared/apiClient'
import { CATEGORIES, suggestCategory } from '@repo/shared/categories'
import { setCategoryForTransaction } from '@repo/shared/categoryIndex'
import type { CategoryId } from '@repo/shared/types'
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

const CATEGORY_OPTIONS = CATEGORIES.map((category) => ({ value: category.id, label: category.label }))

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
  const [categoryId, setCategoryId] = useState<CategoryId>(suggestCategory(''))
  // FORM-03: the suggestion is "aceitável/editável (não bloqueante)" — once
  // the user picks a category directly, further description edits stop
  // overriding their choice.
  const [categoryTouched, setCategoryTouched] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [createTransaction, { isLoading }] = useCreateTransactionMutation()

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
      const created = await createTransaction(toCreateTransactionInput(result.data, accountId)).unwrap()
      // FORM-04: persist the chosen (suggested or overridden) category
      // against the newly created transaction's id in the local index.
      setCategoryForTransaction(created.id, categoryId)
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
