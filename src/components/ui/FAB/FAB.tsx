interface FABProps {
  onClick: () => void
  label?: string
}

export function FAB({ onClick, label = 'Nova transação' }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={[
        'fixed z-30 flex items-center gap-2',
        /* Mobile: above bottom nav (h-16 = 64px + 16px gap) */
        'bottom-[5rem] right-4',
        /* Desktop: conventional FAB position */
        'md:bottom-8 md:right-8',
        'bg-primary text-white rounded-full shadow-lg',
        'px-4 py-3',
        'hover:bg-primary-hover active:scale-95',
        'transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'cursor-pointer',
      ].join(' ')}
    >
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="hidden sm:inline text-sm font-medium pr-1">{label}</span>
    </button>
  )
}
