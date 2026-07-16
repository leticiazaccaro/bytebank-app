import { describe, expect, it } from 'vitest'

import { formatBRL, formatDate } from './formatters'

// Intl.NumberFormat('pt-BR', { style: 'currency' }) separates the symbol from
// the amount with a non-breaking space (U+00A0), not a regular space.
describe('formatBRL', () => {
  it('formats a positive value as BRL currency', () => {
    expect(formatBRL(1234.5)).toBe('R$ 1.234,50')
  })

  it('formats a negative value as BRL currency', () => {
    expect(formatBRL(-1234.5)).toBe('-R$ 1.234,50')
  })

  it('formats zero as BRL currency', () => {
    expect(formatBRL(0)).toBe('R$ 0,00')
  })
})

describe('formatDate', () => {
  it('formats an ISO date-only string as pt-BR (dd/mm/yyyy)', () => {
    expect(formatDate('2026-07-14')).toBe('14/07/2026')
  })

  it('throws on an invalid date input', () => {
    expect(() => formatDate('not-a-date')).toThrow('Invalid time value')
  })

  it('formats a full ISO 8601 datetime string (real API shape) as pt-BR (dd/mm/yyyy)', () => {
    expect(formatDate('2026-07-15T21:14:00.000Z')).toBe('15/07/2026')
  })
})
