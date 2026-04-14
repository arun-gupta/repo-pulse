'use client'

import { TagPill } from '@/components/tags/TagPill'
import type { AnalysisResult } from '@/lib/analyzer/analysis-result'

interface DiscussionsCardProps {
  result: AnalysisResult
  activeTag: string | null
  onTagClick: (tag: string) => void
}

/**
 * Activity-tab card for the GitHub Discussions community signal (P2-F05 / #70).
 *
 * Three visual states per `quickstart.md` Step 1 and spec FR-012:
 *   1. Enabled with activity    → "Enabled · N in last Wd"
 *   2. Enabled with zero count  → "Enabled · no activity yet"
 *   3. Not enabled              → "Not enabled"
 *
 * When `hasDiscussionsEnabled === 'unavailable'` (undetermined), the card
 * is hidden and the signal belongs in the missing-data panel. Caller is
 * responsible for that gating — this component assumes a known state.
 */
export function DiscussionsCard({ result, activeTag, onTagClick }: DiscussionsCardProps) {
  if (result.hasDiscussionsEnabled === undefined || result.hasDiscussionsEnabled === 'unavailable') {
    return null
  }

  const enabled = result.hasDiscussionsEnabled === true
  const count = typeof result.discussionsCountWindow === 'number' ? result.discussionsCountWindow : null
  const windowDays = typeof result.discussionsWindowDays === 'number' ? result.discussionsWindowDays : null

  let statusLine: string
  if (!enabled) {
    statusLine = 'Not enabled'
  } else if (count !== null && count > 0 && windowDays !== null) {
    statusLine = `Enabled · ${count} in last ${windowDays}d`
  } else if (count === 0) {
    statusLine = 'Enabled · no activity yet'
  } else {
    statusLine = 'Enabled'
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Discussions</p>
        <TagPill tag="community" active={activeTag === 'community'} onClick={onTagClick} />
      </div>
      <p className="mt-1 text-sm text-slate-700">{statusLine}</p>
      <p className="mt-2 text-xs text-slate-500">
        GitHub Discussions is a forum for long-form community conversation. Presence and recent activity here signal an engaged community.
      </p>
    </div>
  )
}
