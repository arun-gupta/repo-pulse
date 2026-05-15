'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { OrgInventorySummary } from '@/components/org-inventory/OrgInventorySummary'
import { RepoSummaryTable } from '@/components/repo-summary/RepoSummaryTable'
import { UniversityChatPanel } from './UniversityChatPanel'
import { UniversityScoreDistribution } from './UniversityScoreDistribution'
import type { AnalysisResult, AnalyzeResponse } from '@/lib/analyzer/analysis-result'
import { buildUniversitySummary } from '@/lib/university/summary'

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
  generatedAt: string
}

export function UniversityBrowser() {
  const searchParams = useSearchParams()
  const [manifest, setManifest] = useState<ManifestEntry[] | null>(null)
  const [manifestError, setManifestError] = useState(false)
  const [selected, setSelected] = useState<Selected | null>(null)
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const autoSelectDone = useRef(false)

  useEffect(() => {
    fetch(`${RAW_BASE}/manifest.json`)
      .then((r) => r.json())
      .then((data: ManifestEntry[]) => setManifest(data))
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
      setSelected({ entry, results: fixture.results, generatedAt: fixture.generatedAt })
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
                {selected.results.length < selected.entry.totalRepos && (
                  <span className="ml-1 text-slate-400 dark:text-slate-500">
                    · {(selected.entry.totalRepos - selected.results.length).toLocaleString()} could not be scored (empty, deleted, or private)
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
        </header>
        <UniversityScoreDistribution results={selected.results} />
        <OrgInventorySummary summary={summary} />
        <RepoSummaryTable results={selected.results} />
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
          </button>
        ))}
      </div>
    </div>
  )
}
