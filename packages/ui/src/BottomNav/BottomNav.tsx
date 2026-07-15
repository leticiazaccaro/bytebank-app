'use client'

import type { ActiveZone } from '../Header/Header'
import { logout } from '../Header/logout'

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
              // T48 (A11Y-04): manually measured (WCAG relative-luminance
              // formula, cross-checked against axe-core's own reported
              // ratios on this run's other 4 findings) — the previous
              // text-primary/text-neutral-500 pair against this bar's
              // bg-neutral-900 came out at ~3.24:1/~3.67:1, both below the
              // 4.5:1 normal-text minimum (this is 10px text, not large
              // text). Not flagged by the automated gate here — a `position:
              // fixed` element is a known axe/Storybook-iframe blind spot —
              // but the underlying failure is real. Mirrors Header.tsx's
              // already-passing active/inactive treatment (text-white /
              // text-neutral-300) for consistency between the two nav bars.
              className={[
                'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
                active ? 'text-white' : 'text-neutral-300 hover:text-white',
              ].join(' ')}
            >
              {link.icon}
              <span className="text-[10px] font-medium">{link.label}</span>
            </a>
          )
        })}
        <button
          type="button"
          onClick={() => {
            void logout()
          }}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-neutral-300 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-[10px] font-medium">Sair</span>
        </button>
      </div>
    </nav>
  )
}
