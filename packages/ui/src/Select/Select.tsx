import { SelectHTMLAttributes, ReactNode } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  icon?: ReactNode
}

export function Select({
  label,
  error,
  options,
  placeholder,
  icon,
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 z-10">
            {icon}
          </span>
        )}
        <select
          id={selectId}
          className={[
            'w-full appearance-none rounded-md border text-sm text-neutral-800 bg-white shadow-sm',
            'py-2.5 pr-9',
            icon ? 'pl-9' : 'pl-3.5',
            'focus:outline-none focus:ring-[3px] focus:ring-primary/15 focus:border-primary',
            'disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed',
            'transition-all duration-150 cursor-pointer',
            '[&>option]:bg-white [&>option]:text-neutral-800',
            '[&>option:disabled]:text-neutral-400',
            error
              ? 'border-danger focus:ring-danger/15 focus:border-danger'
              : 'border-neutral-200 hover:border-neutral-300',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}
