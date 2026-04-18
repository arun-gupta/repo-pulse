'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ResultsShell } from '@/components/app-shell/ResultsShell'
import { OrgInventoryView } from '@/components/org-inventory/OrgInventoryView'
import { OrgBucketContent } from '@/components/org-summary/OrgBucketContent'
import { ReportSearchBar } from '@/components/search/ReportSearchBar'
import { SearchProvider } from '@/components/search/SearchContext'
import type { TabMatchCounts } from '@/lib/search/types'
import type { OrgInventoryResponse } from '@/lib/analyzer/org-inventory'
import type { ResultTabDefinition } from '@/specs/006-results-shell/contracts/results-shell-props'

interface DemoOrganizationClientProps {
  response: OrgInventoryResponse
}

const DEMO_ORG_TABS: ResultTabDefinition[] = [
  {
    id: 'overview',
    label: 'Overview',
    status: 'implemented',
    description: 'Organization inventory summary and public repository metadata.',
  },
  {
    id: 'governance',
    label: 'Governance',
    status: 'implemented',
    description: 'Org-level security signals available without analyzing individual repos — 2FA enforcement, admin activity.',
  },
]

export function DemoOrganizationClient({ response }: DemoOrganizationClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [domTotalMatches, setDomTotalMatches] = useState(0)
  const [domMatchedTabCount, setDomMatchedTabCount] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      if (!searchQuery) {
        setDomTotalMatches(0)
        setDomMatchedTabCount(0)
      }
    }, searchQuery ? 300 : 0)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const handleDomMatchCounts = useCallback(
    (counts: { domMatchCounts: TabMatchCounts; domTotalMatches: number; domMatchedTabCount: number }) => {
      setDomTotalMatches(counts.domTotalMatches)
      setDomMatchedTabCount(counts.domMatchedTabCount)
    },
    [],
  )

  const emptyPanel = (
    <p className="text-sm text-slate-500 dark:text-slate-400">
      Not available in demo mode.
    </p>
  )

  return (
    <SearchProvider query={debouncedQuery}>
      <ResultsShell
        initialActiveTab="overview"
        analysisPanel={<DemoOrgAnalysisPanel org={response.org} />}
        tabs={DEMO_ORG_TABS}
        searchQuery={debouncedQuery}
        onDomMatchCounts={handleDomMatchCounts}
        toolbar={
          <ReportSearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            totalMatches={domTotalMatches}
            matchedTabCount={domMatchedTabCount}
          />
        }
        overview={
          <OrgInventoryView
            org={response.org}
            summary={response.summary}
            results={response.results}
            rateLimit={response.rateLimit}
            onAnalyzeRepo={() => {
              // No-op: analyzing fresh repositories requires sign-in.
            }}
            onAnalyzeSelected={() => {
              // No-op: analyzing fresh repositories requires sign-in.
            }}
          />
        }
        governance={<OrgBucketContent bucketId="governance" view={null} org={response.org} />}
        contributors={emptyPanel}
        activity={emptyPanel}
        responsiveness={emptyPanel}
        documentation={emptyPanel}
        security={emptyPanel}
        recommendations={emptyPanel}
        comparison={emptyPanel}
      />
    </SearchProvider>
  )
}

function DemoOrgAnalysisPanel({ org }: { org: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Pre-analyzed org inventory
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-200">
          Browse the <span className="font-mono">{org}</span> organization — {' '}
          {/* 78-row inventory is pre-fetched */}
          inventory, filters, and sorting all work against the fixture.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled
          title="Sign in with GitHub to analyze organization repositories"
          aria-label="Analyze is disabled in demo mode — sign in with GitHub to run a live analysis"
          className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
        >
          Analyze (demo)
        </button>
        <Link
          href="/"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
        >
          Sign in to analyze →
        </Link>
      </div>
    </div>
  )
}
