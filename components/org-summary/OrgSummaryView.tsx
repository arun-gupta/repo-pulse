'use client'

import { useState } from 'react'
import type {
  OrgSummaryViewModel,
} from '@/lib/org-aggregation/types'
import { PANEL_BUCKETS, renderPanel, type PanelBucketId } from './panels/registry'
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
}

export function OrgSummaryView({ org, view, onCancel, onPause, onResume, onRetry, notificationToggle }: Props) {
  const bucketsWithContent = PANEL_BUCKETS.map((bucket) => {
    const bucketPanels = bucket.panels
      .map((panelId) => ({ panelId, panel: view.panels[panelId] }))
      .filter((x): x is { panelId: typeof x.panelId; panel: NonNullable<typeof x.panel> } => Boolean(x.panel))
    return { bucket, bucketPanels }
  })

  const [activeBucket, setActiveBucket] = useState<PanelBucketId>(
    bucketsWithContent[0]?.bucket.id ?? 'overview',
  )
  const active = bucketsWithContent.find((b) => b.bucket.id === activeBucket) ?? bucketsWithContent[0]

  return (
    <div className="space-y-4">
      <RunStatusHeader
        org={org}
        header={view.status}
        onCancel={onCancel}
        onPause={onPause}
        onResume={onResume}
        notificationToggle={notificationToggle}
      />

      {bucketsWithContent.length > 0 ? (
        <div>
          <div
            role="tablist"
            aria-label="Org summary sections"
            className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2 dark:border-slate-700"
          >
            {bucketsWithContent.map(({ bucket }) => {
              const isActive = bucket.id === active?.bucket.id
              return (
                <button
                  key={bucket.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  data-bucket-id={bucket.id}
                  title={bucket.description}
                  onClick={() => setActiveBucket(bucket.id)}
                  className={
                    isActive
                      ? 'whitespace-nowrap rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }
                >
                  {bucket.label}
                </button>
              )
            })}
          </div>
          {active ? (
            <section
              role="tabpanel"
              aria-label={active.bucket.label}
              data-bucket-id={active.bucket.id}
              className="mt-4 space-y-3"
            >
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {active.bucket.description}
              </p>
              {active.bucket.id === 'repos' ? (
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
              ) : active.bucketPanels.length > 0 ? (
                active.bucketPanels.map(({ panelId, panel }) => (
                  <div key={panelId}>{renderPanel(panelId, panel)}</div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  {active.bucket.id === 'recommendations'
                    ? 'Recommendations will appear here once org-wide scoring lands.'
                    : 'No panels yet for this section.'}
                </div>
              )}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
