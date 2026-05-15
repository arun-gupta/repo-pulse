'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { OrgInventorySummary } from '@/components/org-inventory/OrgInventorySummary'
import { RepoSummaryTable } from '@/components/repo-summary/RepoSummaryTable'
import { UniversityChatPanel } from './UniversityChatPanel'
import { UniversityScoreDistribution } from './UniversityScoreDistribution'
import { UniversityComparison } from './UniversityComparison'
import { UniversityCardRadar } from './UniversityCardRadar'
import type { AnalysisResult, AnalyzeResponse, RepositoryFetchFailure } from '@/lib/analyzer/analysis-result'
import { buildUniversitySummary } from '@/lib/university/summary'
import type { UniversitySummary } from '@/lib/university/university-summary'

const RAW_BASE = 'https://raw.githubusercontent.com/arun-gupta/repofinder/repo-pulse-integration/exports/universities'

const UNIVERSITY_LOGOS: Record<string, string> = {
  ucb: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Seal_of_University_of_California%2C_Berkeley.svg',
  ucd: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/The_University_of_California_Davis.svg',
  ucsc: 'https://upload.wikimedia.org/wikipedia/commons/5/53/The_University_of_California_1868_UCSC.svg',
  stanford: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Seal_of_Leland_Stanford_Junior_University.svg',
  mit: 'https://upload.wikimedia.org/wikipedia/en/4/44/MIT_Seal.svg',
}

type SortOption = 'name' | 'repos' | 'updated'

function sortKey(university: string): string {
  return university
    .replace(/^University of California,\s+/i, '')
    .replace(/^University of\s+/i, '')
    .replace(/^The\s+/i, '')
    .toLowerCase()
}

function applySort(entries: ManifestEntry[], sort: SortOption): ManifestEntry[] {
  return [...entries].sort((a, b) => {
    if (sort === 'name') return sortKey(a.university).localeCompare(sortKey(b.university))
    if (sort === 'repos') return b.analyzedRepos - a.analyzedRepos
    if (sort === 'updated') return b.generatedAt.localeCompare(a.generatedAt)
    return 0
  })
}

interface ManifestEntry {
  slug: string
  university: string
  totalRepos: number
  analyzedRepos: number
  generatedAt: string
  discoveryThreshold?: number
}

interface UniversityFixture extends AnalyzeResponse {
  university: string
  totalRepos: number
  generatedAt: string
}

interface Selected {
  entry: ManifestEntry
  results: AnalysisResult[]
  unscoredRepos: RepositoryFetchFailure[]
  generatedAt: string
}

export function UniversityBrowser() {
  const searchParams = useSearchParams()
  const [manifest, setManifest] = useState<ManifestEntry[] | null>(null)
  const [manifestError, setManifestError] = useState(false)
  const [summaries, setSummaries] = useState<UniversitySummary[]>([])
  const [selected, setSelected] = useState<Selected | null>(null)
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const autoSelectDone = useRef(false)

  useEffect(() => {
    fetch(`${RAW_BASE}/manifest.json`)
      .then((r) => r.json())
      .then((data: ManifestEntry[]) => {
        setManifest(data)
        // Fetch all summaries in parallel for the comparison view and card radars
        Promise.all(
          data.map((e) =>
            fetch(`${RAW_BASE}/${e.slug}-summary.json`)
              .then((r) => r.ok ? r.json() as Promise<UniversitySummary> : null)
              .catch(() => null)
          )
        ).then((results) => setSummaries(results.filter((s): s is UniversitySummary => s !== null)))
      })
      .catch(() => setManifestError(true))
  }, [])

  // Auto-select university from ?u= param on initial manifest load
  useEffect(() => {
    if (!manifest || autoSelectDone.current) return
    const slug = searchParams.get('u')
    if (!slug) return
    const entry = manifest.find((e) => e.slug === slug)
    if (entry) {
      autoSelectDone.current = true
      void handleSelect(entry)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest])

  async function handleSelect(entry: ManifestEntry) {
    setLoadingSlug(entry.slug)
    setDetailError(null)
    const params = new URLSearchParams(window.location.search)
    params.set('mode', 'university')
    params.set('u', entry.slug)
    window.history.replaceState(null, '', `/?${params.toString()}`)
    try {
      const res = await fetch(`${RAW_BASE}/${entry.slug}-scored.json`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const fixture: UniversityFixture = await res.json()
      // Deduplicate failures by repo name (keep last), then exclude repos that were
      // successfully scored — earlier runs may have failed before a later run succeeded.
      const scoredSet = new Set(fixture.results.map((r) => r.repo.toLowerCase()))
      const dedupedFailures = new Map<string, RepositoryFetchFailure>()
      for (const f of (fixture.failures ?? [])) {
        dedupedFailures.set(f.repo.toLowerCase(), f)
      }
      const unscoredRepos = [...dedupedFailures.values()].filter((f) => !scoredSet.has(f.repo.toLowerCase()))
      setSelected({ entry, results: fixture.results, unscoredRepos, generatedAt: fixture.generatedAt })
    } catch {
      setDetailError(`Failed to load data for ${entry.university}.`)
    } finally {
      setLoadingSlug(null)
    }
  }

  function handleBack() {
    const params = new URLSearchParams(window.location.search)
    params.delete('u')
    window.history.replaceState(null, '', `/?${params.toString()}`)
    setSelected(null)
  }

  if (manifestError) {
    return <p className="text-sm text-red-600 dark:text-red-400">Failed to load university list.</p>
  }

  if (!manifest) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading universities…</p>
  }

  if (selected) {
    const summary = buildUniversitySummary(selected.results)
    const scored = new Date(selected.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    return (
      <div className="space-y-6 pb-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={handleBack}
            className="hover:text-sky-700 dark:hover:text-sky-300"
          >
            Universities
          </button>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 dark:text-slate-100">{selected.entry.university}</span>
        </nav>
        <header>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {UNIVERSITY_LOGOS[selected.entry.slug] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={UNIVERSITY_LOGOS[selected.entry.slug]}
                  alt=""
                  className="h-12 w-12 rounded-full object-contain flex-shrink-0 bg-white"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{selected.entry.university}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selected.results.length} of {selected.entry.totalRepos} repositories scored · scored {scored}
                  {selected.unscoredRepos.length > 0 && (
                    <span className="ml-1 text-slate-400 dark:text-slate-500">
                      · {selected.unscoredRepos.length.toLocaleString()} could not be scored
                    </span>
                  )}
                </p>
                {selected.entry.discoveryThreshold !== undefined && (
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    Affiliation threshold: {selected.entry.discoveryThreshold}
                  </p>
                )}
              </div>
            </div>
            {(() => {
              const s = summaries.find((s) => s.slug === selected.entry.slug)
              return s ? (
                <div className="flex-shrink-0">
                  <div className="w-28 h-28">
                    <UniversityCardRadar summary={s} />
                  </div>
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-1">Health profile</p>
                </div>
              ) : null
            })()}
          </div>
        </header>
        <UniversityScoreDistribution results={selected.results} />
        <OrgInventorySummary summary={summary} />
        <RepoSummaryTable results={selected.results} />
        {selected.unscoredRepos.length > 0 && (
          <details className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 select-none list-none flex items-center justify-between">
              <span>{selected.unscoredRepos.length.toLocaleString()} unscored repositories</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">click to expand</span>
            </summary>
            <div className="px-6 pb-4 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2 pr-4 font-medium text-slate-500 dark:text-slate-400">Repository</th>
                    <th className="py-2 font-medium text-slate-500 dark:text-slate-400">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.unscoredRepos.map((f) => (
                    <tr key={f.repo} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-1.5 pr-4 font-mono">
                        <a
                          href={`https://github.com/${f.repo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-700 hover:underline dark:text-sky-400"
                        >
                          {f.repo}
                        </a>
                      </td>
                      <td className="py-1.5 text-slate-500 dark:text-slate-400">{f.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
        <UniversityChatPanel university={selected.entry.university} results={selected.results} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600 dark:text-slate-300">
        <p>
          OSS health scores for GitHub repositories affiliated with universities, sourced from{' '}
          <a
            href="https://github.com/arun-gupta/repofinder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-700 hover:underline dark:text-sky-400"
          >
            repofinder
          </a>
          . Data is pre-scored and refreshed periodically.
        </p>
        <p className="mt-1">
          <a
            href="https://github.com/arun-gupta/repo-pulse/blob/main/docs/add-university.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-700 hover:underline dark:text-sky-400"
          >
            Add your university →
          </a>
        </p>
      </div>
      {summaries.length > 1 && (
        <details open className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 select-none list-none flex items-center justify-between">
            <span>OSS Health Overview</span>
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500">click to collapse</span>
          </summary>
          <div className="px-6 pb-6">
            <UniversityComparison summaries={summaries} />
          </div>
        </details>
      )}
      {detailError && (
        <p className="text-sm text-red-600 dark:text-red-400">{detailError}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        <label htmlFor="uni-sort" className="text-xs text-slate-500 dark:text-slate-400">Sort by</label>
        <select
          id="uni-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-400"
        >
          <option value="name">Name (A–Z)</option>
          <option value="repos">Repos scored</option>
          <option value="updated">Last updated</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {applySort(manifest, sortBy).map((u) => (
          <button
            key={u.slug}
            type="button"
            onClick={() => handleSelect(u)}
            disabled={loadingSlug !== null}
            className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-left transition hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                  {UNIVERSITY_LOGOS[u.slug] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={UNIVERSITY_LOGOS[u.slug]}
                      alt=""
                      className="h-10 w-10 rounded-full object-contain flex-shrink-0 bg-white"
                    />
                  )}
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-sky-700 dark:text-slate-100 dark:group-hover:text-sky-300">
                    {loadingSlug === u.slug ? 'Loading…' : u.university}
                  </h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {u.analyzedRepos.toLocaleString()} of {u.totalRepos.toLocaleString()} repositories scored
                  {u.analyzedRepos < u.totalRepos && (
                    <span className="ml-1 text-slate-400 dark:text-slate-500">
                      · {(u.totalRepos - u.analyzedRepos).toLocaleString()} could not be scored (empty, deleted, or private)
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {u.discoveryThreshold !== undefined && <>Affiliation threshold: {u.discoveryThreshold} · </>}
                  Data from {new Date(u.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                {(() => {
                  const s = summaries.find((s) => s.slug === u.slug)
                  if (!s) return null
                  const { high, medium, low } = s.scoreBands
                  return (
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded ${
                        s.medianScore >= 50 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        s.medianScore >= 33 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      }`}>{s.medianScore}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden flex gap-px">
                        <div className="bg-red-300 dark:bg-red-700 rounded-l-full" style={{ width: `${low * 100}%` }} />
                        <div className="bg-amber-300 dark:bg-amber-600" style={{ width: `${medium * 100}%` }} />
                        <div className="bg-emerald-400 dark:bg-emerald-600 rounded-r-full" style={{ width: `${high * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">median score</span>
                    </div>
                  )
                })()}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
