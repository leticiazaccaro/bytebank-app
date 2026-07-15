'use client'

import { useEffect, useState } from 'react'
import { ResponsivePie } from '@nivo/pie'
import { formatBRL } from '@repo/shared/formatters'
import { getCategoryIndex } from '@repo/shared/categoryIndex'
import type { CategoryIndex } from '@repo/shared/categoryIndex'
import type { Transaction } from '@repo/shared/types'
import { deriveCategoryBreakdown, type CategorySlice } from './deriveCategoryBreakdown'

interface CategoryBreakdownChartProps {
  transactions: Transaction[]
}

// T47 audit finding: unlike @nivo/line's ResponsiveLine (see BalanceChart.tsx),
// @nivo/pie's ResponsivePie ships no `isFocusable`/keyboard-focus prop at all
// (verified in its source/type definitions) — there is no way to make an
// individual arc keyboard-reachable via Nivo's own API. This sr-only list is
// the text alternative: every value the pie chart encodes visually is also
// reachable by a screen reader in linear reading order, satisfying HOME-04's
// intent (an exact value per segment) even though the interactive SVG itself
// has no native on-focus tooltip.
// SPEC_DEVIATION: HOME-04 describes a tooltip that appears "ao focar" a
// segment; @nivo/pie has no keyboard-focus API to hook that into. Mitigated
// with an always-present accessible text equivalent instead.
function CategoryBreakdownList({ title, slices }: { title: string; slices: CategorySlice[] }) {
  return (
    <ul className="sr-only">
      {slices.map((slice) => (
        <li key={slice.label}>
          {title} — {slice.label}: {formatBRL(slice.value)}
        </li>
      ))}
    </ul>
  )
}

// HOME-02: entradas vs. saídas por categoria. The local category index only
// exists in localStorage (browser-only), so it's read after mount — both the
// server render and the initial client render use the empty-index default,
// avoiding a hydration mismatch.
export function CategoryBreakdownChart({ transactions }: CategoryBreakdownChartProps) {
  const [categoryIndex, setCategoryIndex] = useState<CategoryIndex>({})

  useEffect(() => {
    // One-shot read of the localStorage-backed category index after mount.
    // useSyncExternalStore isn't a fit here without adding snapshot-caching
    // machinery to packages/shared's getCategoryIndex() (it re-parses JSON
    // and returns a new object on every call, breaking that hook's
    // reference-stability contract) — this causes exactly one extra render
    // right after mount, not a cascading chain.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategoryIndex(getCategoryIndex())
  }, [])

  const { credit, debit } = deriveCategoryBreakdown(transactions, categoryIndex)

  if (credit.length === 0 && debit.length === 0) {
    return (
      <div
        role="status"
        className="rounded-xl border border-neutral-100 bg-white p-6 text-center text-neutral-500"
      >
        Você ainda não tem transações suficientes para exibir entradas e saídas por categoria.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm font-medium text-neutral-600 mb-2">Entradas por categoria</h3>
        {credit.length === 0 ? (
          <p role="status" className="text-sm text-neutral-400">
            Sem entradas no período.
          </p>
        ) : (
          <div style={{ height: 260 }}>
            <ResponsivePie
              data={credit.map((slice) => ({ id: slice.label, label: slice.label, value: slice.value }))}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.5}
              arcLabelsSkipAngle={10}
            />
            <CategoryBreakdownList title="Entradas por categoria" slices={credit} />
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-neutral-600 mb-2">Saídas por categoria</h3>
        {debit.length === 0 ? (
          <p role="status" className="text-sm text-neutral-400">
            Sem saídas no período.
          </p>
        ) : (
          <div style={{ height: 260 }}>
            <ResponsivePie
              data={debit.map((slice) => ({ id: slice.label, label: slice.label, value: slice.value }))}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.5}
              arcLabelsSkipAngle={10}
            />
            <CategoryBreakdownList title="Saídas por categoria" slices={debit} />
          </div>
        )}
      </div>
    </div>
  )
}
