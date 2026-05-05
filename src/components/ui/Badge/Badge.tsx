import { TransactionType, TRANSACTION_TYPE_LABELS } from '@/types/transaction'

interface BadgeProps {
  type: TransactionType
  className?: string
}

const badgeStyles: Record<TransactionType, string> = {
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
      {TRANSACTION_TYPE_LABELS[type]}
    </span>
  )
}
