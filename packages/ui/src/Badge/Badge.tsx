export type BadgeTransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'pix'

// Local copy of src/types/transaction.ts's TRANSACTION_TYPE_LABELS.
// packages/ui components are pure UI (design.md: "sem lógica de
// negócio/API") and cannot reach the Fase 01 app's `@/types/transaction`
// path alias, so the label map is inlined here to keep Badge's props API
// and rendered output identical to the Fase 01 version.
const BADGE_TYPE_LABELS: Record<BadgeTransactionType, string> = {
  deposit: 'Depósito',
  withdrawal: 'Saque',
  transfer: 'Transferência',
  pix: 'PIX',
}

interface BadgeProps {
  type: BadgeTransactionType
  className?: string
}

const badgeStyles: Record<BadgeTransactionType, string> = {
  deposit: 'bg-success-light text-success',
  withdrawal: 'bg-danger-light text-danger',
  transfer: 'bg-secondary-light text-secondary',
  pix: 'bg-warning-light text-warning',
}

export function Badge({ type, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        badgeStyles[type],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {BADGE_TYPE_LABELS[type]}
    </span>
  )
}
