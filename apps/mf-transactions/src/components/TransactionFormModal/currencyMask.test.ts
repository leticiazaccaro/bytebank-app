import { describe, expect, it } from 'vitest'
import { maskCurrencyInput } from './currencyMask'

describe('maskCurrencyInput', () => {
  it('returns an empty string when there are no digits', () => {
    expect(maskCurrencyInput('')).toBe('')
  })

  it('treats the first digits as cents', () => {
    expect(maskCurrencyInput('1')).toBe('0,01')
    expect(maskCurrencyInput('12')).toBe('0,12')
    expect(maskCurrencyInput('123')).toBe('1,23')
  })

  it('inserts a thousands separator once the integer part passes 3 digits', () => {
    expect(maskCurrencyInput('12345')).toBe('123,45')
    expect(maskCurrencyInput('1234567')).toBe('12.345,67')
    expect(maskCurrencyInput('123456789')).toBe('1.234.567,89')
  })

  it('ignores any non-digit characters already present (e.g. re-masking its own previous output)', () => {
    expect(maskCurrencyInput('12.345,67')).toBe('12.345,67')
    expect(maskCurrencyInput('R$ 1.234,56')).toBe('1.234,56')
  })

  it('drops leading zeros beyond what the two decimal places need', () => {
    expect(maskCurrencyInput('00123')).toBe('1,23')
  })
})
