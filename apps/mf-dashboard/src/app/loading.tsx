import { LiveRegion } from '@repo/ui/LiveRegion/LiveRegion'

// Next.js file-convention Suspense fallback shown while the async
// DashboardPage Server Component awaits the statement fetch.
export default function Loading() {
  return (
    <>
      {/* A11Y-03: the skeleton bars are purely decorative (aria-hidden) —
          this is the only signal a screen reader user gets that the page is
          loading. */}
      <LiveRegion message="Carregando seus dados financeiros…" politeness="polite" />
      <div className="flex flex-col gap-6 animate-pulse" aria-hidden="true">
        <div className="h-32 rounded-xl bg-neutral-100" />
        <div className="h-80 rounded-xl bg-neutral-100" />
        <div className="h-72 rounded-xl bg-neutral-100" />
      </div>
    </>
  )
}
