// FORM-08: formats a BRL currency value as the user types, treating every
// digit typed as a cent (the usual "money mask" pattern) — the field's raw
// digit stream is re-derived from the current display value on every
// keystroke (stripping any "." / "," already inserted), then re-masked from
// scratch, so this is safe to call with the previous masked value plus the
// user's edit already applied.
export function maskCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits === '') return ''

  const padded = digits.padStart(3, '0')
  const integerPart = padded.slice(0, -2).replace(/^0+(?=\d)/, '')
  const decimalPart = padded.slice(-2)
  const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${withThousands},${decimalPart}`
}
