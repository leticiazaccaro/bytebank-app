'use client'

import { ResponsiveLine } from '@nivo/line'
import { formatBRL } from '@repo/shared/formatters'
import type { Transaction } from '@repo/shared/types'
import { deriveBalanceSeries } from './deriveBalanceSeries'

interface BalanceChartProps {
  transactions: Transaction[]
}

// HOME-01: evolução de saldo ao longo do tempo.
// T47 audit finding: contrary to the assumption this comment previously
// stated, Nivo's keyboard support is opt-in, not on by default — verified in
// @nivo/line's source (`isFocusable` defaults to `false`; without it, the
// point dots never attach the `onFocus` handler that triggers the tooltip).
// `isFocusable` + `pointAriaLabel` below are what actually make HOME-04's
// "foca (teclado) em um ponto" requirement work.
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
        isFocusable
        pointAriaLabel={(point) => `${point.data.xFormatted}: ${formatBRL(Number(point.data.y))}`}
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
