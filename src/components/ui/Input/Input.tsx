import { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
  iconEnd?: ReactNode
}

export function Input({ label, error, hint, icon, iconEnd, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const isDate = props.type === 'date'

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={[
            'w-full rounded-md border text-sm text-neutral-800',
            'placeholder:text-neutral-400 bg-white shadow-sm',
            'focus:outline-none focus:ring-[3px] focus:ring-primary/15 focus:border-primary',
            'disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed',
            'transition-all duration-150',
            'py-2.5',
            icon ? 'pl-9' : 'pl-3.5',
            iconEnd ? 'pr-9' : 'pr-3.5',
            isDate
              ? '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-90 [&::-webkit-calendar-picker-indicator]:transition-opacity [&::-webkit-calendar-picker-indicator]:duration-150'
              : '',
            error
              ? 'border-danger focus:ring-danger/15 focus:border-danger'
              : 'border-neutral-200 hover:border-neutral-300',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {iconEnd && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {iconEnd}
          </span>
        )}
      </div>
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  )
}
