import { useEffect, useState } from 'react'

// TXN-04: "...com debounce de 300ms." setDebounced is only ever called from
// the setTimeout callback (an external-system-style deferred callback), not
// synchronously in the effect body, so this doesn't trigger cascading
// re-renders on every keystroke — see react-hooks/set-state-in-effect.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeoutId)
  }, [value, delayMs])

  return debounced
}
