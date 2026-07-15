'use client'

import { useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { makeStore, type AppStore } from './store'

interface StoreProviderProps {
  children: ReactNode
}

// design.md AD-002: one store instance per StoreProvider mount, created
// lazily via useState's initializer (not module scope) — this is what
// guarantees no state leaks between separate app loads/users.
// SPEC_DEVIATION: tasks.md T28 says "using useRef" (the RTK Next.js docs'
// literal recipe), but eslint-plugin-react-hooks@7's react-hooks/refs rule
// (shipped with eslint-config-next 16.2.4) unconditionally rejects reading
// ref.current directly in JSX, even for the guarded lazy-init pattern.
// useState(() => makeStore()) gives the same one-instance-per-mount
// guarantee without tripping that rule.
export function StoreProvider({ children }: StoreProviderProps) {
  const [store] = useState<AppStore>(() => makeStore())

  return <Provider store={store}>{children}</Provider>
}
