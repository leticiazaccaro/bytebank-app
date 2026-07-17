import { describe, expect, it } from 'vitest'
import { transactionFormSchema } from './schema'

function fieldErrors(result: ReturnType<typeof transactionFormSchema.safeParse>): string[] {
  if (result.success) return []
  return result.error.issues.map((issue) => String(issue.path[0]))
}

describe('transactionFormSchema', () => {
  it('blocks submission when the type field is missing (FORM-01)', () => {
    const result = transactionFormSchema.safeParse({ type: undefined, description: 'Uber', value: 50 })

    expect(result.success).toBe(false)
    expect(fieldErrors(result)).toContain('type')
  })

  it('blocks submission when the description field is missing (FORM-01)', () => {
    const result = transactionFormSchema.safeParse({ type: 'Debit', description: '', value: 50 })

    expect(result.success).toBe(false)
    expect(fieldErrors(result)).toContain('description')
  })

  it('blocks submission when the value field is missing (FORM-01)', () => {
    const result = transactionFormSchema.safeParse({ type: 'Debit', description: 'Uber', value: '' })

    expect(result.success).toBe(false)
    expect(fieldErrors(result)).toContain('value')
  })

  it('blocks submission when the value is non-numeric (FORM-02)', () => {
    const result = transactionFormSchema.safeParse({ type: 'Debit', description: 'Uber', value: 'abc' })

    expect(result.success).toBe(false)
    expect(fieldErrors(result)).toContain('value')
  })

  it('blocks submission when the value is zero (FORM-02)', () => {
    const result = transactionFormSchema.safeParse({ type: 'Debit', description: 'Uber', value: 0 })

    expect(result.success).toBe(false)
    expect(fieldErrors(result)).toContain('value')
  })

  it('normalizes a negative value to its positive magnitude instead of blocking it (API-06)', () => {
    const result = transactionFormSchema.safeParse({
      type: 'Debit',
      description: 'Mercado',
      value: -75.3,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.value).toBe(75.3)
    }
  })

  it('strips thousands separators before parsing a masked value (FORM-08)', () => {
    const result = transactionFormSchema.safeParse({
      type: 'Credit',
      description: 'Salário',
      value: '12.345,67',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.value).toBe(12345.67)
    }
  })

  it('accepts a fully valid payload', () => {
    const result = transactionFormSchema.safeParse({
      type: 'Credit',
      description: 'Uber para o trabalho',
      value: '150,50',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        type: 'Credit',
        description: 'Uber para o trabalho',
        value: 150.5,
      })
    }
  })
})
