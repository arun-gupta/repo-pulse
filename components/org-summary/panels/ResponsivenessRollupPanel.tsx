'use client'

import type { AggregatePanel } from '@/lib/org-aggregation/types'
import type { ResponsivenessRollupValue } from '@/lib/org-aggregation/aggregators/types'
import { HelpLabel } from '@/components/shared/HelpLabel'
import { EmptyState } from '../EmptyState'

interface Props {
  panel: AggregatePanel<ResponsivenessRollupValue>
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  const days = hours / 24
  return `${days.toFixed(1)}d`
}

export function ResponsivenessRollupPanel({ panel }: Props) {
  return (
    <section
      aria-label="Responsiveness rollup"
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Responsiveness</h3>
        {panel.lastUpdatedAt ? (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            updated {panel.lastUpdatedAt.toLocaleTimeString()}
          </span>
        ) : null}
      </header>

      {panel.status === 'in-progress' && !panel.value ? (
        <EmptyState />
      ) : panel.status === 'unavailable' || !panel.value ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No responsiveness data available across this run.
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <HelpLabel
                label="First response (median)"
                helpText="Weighted median time to first response on issues across the org. Weighted by each repo's open issue count."
              />
            </dt>
            <dd className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {panel.value.weightedMedianFirstResponseHours !== null
                ? formatHours(panel.value.weightedMedianFirstResponseHours)
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <HelpLabel
                label="PR merge (median)"
                helpText="Weighted median time to merge pull requests across the org. Weighted by each repo's merged PR count."
              />
            </dt>
            <dd className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {panel.value.weightedMedianPrMergeHours !== null
                ? formatHours(panel.value.weightedMedianPrMergeHours)
                : '—'}
            </dd>
          </div>
        </dl>
      )}
    </section>
  )
}
