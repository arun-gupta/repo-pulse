'use client'

import { CNCFReadinessTab } from '@/components/cncf-readiness/CNCFReadinessTab'
import { CNCFCandidacyPanel } from '@/components/cncf-candidacy/CNCFCandidacyPanel'
import type { AnalyzeResponse } from '@/lib/analyzer/analysis-result'
import type { OrgInventoryResponse } from '@/lib/analyzer/org-inventory'
import type { SkippedIssue } from '@/lib/foundation/fetch-board-repos'

export type FoundationResult =
  | { kind: 'repos'; results: AnalyzeResponse }
  | { kind: 'org'; inventory: OrgInventoryResponse }
  | { kind: 'projects-board'; url: string; results: AnalyzeResponse; skipped: SkippedIssue[] }

interface FoundationResultsViewProps {
  result: FoundationResult | null
  error: string | null
}

export function FoundationResultsView({ result, error }: FoundationResultsViewProps) {

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-600 dark:text-red-300">
        {error}
      </p>
    )
  }

  if (!result) return null

  if (result.kind === 'repos') {
    return (
      <div className="space-y-6">
        {result.results.failures.length > 0 ? (
          <section className="rounded border border-amber-200 bg-amber-50 p-4 dark:bg-amber-900/20 dark:border-amber-800/60">
            <h2 className="font-semibold text-amber-900 dark:text-amber-200">Failed repositories</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-amber-900 dark:text-amber-200">
              {result.results.failures.map((failure) => (
                <li key={failure.repo}>
                  {failure.repo}: {failure.reason}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {result.results.results.map((repoResult) => (
          <section key={repoResult.repo} className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{repoResult.repo}</h2>
            {repoResult.aspirantResult ? (
              <CNCFReadinessTab
                aspirantResult={repoResult.aspirantResult}
                repoSlug={repoResult.repo}
              />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No foundation readiness data available for {repoResult.repo}.
              </p>
            )}
          </section>
        ))}
      </div>
    )
  }

  if (result.kind === 'org') {
    return (
      <CNCFCandidacyPanel
        org={result.inventory.org}
        repos={result.inventory.results}
      />
    )
  }

  // projects-board — board scan results
  const totalResolved = result.results.results.length + result.results.failures.length
  return (
    <div className="space-y-6">
      <section className="rounded border border-sky-200 bg-sky-50 p-4 text-sm dark:border-sky-800/60 dark:bg-sky-900/20">
        <p className="font-semibold text-sky-900 dark:text-sky-200">CNCF Sandbox board scan</p>
        <p className="mt-1 text-sky-800 dark:text-sky-300">
          Scanned <strong>{totalResolved}</strong> {totalResolved === 1 ? 'repository' : 'repositories'} from the{' '}
          <strong>New</strong> and <strong>Upcoming</strong> columns of the{' '}
          <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
            CNCF sandbox board
          </a>
          .
        </p>
        {result.skipped.length > 0 ? (
          <p className="mt-1 text-sky-700 dark:text-sky-400">
            {result.skipped.length} {result.skipped.length === 1 ? 'issue was' : 'issues were'} skipped — see warning below.
          </p>
        ) : null}
      </section>

      {result.skipped.length > 0 ? (
        <section className="rounded border border-amber-200 bg-amber-50 p-4 dark:bg-amber-900/20 dark:border-amber-800/60">
          <h2 className="font-semibold text-amber-900 dark:text-amber-200">
            Skipped issues ({result.skipped.length})
          </h2>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            These issues could not be resolved to a repository URL and were excluded from the scan.
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-900 dark:text-amber-200">
            {result.skipped.map((s) => (
              <li key={s.issueNumber}>
                <a
                  href={s.issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  #{s.issueNumber} {s.title}
                </a>
                : {s.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.results.failures.length > 0 ? (
        <section className="rounded border border-amber-200 bg-amber-50 p-4 dark:bg-amber-900/20 dark:border-amber-800/60">
          <h2 className="font-semibold text-amber-900 dark:text-amber-200">Failed repositories</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-900 dark:text-amber-200">
            {result.results.failures.map((failure) => (
              <li key={failure.repo}>
                {failure.repo}: {failure.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.results.results.map((repoResult) => (
        <section key={repoResult.repo} className="space-y-2">
          <h2 className="flex items-baseline gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {repoResult.repo}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">— CNCF sandbox board</span>
          </h2>
          {repoResult.aspirantResult ? (
            <CNCFReadinessTab
              aspirantResult={repoResult.aspirantResult}
              repoSlug={repoResult.repo}
            />
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No foundation readiness data available for {repoResult.repo}.
            </p>
          )}
        </section>
      ))}

      {result.results.results.length === 0 && result.results.failures.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No repositories were successfully scanned from the board.
        </p>
      ) : null}
    </div>
  )
}
