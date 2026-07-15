'use client'

import { ResponsiveLine } from '@nivo/line'
import { formatBRL } from '@repo/shared/formatters'
import type { Transaction } from '@repo/shared/types'
import { deriveBalanceSeries } from './deriveBalanceSeries'

interface BalanceChartProps {
  transactions: Transaction[]
}

// HOME-01: evolução de saldo ao longo do tempo. Nivo (design.md Tech
// Decisions) ships ARIA labels and keyboard navigation on its SVG charts by
// default — HOME-04's tooltip-on-focus behavior and the full keyboard audit
// are verified in T47 (Phase 8), which depends on this component existing.
export function BalanceChart({ transactions }: BalanceChartProps) {
  const series = deriveBalanceSeries(transactions)

  if (series[0].data.length === 0) {
    return (
      <div
        role="status"
        className="rounded-xl border border-neutral-100 bg-white p-6 text-center text-neutral-500"
      >
        Você ainda não tem transações suficientes para exibir a evolução do saldo.
      </div>
    )
  }

  return (
    <div style={{ height: 320 }}>
      <ResponsiveLine
        data={series}
        margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear' }}
        axisBottom={{ legend: 'Data', legendOffset: 40, legendPosition: 'middle' }}
        axisLeft={{ legend: 'Saldo (R$)', legendOffset: -50, legendPosition: 'middle' }}
        colors={{ scheme: 'category10' }}
        useMesh
        enableSlices="x"
        sliceTooltip={({ slice }) => (
          <div className="rounded bg-neutral-900 px-3 py-2 text-xs text-white shadow-lg">
            {slice.points.map((point) => (
              <div key={point.id}>
                {String(point.data.xFormatted)}: {formatBRL(Number(point.data.y))}
              </div>
            ))}
          </div>
        )}
      />
    </div>
  )
}
