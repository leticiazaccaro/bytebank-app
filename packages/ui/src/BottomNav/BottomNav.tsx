import type { ActiveZone } from '../Header/Header'

// See Header.tsx for why links are plain <a> tags and activeZone is passed
// in as a prop (Home and Transactions are different Multi-Zones apps).
interface NavLink {
  href: string
  label: string
  zone: ActiveZone
  icon: React.ReactNode
}

const navLinks: NavLink[] = [
  {
    href: '/',
    label: 'Início',
    zone: 'dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/transactions',
    label: 'Transações',
    zone: 'transactions',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
]

interface BottomNavProps {
  // Optional: apps/shell's own pages (/login, /register) belong to neither
  // zone, so no nav link should render as active there.
  activeZone?: ActiveZone
}

export function BottomNav({ activeZone }: BottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-900 border-t border-neutral-800"
      aria-label="Navegação principal"
    >
      <div className="flex items-stretch h-16">
        {navLinks.map((link) => {
          const active = link.zone === activeZone
          return (
            <a
              key={link.href}
              href={link.href}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
                active ? 'text-primary' : 'text-neutral-500 hover:text-neutral-300',
              ].join(' ')}
            >
              {link.icon}
              <span className="text-[10px] font-medium">{link.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
