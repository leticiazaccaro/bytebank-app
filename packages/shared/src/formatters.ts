export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr: string): string {
  // T61: the real API returns full ISO 8601 datetime strings
  // (design.md Data Models), not just date-only strings — only the date
  // portion is used, parsed as local-calendar components (not `new
  // Date(dateStr)`) to avoid a UTC-midnight/local-timezone day shift.
  const datePart = dateStr.split('T')[0]
  const [year, month, day] = datePart.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('pt-BR').format(date)
}
