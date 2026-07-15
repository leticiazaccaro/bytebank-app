import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@repo/ui/Header/Header'
import { BottomNav } from '@repo/ui/BottomNav/BottomNav'

export const metadata: Metadata = {
  title: 'ByteBank — Gerenciamento Financeiro',
  description: 'Gerencie suas transações financeiras com facilidade.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        {/* Shell only owns /login and /register — neither belongs to a
            zone, so Header/BottomNav render with no active link. */}
        <Header />
        <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-10 lg:px-6 pt-5 pb-24 md:py-8">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
