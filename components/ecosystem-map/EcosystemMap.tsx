'use client'

import { useState } from 'react'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import {
  ATTENTION_BANDS,
  BUILDER_ENGAGEMENT_BANDS,
  REACH_BANDS,
} from '@/lib/ecosystem-map/spectrum-config'

interface EcosystemMapProps {
  results: AnalysisResult[]
}

export function EcosystemMap({ results }: EcosystemMapProps) {
  const [legendExpanded, setLegendExpanded] = useState(false)

  if (results.length === 0) {
    return null
  }

  return (
    <section aria-label="Ecosystem map" className="rounded border border-gray-200 bg-gray-50 p-4">
      <section className="mt-3 rounded border border-indigo-200 bg-white p-3">
        <div className="space-y-3">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Ecosystem spectrum</h3>
                <p className="mt-1 text-sm text-slate-600">
                  The ecosystem is summarized using three dimensions: reach, builder engagement, and attention.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center self-start rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                aria-expanded={legendExpanded}
                onClick={() => setLegendExpanded((current) => !current)}
              >
                {legendExpanded ? 'Hide legend' : 'Show legend'}
              </button>
            </div>
          </div>
          {legendExpanded ? (
            <div className="space-y-2 text-sm text-slate-600">
              <LegendRow
                title="Reach"
                unitLabel="stars"
                bands={REACH_BANDS}
                formatter={formatCompactNumber}
                bandClassName={reachLegendBandClass}
              />
              <LegendRow
                title="Builder engagement"
                unitLabel="fork rate"
                bands={BUILDER_ENGAGEMENT_BANDS}
                formatter={formatPercentBand}
                bandClassName={engagementLegendBandClass}
              />
              <LegendRow
                title="Attention"
                unitLabel="watcher rate"
                bands={ATTENTION_BANDS}
                formatter={formatPercentBand}
                bandClassName={attentionLegendBandClass}
              />
            </div>
          ) : null}
        </div>
      </section>
    </section>
  )
}

function formatCompactNumber(value: number) {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`
  }

  return `${value}`
}

function formatPercentBand(value: number) {
  if (Number.isInteger(value)) {
    return `${value}%`
  }

  return `${value.toFixed(1)}%`
}

function LegendRow<T extends string>({
  title,
  unitLabel,
  bands,
  formatter,
  bandClassName,
}: {
  title: string
  unitLabel: string
  bands: Array<{ label: T; min: number }>
  formatter: (value: number) => string
  bandClassName: (label: T) => string
}) {
  const orderedBands = [...bands].reverse()

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-start">
        <div className="min-w-0 md:w-40 md:shrink-0">
          <p className="font-medium text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{unitLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
        {orderedBands.map((band, index) => {
          const nextBand = orderedBands[index + 1]
          const rangeLabel = nextBand
            ? `${formatter(band.min)}-${formatter(nextBand.min)}`
            : `${formatter(band.min)}+`

          return (
            <span
              key={band.label}
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bandClassName(band.label)}`}
            >
              {band.label} {rangeLabel}
            </span>
          )
        })}
        </div>
      </div>
    </div>
  )
}

function reachLegendBandClass(tier: string) {
  switch (tier) {
    case 'Emerging':
      return 'bg-emerald-50 text-emerald-600'
    case 'Growing':
      return 'bg-emerald-100 text-emerald-700'
    case 'Strong':
      return 'bg-emerald-200 text-emerald-800'
    default:
      return 'bg-emerald-300 text-emerald-950'
  }
}

function engagementLegendBandClass(tier: string) {
  switch (tier) {
    case 'Light':
      return 'bg-sky-50 text-sky-600'
    case 'Healthy':
      return 'bg-sky-100 text-sky-700'
    case 'Strong':
      return 'bg-sky-200 text-sky-800'
    default:
      return 'bg-sky-300 text-sky-950'
  }
}

function attentionLegendBandClass(tier: string) {
  switch (tier) {
    case 'Light':
      return 'bg-violet-50 text-violet-600'
    case 'Active':
      return 'bg-violet-100 text-violet-700'
    case 'Strong':
      return 'bg-violet-200 text-violet-800'
    default:
      return 'bg-violet-300 text-violet-950'
  }
}
