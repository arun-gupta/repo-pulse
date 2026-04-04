'use client'

import { useState } from 'react'
import type { OrgInventorySummary as OrgInventorySummaryModel } from '@/lib/analyzer/org-inventory'

interface OrgInventorySummaryProps {
  summary: OrgInventorySummaryModel
}

export function OrgInventorySummary({ summary }: OrgInventorySummaryProps) {
  return (
    <section aria-label="Org inventory summary" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total public repos" value={String(summary.totalPublicRepos)} />
        <SummaryCard
          label="Total stars"
          value={typeof summary.totalStars === 'number' ? new Intl.NumberFormat('en-US').format(summary.totalStars) : 'unavailable'}
        />
        <SummaryCard label="Active repos" value={String(summary.activeRepoCount)} />
        <SummaryCard label="Archived repos" value={String(summary.archivedRepoCount)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryListCard
          title="Most starred repos"
          items={summary.mostStarredRepos.map((repo) => ({
            label: repo.repo,
            value: typeof repo.stars === 'number' ? new Intl.NumberFormat('en-US').format(repo.stars) : 'unavailable',
          }))}
          emptyLabel="No starred repositories available."
        />
        <SummaryListCard
          title="Most recently active"
          items={summary.mostRecentlyActiveRepos.map((repo) => ({
            label: repo.repo,
            value: formatDate(repo.pushedAt),
          }))}
          emptyLabel="No recent activity available."
        />
        <SummaryListCard
          title="Language distribution"
          items={summary.languageDistribution.map((language) => ({
            label: language.language,
            value: new Intl.NumberFormat('en-US').format(language.repoCount),
          }))}
          emptyLabel="No primary languages available."
          collapsedItemCount={10}
          collapsedLabel="Show more languages"
          expandedLabel="Show fewer languages"
        />
      </div>
    </section>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function SummaryListCard({
  title,
  items,
  emptyLabel,
  collapsedItemCount,
  collapsedLabel,
  expandedLabel,
}: {
  title: string
  items: Array<{ label: string; value: string }>
  emptyLabel: string
  collapsedItemCount?: number
  collapsedLabel?: string
  expandedLabel?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const shouldCollapse = typeof collapsedItemCount === 'number' && items.length > collapsedItemCount
  const visibleItems = shouldCollapse && !expanded ? items.slice(0, collapsedItemCount) : items
  const remainingCount = shouldCollapse ? items.length - collapsedItemCount : 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">{emptyLabel}</p>
      ) : (
        <>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {visibleItems.map((item) => (
              <li key={`${title}-${item.label}`} className="flex items-center justify-between gap-3">
                <span className="truncate text-slate-900">{item.label}</span>
                <span className="shrink-0 text-slate-600">{item.value}</span>
              </li>
            ))}
          </ul>
          {shouldCollapse ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                {expanded ? `Showing all ${items.length} languages` : `${remainingCount} more languages hidden`}
              </p>
              <button
                type="button"
                className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                onClick={() => setExpanded((current) => !current)}
              >
                {expanded ? expandedLabel ?? 'Show less' : collapsedLabel ?? 'Show more'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function formatDate(value: string | 'unavailable') {
  if (value === 'unavailable') {
    return value
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}
