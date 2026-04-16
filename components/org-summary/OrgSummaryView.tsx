'use client'

import type {
  OrgSummaryViewModel,
} from '@/lib/org-aggregation/types'
import { PANEL_BUCKETS, isRealPanel, renderPanel } from './panels/registry'
import { PerRepoStatusList } from './PerRepoStatusList'
import { RunStatusHeader } from './RunStatusHeader'

interface Props {
  org: string
  view: OrgSummaryViewModel
  onCancel?: () => void
  onPause?: () => void
  onResume?: () => void
  onRetry?: (repo: string) => void
  notificationToggle?: React.ReactNode
  // When false, hides the RunStatusHeader and PerRepoStatusList
  // (repo-level tracking). Used in the main app where Repositories
  // tab owns per-repo progress. Dev preview keeps it visible.
  showRunStatus?: boolean
}

export function OrgSummaryView({ org, view, onCancel, onPause, onResume, onRetry, notificationToggle, showRunStatus = true }: Props) {
  return (
    <div className="space-y-6">
      {showRunStatus ? (
        <RunStatusHeader
          org={org}
          header={view.status}
          onCancel={onCancel}
          onPause={onPause}
          onResume={onResume}
          notificationToggle={notificationToggle}
        />
      ) : null}

      {PANEL_BUCKETS.map((bucket) => {
        if (bucket.id === 'repos') return null
        if (bucket.id === 'recommendations') return null

        const bucketPanels = bucket.panels
          .map((panelId) => ({ panelId, panel: view.panels[panelId] }))
          .filter((x): x is { panelId: typeof x.panelId; panel: NonNullable<typeof x.panel> } =>
            Boolean(x.panel) && (showRunStatus || isRealPanel(x.panelId))
          )

        if (bucketPanels.length === 0) return null

        return (
          <section key={bucket.id} aria-label={bucket.label}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {bucket.label}
            </h2>
            <div className="space-y-3">
              {bucketPanels.map(({ panelId, panel }) => (
                <div key={panelId}>{renderPanel(panelId, panel)}</div>
              ))}
            </div>
          </section>
        )
      })}

      {showRunStatus ? (
        <>
          <PerRepoStatusList entries={view.perRepoStatusList} onRetry={onRetry} />
          {view.missingData.length > 0 ? (
            <section
              aria-label="Missing data"
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Missing data ({view.missingData.length})
              </h3>
              <ul role="list" className="divide-y divide-slate-200 dark:divide-slate-700">
                {view.missingData.map((m) => (
                  <li key={`${m.repo}:${m.signalKey}`} className="py-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{m.repo}</span>{' '}
                    <span className="text-slate-500 dark:text-slate-400">· {m.signalKey}</span>{' '}
                    <span className="text-slate-500 dark:text-slate-400">— {m.reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
