'use client'

import { useState, useMemo } from 'react'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import { CONTRIBUTOR_WINDOW_DAYS, type ContributorWindowDays } from '@/lib/analyzer/analysis-result'
import { getHealthScore } from '@/lib/scoring/health-score'

type SortKey = 'repo' | 'stars' | 'forks' | 'issuesOpen' | 'prsOpened90d' | 'authors' | 'totalContributors' | 'percentile'
type SortDir = 'asc' | 'desc'

function num(v: unknown): number | null {
  return typeof v === 'number' ? v : null
}

function fmt(v: unknown): string {
  if (typeof v !== 'number') return '—'
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return v.toString()
}

function getAuthors(result: AnalysisResult, window: ContributorWindowDays): number | null {
  const windowData = result.contributorMetricsByWindow?.[window]
  if (windowData) {
    const v = windowData.uniqueCommitAuthors
    return typeof v === 'number' ? v : null
  }
  if (window === 90) return num(result.uniqueCommitAuthors90d)
  return null
}

function PercentileBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-400 dark:text-slate-500">N/A</span>
  const color =
    value >= 75 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    : value >= 50 ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300'
    : value >= 25 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {value}th
    </span>
  )
}

interface ColHeader {
  key: SortKey
  label: string
  group?: string
  align?: 'left' | 'right'
}

const COLUMNS: ColHeader[] = [
  { key: 'repo',             label: 'Repository',    align: 'left' },
  { key: 'stars',            label: 'Stars',         group: 'Reach',      align: 'right' },
  { key: 'forks',            label: 'Forks',         group: 'Reach',      align: 'right' },
  { key: 'issuesOpen',       label: 'Open Issues',   group: 'Attention',  align: 'right' },
  { key: 'prsOpened90d',     label: 'PRs (90d)',     group: 'Attention',  align: 'right' },
  { key: 'authors',          label: 'Authors',       group: 'Engagement', align: 'right' },
  { key: 'totalContributors',label: 'Contributors',  group: 'Engagement', align: 'right' },
  { key: 'percentile',       label: 'Health',        align: 'right' },
]

interface Row {
  result: AnalysisResult
  stars: number | null
  forks: number | null
  issuesOpen: number | null
  prsOpened90d: number | null
  totalContributors: number | null
  percentile: number | null
}

function buildRows(results: AnalysisResult[]): Row[] {
  return results.map((r) => ({
    result: r,
    stars: num(r.stars),
    forks: num(r.forks),
    issuesOpen: num(r.issuesOpen),
    prsOpened90d: num(r.prsOpened90d),
    totalContributors: num(r.totalContributors),
    percentile: getHealthScore(r).percentile,
  }))
}

interface RepoSummaryTableProps {
  results: AnalysisResult[]
}

export function RepoSummaryTable({ results }: RepoSummaryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('percentile')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [nameFilter, setNameFilter] = useState('')
  const [minHealth, setMinHealth] = useState(0)
  const [minStars, setMinStars] = useState(0)
  const [activeOnly, setActiveOnly] = useState(false)
  const [activeWindow, setActiveWindow] = useState<ContributorWindowDays>(90)

  const rows = useMemo(() => buildRows(results), [results])
  const maxStars = useMemo(() => Math.max(0, ...rows.map((r) => r.stars).filter((s): s is number => s !== null)), [rows])

  const filtered = useMemo(() => {
    const q = nameFilter.toLowerCase()
    return rows.filter((r) => {
      if (q && !r.result.repo.toLowerCase().includes(q)) return false
      if (activeOnly) {
        const authors = getAuthors(r.result, activeWindow)
        if (authors !== null && authors === 0) return false
      }
      if (minStars > 0 && r.stars !== null && r.stars < minStars) return false
      if (minHealth > 0 && r.percentile !== null && r.percentile < minHealth) return false
      return true
    })
  }, [rows, nameFilter, minHealth, minStars, activeOnly, activeWindow])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'repo') {
        cmp = a.result.repo.localeCompare(b.result.repo)
      } else if (sortKey === 'percentile') {
        const av = a.percentile
        const bv = b.percentile
        if (av === null && bv === null) return 0
        if (av === null) return 1
        if (bv === null) return -1
        cmp = av - bv
      } else if (sortKey === 'authors') {
        const av = getAuthors(a.result, activeWindow)
        const bv = getAuthors(b.result, activeWindow)
        if (av === null && bv === null) return 0
        if (av === null) return 1
        if (bv === null) return -1
        cmp = av - bv
      } else {
        const av = a[sortKey as keyof Row] as number | null
        const bv = b[sortKey as keyof Row] as number | null
        if (av === null && bv === null) return 0
        if (av === null) return 1
        if (bv === null) return -1
        cmp = (av as number) - (bv as number)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir, activeWindow])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const groups: { label: string; span: number }[] = []
  for (const col of COLUMNS) {
    if (!col.group) {
      groups.push({ label: '', span: 1 })
    } else if (groups.at(-1)?.label === col.group) {
      groups[groups.length - 1].span++
    } else {
      groups.push({ label: col.group, span: 1 })
    }
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 justify-between">
        <input
          type="search"
          placeholder="Filter by name…"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
        />

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Min health</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minHealth}
            onChange={(e) => setMinHealth(Number(e.target.value))}
            className="w-28 accent-sky-600"
          />
          <span className="w-10 text-sm tabular-nums text-slate-700 dark:text-slate-300">
            {minHealth > 0 ? `${minHealth}th` : 'Any'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Min stars</span>
          <input
            type="range"
            min={0}
            max={maxStars}
            step={Math.max(1, Math.floor(maxStars / 100))}
            value={minStars}
            onChange={(e) => setMinStars(Number(e.target.value))}
            className="w-28 accent-sky-600"
          />
          <span className="w-12 text-sm tabular-nums text-slate-700 dark:text-slate-300">
            {minStars > 0 ? `≥${minStars}` : 'Any'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-sky-600"
            />
            Active only
            <span className="group relative -top-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-slate-400 dark:text-slate-500">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
              </svg>
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 w-56 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
                Repos with at least one commit author in the last {activeWindow} days. Repos with unavailable data are included.
                <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
              </span>
            </span>
          </label>
          <select
            value={activeWindow}
            onChange={(e) => setActiveWindow(Number(e.target.value) as ContributorWindowDays)}
            className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-600 shadow-sm focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Active window"
          >
            {CONTRIBUTOR_WINDOW_DAYS.map((d) => (
              <option key={d} value={d}>{d}d</option>
            ))}
          </select>
        </div>

        {(nameFilter || minHealth > 0 || minStars > 0 || activeOnly) && (
          <span className="ml-auto text-sm tabular-nums text-slate-500 dark:text-slate-400">
            {filtered.length} of {results.length} shown
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {groups.map((g, i) => (
                <th
                  key={i}
                  colSpan={g.span}
                  className="px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  {g.label}
                </th>
              ))}
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`cursor-pointer select-none px-3 py-2 font-medium text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-sky-300 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.key === 'authors' ? `Authors (${activeWindow}d)` : col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 text-sky-600 dark:text-sky-400">
                      {sortDir === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row.result.repo}
                className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 ${
                  i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-900/30'
                }`}
              >
                <td className="max-w-xs truncate px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">
                  <a
                    href={`https://github.com/${row.result.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-sky-700 hover:underline dark:hover:text-sky-300"
                  >
                    {row.result.repo}
                  </a>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">{fmt(row.stars)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">{fmt(row.forks)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">{fmt(row.issuesOpen)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">{fmt(row.prsOpened90d)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">{fmt(getAuthors(row.result, activeWindow))}</td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">{fmt(row.totalContributors)}</td>
                <td className="px-3 py-2 text-right">
                  <PercentileBadge value={row.percentile} />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  No repositories match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
