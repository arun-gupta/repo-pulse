'use client'

import { useEffect, useMemo, useState } from 'react'
import { getCalibrationMeta } from '@/lib/scoring/config-loader'
import { resultTabs } from '@/lib/results-shell/tabs'
import type { ResultTabId } from '@/specs/006-results-shell/contracts/results-shell-props'
import type { ResultTabDefinition } from '@/specs/006-results-shell/contracts/results-shell-props'
import { ElevatedScopeBanner } from '@/components/auth/ElevatedScopeBanner'
import type { TabMatchCounts } from '@/lib/search/types'
import { useHighlightMatches } from '@/components/search/useHighlightMatches'
import { AppHeader } from './AppHeader'
import { ResultsTabs } from './ResultsTabs'

interface ResultsShellProps {
  analysisPanel: React.ReactNode
  slots: Partial<Record<ResultTabId, React.ReactNode>>
  hideTabs?: boolean
  tabs?: ResultTabDefinition[]
  initialActiveTab?: ResultTabId
  resetKey?: number
  toolbar?: React.ReactNode
  onReset?: () => void
  searchQuery?: string
  onDomMatchCounts?: (counts: { domMatchCounts: TabMatchCounts; domTotalMatches: number; domMatchedTabCount: number }) => void
  tagMatchCounts?: TabMatchCounts
  chatPanel?: React.ReactNode
}

export function ResultsShell({
  analysisPanel,
  slots,
  hideTabs = false,
  tabs = resultTabs,
  initialActiveTab = 'overview',
  resetKey,
  toolbar,
  onReset,
  searchQuery = '',
  onDomMatchCounts,
  tagMatchCounts,
  chatPanel,
}: ResultsShellProps) {
  const [activeTab, setActiveTab] = useState<ResultTabId>(initialActiveTab)

  const calibrationMeta = getCalibrationMeta()
  const isStale = useMemo(() => {
    const generated = new Date(calibrationMeta.generated)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    return generated < sixMonthsAgo
  }, [calibrationMeta.generated])

  useEffect(() => {
    setActiveTab(initialActiveTab)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const effectiveTabs = useMemo(() => {
    let result = tabs
    if (slots['cncf-candidacy']) {
      const hasCandidacyTab = result.some((t) => t.id === 'cncf-candidacy')
      if (!hasCandidacyTab) {
        result = [
          ...result,
          { id: 'cncf-candidacy' as const, label: 'CNCF Candidacy', status: 'implemented' as const, description: 'CNCF Sandbox candidacy scan ranked by readiness.' },
        ]
      }
    }
    return result
  }, [tabs, slots])

  const currentActiveTab = useMemo(
    () => (effectiveTabs.some((tab) => tab.id === activeTab) ? activeTab : effectiveTabs[0]?.id ?? 'overview'),
    [activeTab, effectiveTabs],
  )

  const { containerRef, domMatchCounts, domTotalMatches, domMatchedTabCount } = useHighlightMatches(searchQuery, currentActiveTab)


  useEffect(() => {
    onDomMatchCounts?.({ domMatchCounts, domTotalMatches, domMatchedTabCount })
  }, [domMatchCounts, domTotalMatches, domMatchedTabCount, onDomMatchCounts])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 dark:bg-slate-800/60">
      <ElevatedScopeBanner />
      <AppHeader onLogoClick={onReset} />

      <div className={`mx-auto max-w-5xl px-4 py-6${chatPanel ? ' pb-16' : ''}`}>
        {isStale ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800/60" role="alert">
            Scores calibrated against GitHub data from {calibrationMeta.generated}. A more recent calibration is recommended.
          </div>
        ) : null}
        <section className="space-y-6">
          <section aria-label="Analysis panel" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            {analysisPanel}
          </section>

          <section aria-label="Result workspace" className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            {toolbar ? <div className="mb-4">{toolbar}</div> : null}
            {hideTabs ? (
              <div ref={containerRef}>{slots.overview}</div>
            ) : (
              <>
                <ResultsTabs
                  tabs={effectiveTabs}
                  activeTab={currentActiveTab}
                  onChange={setActiveTab}
                  matchCounts={searchQuery.trim() ? domMatchCounts : tagMatchCounts}
                />
                <div className="mt-6" ref={containerRef}>
                  {(Object.entries(slots) as [ResultTabId, React.ReactNode][]).map(([tabId, content]) => (
                    <div key={tabId} data-tab-content={tabId} style={{ display: currentActiveTab === tabId ? 'contents' : 'none' }}>
                      {content}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </section>
      </div>
      {chatPanel}
    </main>
  )
}
