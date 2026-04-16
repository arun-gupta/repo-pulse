'use client'

import type { AggregatePanel } from '@/lib/org-aggregation/types'
import type { SecurityRollupValue } from '@/lib/org-aggregation/aggregators/types'
import { HelpLabel } from '@/components/shared/HelpLabel'
import { EmptyState } from '../EmptyState'

interface Props {
  panel: AggregatePanel<SecurityRollupValue>
}

export function SecurityRollupPanel({ panel }: Props) {
  return (
    <section
      aria-label="Security rollup"
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Security (OpenSSF Scorecard)
        </h3>
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
          No OpenSSF Scorecard data available across this run.
        </p>
      ) : (
        <Body value={panel.value} />
      )}
    </section>
  )
}

function scoreTone(score: number): string {
  if (score >= 7) return 'text-emerald-700 dark:text-emerald-400'
  if (score >= 4) return 'text-amber-700 dark:text-amber-400'
  return 'text-rose-700 dark:text-rose-400'
}

function Body({ value }: { value: SecurityRollupValue }) {
  const available = value.perRepo.filter((r) => typeof r.score === 'number')

  return (
    <>
      <dl className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <HelpLabel label="Worst score" helpText="Lowest OpenSSF Scorecard score across the repo set. Highlights the weakest link." />
          </dt>
          <dd className={`text-2xl font-semibold ${value.worstScore !== null ? scoreTone(value.worstScore) : 'text-slate-400'}`}>
            {value.worstScore !== null ? value.worstScore.toFixed(1) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Repos with scorecard</dt>
          <dd className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {available.length} of {value.perRepo.length}
          </dd>
        </div>
      </dl>

      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Per-repo scores</h4>
      <ul role="list" className="mt-2 divide-y divide-slate-200 dark:divide-slate-700">
        {value.perRepo.map((r) => (
          <li key={r.repo} className="flex items-center justify-between gap-3 py-2">
            <span className="truncate text-sm text-slate-800 dark:text-slate-200">{r.repo}</span>
            {typeof r.score === 'number' ? (
              <span className={`text-sm font-semibold ${scoreTone(r.score)}`}>{r.score.toFixed(1)}</span>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">unavailable</span>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
