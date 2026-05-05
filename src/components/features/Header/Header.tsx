'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BankLogo } from './BankLogo'

const navLinks = [
  {
    href: '/',
    label: 'Início',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/transactions',
    label: 'Transações',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 bg-neutral-900 shadow-md">
      <div className="max-w-6xl mx-auto px-10 h-16 flex items-center justify-between">
        {/* Mobile/tablet: logo centered; desktop: logo left */}
        <div className="flex-1 flex justify-center md:flex-none md:justify-start">
          <Link href="/" aria-label="ByteBank — página inicial">
            <BankLogo className="h-6 w-auto" />
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-8" aria-label="Navegação principal">
          {navLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'text-white bg-white/10'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5',
                ].join(' ')}
              >
                {link.icon}
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
