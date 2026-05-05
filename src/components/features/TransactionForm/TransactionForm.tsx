'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input/Input'
import { Select } from '@/components/ui/Select/Select'
import { Button } from '@/components/ui/Button/Button'
import { Transaction, TransactionType, TRANSACTION_TYPE_LABELS } from '@/types/transaction'
import { useTransactions } from '@/contexts/TransactionsContext'

const typeOptions = (Object.keys(TRANSACTION_TYPE_LABELS) as TransactionType[]).map((key) => ({
  value: key,
  label: TRANSACTION_TYPE_LABELS[key],
}))

function maskBRL(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''
  return (parseInt(digits, 10) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function parseBRL(formatted: string): number {
  return parseFloat(formatted.replace(/\./g, '').replace(',', '.'))
}

interface FormData {
  type: TransactionType | ''
  value: string
  date: string
  description: string
}

interface FormErrors {
  type?: string
  value?: string
  date?: string
}

interface TransactionFormProps {
  initialData?: Transaction
  onSubmit: (data: Omit<Transaction, 'id'>) => void
  onCancel: () => void
}

function IconTag() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2z" />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconBanknote() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconPen() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}

export function TransactionForm({ initialData, onSubmit, onCancel }: TransactionFormProps) {
  const { balance } = useTransactions()

  const [form, setForm] = useState<FormData>({
    type: initialData?.type ?? '',
    value: initialData
      ? initialData.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '',
    date: initialData?.date ?? new Date().toISOString().split('T')[0],
    description: initialData?.description ?? '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!form.type) newErrors.type = 'Selecione o tipo de transação'

    const parsedValue = parseBRL(form.value)
    if (!form.value || parsedValue <= 0) {
      newErrors.value = 'Informe um valor válido'
    } else if (form.type && form.type !== 'deposit') {
      const available =
        initialData && initialData.type !== 'deposit'
          ? balance + initialData.value
          : balance
      if (parsedValue > available) {
        newErrors.value = 'Saldo insuficiente para esta transação'
      }
    }

    if (!form.date) newErrors.date = 'Informe a data'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      type: form.type as TransactionType,
      value: parseBRL(form.value),
      date: form.date,
      description: form.description.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Select
        label="Tipo de transação"
        options={typeOptions}
        placeholder="Selecione..."
        value={form.type}
        error={errors.type}
        icon={<IconTag />}
        onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TransactionType }))}
      />

      <Input
        label="Valor (R$)"
        type="text"
        inputMode="numeric"
        placeholder="0,00"
        value={form.value}
        error={errors.value}
        icon={<IconBanknote />}
        onChange={(e) => setForm((f) => ({ ...f, value: maskBRL(e.target.value) }))}
      />

      <Input
        label="Data"
        type="date"
        value={form.date}
        error={errors.date}
        icon={<IconCalendar />}
        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
      />

      <Input
        label="Descrição (opcional)"
        type="text"
        placeholder="Ex: Pagamento de conta"
        value={form.description}
        icon={<IconPen />}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      />

      <div className="flex gap-2 pt-2 justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Salvar alterações' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}
