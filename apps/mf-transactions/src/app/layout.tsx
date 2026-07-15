import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@repo/ui/Header/Header'
import { BottomNav } from '@repo/ui/BottomNav/BottomNav'

export const metadata: Metadata = {
  title: 'ByteBank — Transações',
  description: 'Listagem e lançamento de transações da sua conta ByteBank.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        {/* This zone owns "/transactions" — Multi-Zones serves this HTML
            directly via the shell's rewrite, so activeZone is set here, not
            in the shell's own layout (same pattern as apps/mf-dashboard). */}
        <Header activeZone="transactions" />
        <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-10 lg:px-6 pt-5 pb-24 md:py-8">
          {children}
        </main>
        <BottomNav activeZone="transactions" />
      </body>
    </html>
  )
}
