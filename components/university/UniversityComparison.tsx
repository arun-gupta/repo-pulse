'use client'

import { useState } from 'react'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import type { UniversitySummary } from '@/lib/university/university-summary'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

type MetricKey = 'activity' | 'maintenance' | 'community' | 'documentation' | 'security'
type SortMetric = 'medianScore' | MetricKey
type DrillDown = 'active' | 'documentation' | 'community' | 'stars' | 'starred' | 'contributors' | 'prs' | 'issues'

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
  const [tab, setTab] = useState<'heatmap' | 'metrics' | 'radar' | 'highlights'>('highlights')
  const [drillDown, setDrillDown] = useState<DrillDown | null>(null)
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

  // Standout callouts — university-level
  const mostActive = summaries.reduce((a, b) => a.metrics.activity > b.metrics.activity ? a : b)
  const bestDocs = summaries.reduce((a, b) => a.metrics.documentation > b.metrics.documentation ? a : b)
  const mostCommunity = summaries.reduce((a, b) => a.metrics.community > b.metrics.community ? a : b)
  const mostStars = summaries.reduce((a, b) => a.highlights.totalStars > b.highlights.totalStars ? a : b)

  // Cross-university top repos
  const topStarredRepo = summaries.reduce((a, b) =>
    a.highlights.mostStarred.value > b.highlights.mostStarred.value ? a : b)
  const topContribRepo = summaries.reduce((a, b) =>
    a.highlights.mostContributors.value > b.highlights.mostContributors.value ? a : b)
  const topPRsRepo = summaries.reduce((a, b) =>
    a.highlights.mostPRs.value > b.highlights.mostPRs.value ? a : b)
  const topIssuesRepo = summaries.reduce((a, b) =>
    a.highlights.mostIssues.value > b.highlights.mostIssues.value ? a : b)

  return (
    <div className="space-y-4">
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
        {(['highlights', 'radar', 'metrics', 'heatmap'] as const).map((t) => (
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
            {t === 'radar' ? 'Radar' : t === 'metrics' ? 'Health metrics' : t === 'heatmap' ? 'Score distribution' : 'Highlights'}
          </button>
        ))}
      </div>

      {/* Highlights tab — callout stats cards */}
      {tab === 'highlights' && <div className="grid grid-cols-4 gap-2">
        {([
          { key: 'active' as DrillDown, label: 'Most active', name: shortName(mostActive.university), value: `${mostActive.metrics.activity}% active`, color: 'text-emerald-600 dark:text-emerald-400' },
          { key: 'documentation' as DrillDown, label: 'Best documented', name: shortName(bestDocs.university), value: `${bestDocs.metrics.documentation} doc score`, color: 'text-sky-600 dark:text-sky-400' },
          { key: 'community' as DrillDown, label: 'Most community', name: shortName(mostCommunity.university), value: `${mostCommunity.metrics.community}% multi-author`, color: 'text-violet-600 dark:text-violet-400' },
          { key: 'stars' as DrillDown, label: 'Most stars', name: shortName(mostStars.university), value: `${mostStars.highlights.totalStars.toLocaleString()} ★`, color: 'text-amber-600 dark:text-amber-400' },
        ] as const).map(({ key, label, name, value, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => setDrillDown((d) => d === key ? null : key)}
            className={`rounded-lg border px-3 py-2 min-w-0 text-left transition hover:border-sky-400 dark:hover:border-sky-500 ${
              drillDown === key
                ? 'border-sky-400 bg-sky-50 dark:border-sky-500 dark:bg-sky-950/30'
                : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
            }`}
          >
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{label}</p>
            <p className={`text-xs font-semibold mt-0.5 truncate ${color}`}>{name}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">{value}</p>
          </button>
        ))}
        {([
          { key: 'starred' as DrillDown, label: 'Top starred repo', name: topStarredRepo.highlights.mostStarred.repo.split('/')[1], href: `https://github.com/${topStarredRepo.highlights.mostStarred.repo}`, sub: `${topStarredRepo.highlights.mostStarred.value.toLocaleString()} ★ · ${shortName(topStarredRepo.university)}`, color: 'text-amber-600 dark:text-amber-400' },
          { key: 'contributors' as DrillDown, label: 'Most contributors', name: topContribRepo.highlights.mostContributors.repo.split('/')[1], href: `https://github.com/${topContribRepo.highlights.mostContributors.repo}`, sub: `${topContribRepo.highlights.mostContributors.value.toLocaleString()} contributors · ${shortName(topContribRepo.university)}`, color: 'text-violet-600 dark:text-violet-400' },
          { key: 'prs' as DrillDown, label: 'Most PRs (90d)', name: topPRsRepo.highlights.mostPRs.repo.split('/')[1], href: `https://github.com/${topPRsRepo.highlights.mostPRs.repo}`, sub: `${topPRsRepo.highlights.mostPRs.value.toLocaleString()} PRs · ${shortName(topPRsRepo.university)}`, color: 'text-sky-600 dark:text-sky-400' },
          { key: 'issues' as DrillDown, label: 'Most issues closed (90d)', name: topIssuesRepo.highlights.mostIssues.repo.split('/')[1], href: `https://github.com/${topIssuesRepo.highlights.mostIssues.repo}`, sub: `${topIssuesRepo.highlights.mostIssues.value.toLocaleString()} closed · ${shortName(topIssuesRepo.university)}`, color: 'text-emerald-600 dark:text-emerald-400' },
        ] as const).map(({ key, label, name, href, sub, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => setDrillDown((d) => d === key ? null : key)}
            className={`rounded-lg border px-3 py-2 min-w-0 text-left transition hover:border-sky-400 dark:hover:border-sky-500 ${
              drillDown === key
                ? 'border-sky-400 bg-sky-50 dark:border-sky-500 dark:bg-sky-950/30'
                : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
            }`}
          >
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{label}</p>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs font-semibold mt-0.5 block truncate hover:underline ${color}`}
              onClick={(e) => e.stopPropagation()}
            >
              {name}
            </a>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight truncate">{sub}</p>
          </button>
        ))}
      </div>}

      {/* Highlights tab — drill-down panel */}
      {tab === 'highlights' && drillDown && (
        <div className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {drillDown === 'active' && 'Activity ranking — % of repos with commits in last 90 days'}
              {drillDown === 'documentation' && 'Documentation ranking — median doc score (0–100)'}
              {drillDown === 'community' && 'Community ranking — % of repos with multiple commit authors'}
              {drillDown === 'stars' && 'Stars ranking — total GitHub stars across all repos'}
              {drillDown === 'starred' && 'Most starred repo per university'}
              {drillDown === 'contributors' && 'Most contributors in a single repo per university'}
              {drillDown === 'prs' && 'Most PRs opened (90d) in a single repo per university'}
              {drillDown === 'issues' && 'Most issues closed (90d) in a single repo per university'}
            </p>
            <button type="button" onClick={() => setDrillDown(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm leading-none">✕</button>
          </div>
          <table className="w-full text-xs">
            <tbody>
              {drillDown === 'active' && [...summaries].sort((a, b) => b.metrics.activity - a.metrics.activity).map((s, i) => (
                <tr key={s.slug} className="border-t border-sky-100 dark:border-sky-900/50">
                  <td className="py-1 pr-3 text-slate-400 tabular-nums w-5">{i + 1}</td>
                  <td className="py-1 pr-4 font-medium text-slate-700 dark:text-slate-300">{shortName(s.university)}</td>
                  <td className="py-1 pr-3 tabular-nums text-slate-600 dark:text-slate-400">{s.metrics.activity}% active</td>
                  <td className="py-1 text-slate-400 dark:text-slate-500">{s.metrics.maintenance}% maintained · {s.metrics.community}% multi-author</td>
                </tr>
              ))}
              {drillDown === 'documentation' && [...summaries].sort((a, b) => b.metrics.documentation - a.metrics.documentation).map((s, i) => (
                <tr key={s.slug} className="border-t border-sky-100 dark:border-sky-900/50">
                  <td className="py-1 pr-3 text-slate-400 tabular-nums w-5">{i + 1}</td>
                  <td className="py-1 pr-4 font-medium text-slate-700 dark:text-slate-300">{shortName(s.university)}</td>
                  <td className="py-1 pr-3 tabular-nums text-slate-600 dark:text-slate-400">{s.metrics.documentation} doc score</td>
                  <td className="py-1 text-slate-400 dark:text-slate-500">{s.metrics.security} security score</td>
                </tr>
              ))}
              {drillDown === 'community' && [...summaries].sort((a, b) => b.metrics.community - a.metrics.community).map((s, i) => (
                <tr key={s.slug} className="border-t border-sky-100 dark:border-sky-900/50">
                  <td className="py-1 pr-3 text-slate-400 tabular-nums w-5">{i + 1}</td>
                  <td className="py-1 pr-4 font-medium text-slate-700 dark:text-slate-300">{shortName(s.university)}</td>
                  <td className="py-1 pr-3 tabular-nums text-slate-600 dark:text-slate-400">{s.metrics.community}% multi-author</td>
                  <td className="py-1 text-slate-400 dark:text-slate-500">{s.metrics.activity}% active · {s.scoredRepos} repos</td>
                </tr>
              ))}
              {drillDown === 'stars' && [...summaries].sort((a, b) => b.highlights.totalStars - a.highlights.totalStars).map((s, i) => (
                <tr key={s.slug} className="border-t border-sky-100 dark:border-sky-900/50">
                  <td className="py-1 pr-3 text-slate-400 tabular-nums w-5">{i + 1}</td>
                  <td className="py-1 pr-4 font-medium text-slate-700 dark:text-slate-300">{shortName(s.university)}</td>
                  <td className="py-1 pr-3 tabular-nums text-slate-600 dark:text-slate-400">{s.highlights.totalStars.toLocaleString()} ★</td>
                  <td className="py-1 text-slate-400 dark:text-slate-500">
                    top: <a href={`https://github.com/${s.highlights.mostStarred.repo}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">{s.highlights.mostStarred.repo.split('/')[1]}</a> ({s.highlights.mostStarred.value.toLocaleString()} ★)
                  </td>
                </tr>
              ))}
              {drillDown === 'starred' && [...summaries].sort((a, b) => b.highlights.mostStarred.value - a.highlights.mostStarred.value).map((s, i) => (
                <tr key={s.slug} className="border-t border-sky-100 dark:border-sky-900/50">
                  <td className="py-1 pr-3 text-slate-400 tabular-nums w-5">{i + 1}</td>
                  <td className="py-1 pr-3">
                    <a href={`https://github.com/${s.highlights.mostStarred.repo}`} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-600 dark:text-sky-400 hover:underline">{s.highlights.mostStarred.repo.split('/')[1]}</a>
                  </td>
                  <td className="py-1 pr-3 tabular-nums text-slate-600 dark:text-slate-400">{s.highlights.mostStarred.value.toLocaleString()} ★</td>
                  <td className="py-1 text-slate-400 dark:text-slate-500">{shortName(s.university)}</td>
                </tr>
              ))}
              {drillDown === 'contributors' && [...summaries].sort((a, b) => b.highlights.mostContributors.value - a.highlights.mostContributors.value).map((s, i) => (
                <tr key={s.slug} className="border-t border-sky-100 dark:border-sky-900/50">
                  <td className="py-1 pr-3 text-slate-400 tabular-nums w-5">{i + 1}</td>
                  <td className="py-1 pr-3">
                    <a href={`https://github.com/${s.highlights.mostContributors.repo}`} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-600 dark:text-sky-400 hover:underline">{s.highlights.mostContributors.repo.split('/')[1]}</a>
                  </td>
                  <td className="py-1 pr-3 tabular-nums text-slate-600 dark:text-slate-400">{s.highlights.mostContributors.value.toLocaleString()} contributors</td>
                  <td className="py-1 text-slate-400 dark:text-slate-500">{shortName(s.university)}</td>
                </tr>
              ))}
              {drillDown === 'prs' && [...summaries].sort((a, b) => b.highlights.mostPRs.value - a.highlights.mostPRs.value).map((s, i) => (
                <tr key={s.slug} className="border-t border-sky-100 dark:border-sky-900/50">
                  <td className="py-1 pr-3 text-slate-400 tabular-nums w-5">{i + 1}</td>
                  <td className="py-1 pr-3">
                    <a href={`https://github.com/${s.highlights.mostPRs.repo}`} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-600 dark:text-sky-400 hover:underline">{s.highlights.mostPRs.repo.split('/')[1]}</a>
                  </td>
                  <td className="py-1 pr-3 tabular-nums text-slate-600 dark:text-slate-400">{s.highlights.mostPRs.value.toLocaleString()} PRs opened</td>
                  <td className="py-1 text-slate-400 dark:text-slate-500">{shortName(s.university)}</td>
                </tr>
              ))}
              {drillDown === 'issues' && [...summaries].sort((a, b) => b.highlights.mostIssues.value - a.highlights.mostIssues.value).map((s, i) => (
                <tr key={s.slug} className="border-t border-sky-100 dark:border-sky-900/50">
                  <td className="py-1 pr-3 text-slate-400 tabular-nums w-5">{i + 1}</td>
                  <td className="py-1 pr-3">
                    <a href={`https://github.com/${s.highlights.mostIssues.repo}`} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-600 dark:text-sky-400 hover:underline">{s.highlights.mostIssues.repo.split('/')[1]}</a>
                  </td>
                  <td className="py-1 pr-3 tabular-nums text-slate-600 dark:text-slate-400">{s.highlights.mostIssues.value.toLocaleString()} issues closed</td>
                  <td className="py-1 text-slate-400 dark:text-slate-500">{shortName(s.university)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'heatmap' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 font-medium text-slate-500 dark:text-slate-400 min-w-[120px]"></th>
                <th colSpan={10} className="text-center pb-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                  ← Health score percentile (0–100) →
                </th>
              </tr>
              <tr>
                <th className="text-left py-1 pr-4 font-medium text-slate-500 dark:text-slate-400">University</th>
                {BUCKET_LABELS.map((l) => (
                  <th key={l} className="text-center py-1 px-1 font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">{l}</th>
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
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Each cell = % of repos in that health score percentile bucket. Darker = higher concentration.</p>
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

      {tab === 'radar' && (() => {
        const COLORS = [
          { bg: 'rgba(14,165,233,0.12)',  border: 'rgba(14,165,233,0.85)'  },  // sky
          { bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.85)'  },  // violet
          { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.85)'   },  // emerald
          { bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.85)'  },  // orange
          { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.85)'   },  // red
        ]
        const allValues = visible.flatMap((s) => Object.values(s.metrics))
        const max = Math.max(10, Math.ceil(Math.max(...allValues) / 10) * 10)
        const data = {
          labels: ['Activity', 'Maintenance', 'Community', 'Docs', 'Security'],
          datasets: visible.map((s, i) => ({
            label: shortName(s.university),
            data: [s.metrics.activity, s.metrics.maintenance, s.metrics.community, s.metrics.documentation, s.metrics.security],
            backgroundColor: COLORS[i % COLORS.length].bg,
            borderColor: COLORS[i % COLORS.length].border,
            borderWidth: 1.5,
            pointRadius: 3,
            pointBackgroundColor: COLORS[i % COLORS.length].border,
          })),
        }
        const options = {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: true, position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 11 } } },
            tooltip: { enabled: true },
          },
          scales: {
            r: {
              min: 0,
              max,
              ticks: { display: false },
              pointLabels: { display: true, font: { size: 10 } },
              grid: { color: 'rgba(148,163,184,0.2)' },
              angleLines: { color: 'rgba(148,163,184,0.2)' },
            },
          },
        }
        return (
          <div className="flex justify-center py-2">
            <div className="w-full max-w-sm">
              <Radar data={data} options={options} />
            </div>
          </div>
        )
      })()}
    </div>
  )
}
