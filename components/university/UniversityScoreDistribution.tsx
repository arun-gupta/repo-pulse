'use client'

import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import { getHealthScore } from '@/lib/scoring/health-score'

interface Props {
  results: AnalysisResult[]
}

const BANDS = [
  { label: 'High (67–100)', min: 67, max: 100, bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  { label: 'Medium (34–66)', min: 34, max: 66, bg: 'bg-amber-400', text: 'text-amber-700 dark:text-amber-400' },
  { label: 'Low (0–33)', min: 0, max: 33, bg: 'bg-red-400', text: 'text-red-700 dark:text-red-400' },
]

export function UniversityScoreDistribution({ results }: Props) {
  const scored = results.flatMap((r) => {
    const p = getHealthScore(r).percentile
    return p !== null ? [p] : []
  })

  if (scored.length === 0) return null

  const counts = BANDS.map((b) => ({
    ...b,
    count: scored.filter((p) => p >= b.min && p <= b.max).length,
  }))

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Health score distribution</p>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {/* Render high→medium→low so green is on the left */}
        {counts.map((b) => {
          const pct = (b.count / scored.length) * 100
          if (pct === 0) return null
          return (
            <div
              key={b.label}
              className={`${b.bg} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${b.label}: ${b.count} repos (${Math.round(pct)}%)`}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {counts.map((b) => (
          <span key={b.label} className={`text-xs ${b.text}`}>
            <span className="font-medium">{Math.round((b.count / scored.length) * 100)}%</span>
            {' '}{b.label.split(' ')[0].toLowerCase()} ({b.count})
          </span>
        ))}
      </div>
    </div>
  )
}
