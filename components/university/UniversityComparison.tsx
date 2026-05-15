'use client'

import { useState } from 'react'
import type { UniversitySummary } from '@/lib/university/university-summary'

type MetricKey = 'activity' | 'maintenance' | 'community' | 'documentation' | 'security'
type SortMetric = 'medianScore' | MetricKey

const METRIC_LABELS: Record<MetricKey, string> = {
  activity: 'Activity',
  maintenance: 'Maintenance',
  community: 'Community',
  documentation: 'Docs',
  security: 'Security',
}

const METRIC_KEYS = Object.keys(METRIC_LABELS) as MetricKey[]

const BUCKET_LABELS = ['0–9', '10–19', '20–29', '30–39', '40–49', '50–59', '60–69', '70–79', '80–89', '90–100']

function bucketCellClass(pct: number): string {
  if (pct === 0) return 'text-slate-300 dark:text-slate-700'
  if (pct < 5)  return 'bg-sky-50  text-sky-600  dark:bg-sky-950/60  dark:text-sky-400'
  if (pct < 10) return 'bg-sky-100 text-sky-700  dark:bg-sky-900/60  dark:text-sky-300'
  if (pct < 20) return 'bg-sky-200 text-sky-800  dark:bg-sky-800/70  dark:text-sky-200'
  if (pct < 30) return 'bg-sky-300 text-sky-900  dark:bg-sky-700     dark:text-white'
  return              'bg-sky-500 text-white     dark:bg-sky-500     dark:text-white'
}

function metricColor(value: number): string {
  if (value >= 50) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
  if (value >= 25) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
  if (value >= 10) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
  return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
}

function shortName(university: string): string {
  return university
    .replace(/^University of California,\s+/i, '')
    .replace(/^University of\s+/i, '')
    .replace(/^The\s+/i, '')
}

interface Props {
  summaries: UniversitySummary[]
}

export function UniversityComparison({ summaries }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(summaries.map((s) => s.slug)))
  const [tab, setTab] = useState<'heatmap' | 'metrics'>('heatmap')
  const [sortMetric, setSortMetric] = useState<SortMetric>('medianScore')
  const [sortAsc, setSortAsc] = useState(false)

  const visible = summaries
    .filter((s) => selected.has(s.slug))
    .sort((a, b) => {
      const av = sortMetric === 'medianScore' ? a.medianScore : a.metrics[sortMetric]
      const bv = sortMetric === 'medianScore' ? b.medianScore : b.metrics[sortMetric]
      return sortAsc ? av - bv : bv - av
    })

  function toggleSort(metric: SortMetric) {
    if (sortMetric === metric) setSortAsc((v) => !v)
    else { setSortMetric(metric); setSortAsc(false) }
  }

  // Standout callouts
  const mostActive = summaries.reduce((a, b) => a.metrics.activity > b.metrics.activity ? a : b)
  const bestDocs = summaries.reduce((a, b) => a.metrics.documentation > b.metrics.documentation ? a : b)
  const mostCommunity = summaries.reduce((a, b) => a.metrics.community > b.metrics.community ? a : b)

  return (
    <div className="space-y-4">
      {/* Standout callouts */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Most active', uni: mostActive, value: `${mostActive.metrics.activity}% repos`, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Best documented', uni: bestDocs, value: `${bestDocs.metrics.documentation} median score`, color: 'text-sky-600 dark:text-sky-400' },
          { label: 'Most community', uni: mostCommunity, value: `${mostCommunity.metrics.community}% multi-author`, color: 'text-violet-600 dark:text-violet-400' },
        ].map(({ label, uni, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${color}`}>{shortName(uni.university)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* University selector */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-500 dark:text-slate-400">Show:</span>
        {summaries.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => setSelected((prev) => {
              const next = new Set(prev)
              if (next.has(s.slug)) { if (next.size > 1) next.delete(s.slug) }
              else next.add(s.slug)
              return next
            })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              selected.has(s.slug)
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {shortName(s.university)}
          </button>
        ))}
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {(['heatmap', 'metrics'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium transition border-b-2 -mb-px ${
              tab === t
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            {t === 'heatmap' ? 'Score distribution' : 'Health metrics'}
          </button>
        ))}
      </div>

      {tab === 'heatmap' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 font-medium text-slate-500 dark:text-slate-400 min-w-[120px]">University</th>
                {BUCKET_LABELS.map((l) => (
                  <th key={l} className="text-center py-2 px-1 font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => {
                const total = s.scoredRepos || 1
                return (
                  <tr key={s.slug} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {shortName(s.university)}
                    </td>
                    {s.scoreBuckets.map((count, i) => {
                      const pct = (count / total) * 100
                      return (
                        <td key={i} className="text-center py-1 px-0.5">
                          <span className={`inline-block w-full rounded px-1 py-1 text-xs font-medium tabular-nums ${bucketCellClass(pct)}`}>
                            {pct < 1 && pct > 0 ? '<1' : Math.round(pct)}%
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Cell color = % of repos in that score bucket. Darker = higher concentration.</p>
        </div>
      )}

      {tab === 'metrics' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {([['medianScore', 'Median score'], ...METRIC_KEYS.map((k) => [k, METRIC_LABELS[k]])] as [SortMetric, string][]).map(([key, label], i) => (
                  <th
                    key={key}
                    className={`py-2 font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 ${i === 0 ? 'text-left pr-4 min-w-[120px]' : 'text-center px-3'}`}
                    onClick={() => toggleSort(key)}
                  >
                    {label}{sortMetric === key ? (sortAsc ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.slug} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {shortName(s.university)}
                  </td>
                  <td className="text-center px-3 py-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{s.medianScore}</span>
                  </td>
                  {METRIC_KEYS.map((k) => (
                    <td key={k} className="text-center px-3 py-1.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${metricColor(s.metrics[k])}`}>
                        {s.metrics[k]}%
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Activity/Maintenance/Community = % of scored repos. Docs/Security = median score (0–100). Click column header to sort.
          </p>
        </div>
      )}
    </div>
  )
}
