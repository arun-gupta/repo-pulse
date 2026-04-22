import type { AspirantField, AspirantReadinessResult } from '@/lib/cncf-sandbox/types'

interface CNCFReadinessTabProps {
  aspirantResult: AspirantReadinessResult
  onNavigateToTab?: (tab: string) => void
}

const STATUS_ICON: Record<string, string> = {
  ready: '✅',
  partial: '⚠️',
  missing: '❌',
  'human-only': '📋',
}

function FieldRow({ field, onNavigateToTab }: { field: AspirantField; onNavigateToTab?: (tab: string) => void }) {
  const icon = STATUS_ICON[field.status] ?? '—'
  const pointImpact = field.weight > 0 ? `+${field.weight} pts if resolved` : null

  return (
    <li className="flex flex-col gap-1 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">{icon}</span>
          <span className="font-medium text-slate-800 dark:text-slate-100">{field.label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pointImpact && field.status !== 'ready' ? (
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">{pointImpact}</span>
          ) : null}
          {field.homeTab && onNavigateToTab ? (
            <button
              type="button"
              onClick={() => onNavigateToTab(field.homeTab!)}
              className="text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              View
            </button>
          ) : null}
        </div>
      </div>
      {field.evidence ? (
        <p className="text-xs text-slate-600 dark:text-slate-400">{field.evidence}</p>
      ) : null}
      {field.remediationHint && field.status !== 'ready' ? (
        <p className="text-xs text-slate-700 dark:text-slate-300">{field.remediationHint}</p>
      ) : null}
    </li>
  )
}

function SandboxApplicationBanner({ application }: { application: import('@/lib/cncf-sandbox/types').SandboxApplicationIssue | null }) {
  if (application === null) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
        <span className="mt-0.5 text-base" aria-hidden="true">📋</span>
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">No application found in cncf/sandbox</p>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            When ready, file an issue at{' '}
            <a href="https://github.com/cncf/sandbox/issues/new/choose" target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400">
              github.com/cncf/sandbox
            </a>{' '}
            to start the review process.
          </p>
        </div>
      </div>
    )
  }

  const isOpen = application.state === 'OPEN'
  const date = new Date(application.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${isOpen ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' : 'border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800'}`}>
      <span className="mt-0.5 text-base" aria-hidden="true">{isOpen ? '🟢' : '⚫'}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
          Application {isOpen ? 'filed — under review' : 'filed — closed'} &mdash;{' '}
          <a href={application.issueUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400">
            #{application.issueNumber}
          </a>
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-400">
          {application.title} &middot; filed {date}
        </p>
      </div>
    </div>
  )
}

export function CNCFReadinessTab({ aspirantResult, onNavigateToTab }: CNCFReadinessTabProps) {
  const { readinessScore, readyCount, totalAutoCheckable, autoFields, humanOnlyFields, tagRecommendation, sandboxApplication } = aspirantResult

  const readyFields = autoFields.filter((f) => f.status === 'ready')
  const needsWorkFields = [...autoFields.filter((f) => f.status !== 'ready')].reverse()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Targeting: CNCF Sandbox
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          CNCF Readiness Score:{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{readinessScore} / 100</span>
          {' — '}
          {readyCount} of {totalAutoCheckable} auto-checkable fields ready
        </p>
      </div>

      <SandboxApplicationBanner application={sandboxApplication} />

      {needsWorkFields.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Needs work before submitting
          </h3>
          <ul className="space-y-2">
            {needsWorkFields.map((field) => (
              <FieldRow key={field.id} field={field} onNavigateToTab={onNavigateToTab} />
            ))}
          </ul>
        </section>
      ) : null}

      {readyFields.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Ready to submit
          </h3>
          <ul className="space-y-2">
            {readyFields.map((field) => (
              <FieldRow key={field.id} field={field} onNavigateToTab={onNavigateToTab} />
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Needs your input
        </h3>
        <ul className="space-y-2">
          {tagRecommendation.primaryTag ? (
            <li className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Recommended TAG: <span className="font-semibold">{tagRecommendation.primaryTag}</span>
              </p>
              {tagRecommendation.matchedSignals.length > 0 ? (
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                  Matched signals: {tagRecommendation.matchedSignals.join(', ')}
                </p>
              ) : null}
            </li>
          ) : tagRecommendation.fallbackNote ? (
            <li className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm text-slate-700 dark:text-slate-300">{tagRecommendation.fallbackNote}</p>
            </li>
          ) : null}
          {humanOnlyFields.map((field) => (
            <li key={field.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="font-medium text-slate-800 dark:text-slate-100">📋 {field.label}</p>
              {field.explanatoryNote ? (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{field.explanatoryNote}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
