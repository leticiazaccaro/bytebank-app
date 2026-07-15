import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useStore } from 'react-redux'
import { describe, expect, it } from 'vitest'

import { StoreProvider } from './StoreProvider'
import type { AppStore } from './store'

// No JSX here (kept a .test.ts, not .test.tsx, per this app's vitest
// `include` glob — see vitest.config.ts). `renderToStaticMarkup` runs
// StoreProvider's real render path (including its useRef-based store
// creation) without requiring a DOM/jsdom dependency.
function Probe({ onStore }: { onStore: (store: AppStore) => void }) {
  onStore(useStore() as AppStore)
  return null
}

function renderAndCapture(): AppStore {
  let captured: AppStore | undefined
  renderToStaticMarkup(
    createElement(StoreProvider, null, createElement(Probe, { onStore: (store) => (captured = store) }))
  )
  if (!captured) throw new Error('Probe did not run')
  return captured
}

describe('StoreProvider', () => {
  it('creates a new, independent store on every mount — no shared singleton (design.md AD-002)', () => {
    const storeA = renderAndCapture()
    const storeB = renderAndCapture()

    expect(storeA).not.toBe(storeB)
    expect(storeA.getState()).not.toBe(storeB.getState())
  })
})
