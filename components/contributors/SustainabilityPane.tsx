'use client'

import { useState } from 'react'
import { ScoreBadge } from '@/components/metric-cards/ScoreBadge'
import { SUSTAINABILITY_THRESHOLDS } from '@/lib/contributors/score-config'
import type { ContributorsSectionViewModel } from '@/lib/contributors/view-model'

interface SustainabilityPaneProps {
  section: ContributorsSectionViewModel
}

export function SustainabilityPane({ section }: SustainabilityPaneProps) {
  const [showThresholds, setShowThresholds] = useState(false)
  const groupedSignals = groupPlaceholderSignals(section.placeholderSignals)

  return (
    <section aria-label="Sustainability pane" className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Sustainability</h3>
          <p className="mt-1 text-sm text-slate-600">{section.sustainabilityScore.description}</p>
        </div>
        <div className="w-full md:max-w-xs">
          <ScoreBadge category="Sustainability" value={section.sustainabilityScore.value} tone={section.sustainabilityScore.tone} />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">How is this scored?</p>
            <p className="mt-1 text-sm text-slate-700">
              ForkPrint scores sustainability from recent commit concentration. Lower top-20% share means the active contributor base is more distributed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowThresholds((current) => !current)}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            aria-pressed={showThresholds}
          >
            {showThresholds ? 'Hide thresholds' : 'Show thresholds'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUSTAINABILITY_THRESHOLDS.map((threshold) => (
            <div key={threshold.value} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
              <span className="font-semibold text-slate-900">{threshold.value}</span>{' '}
              <span>
                {threshold.maxTopContributorShare === Number.POSITIVE_INFINITY
                  ? '> 75%'
                  : `<= ${(threshold.maxTopContributorShare * 100).toFixed(0)}%`}
              </span>
            </div>
          ))}
        </div>
        {showThresholds ? (
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {SUSTAINABILITY_THRESHOLDS.map((threshold) => (
              <div key={threshold.value} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{threshold.value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {threshold.maxTopContributorShare === Number.POSITIVE_INFINITY
                    ? '> 75%'
                    : `<= ${(threshold.maxTopContributorShare * 100).toFixed(0)}%`}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{threshold.description}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-3 md:grid-cols-2">
        {section.sustainabilityMetrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.label}</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">{metric.value}</dd>
          </div>
        ))}
      </dl>

      {section.sustainabilityScore.topContributorCount !== 'unavailable' && section.sustainabilityScore.contributorCount !== 'unavailable' ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-cyan-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-900">What was scored?</p>
          <p className="mt-1 text-sm text-cyan-950">
            {`${section.sustainabilityScore.topContributorCount} of ${section.sustainabilityScore.contributorCount} active contributors produced ${section.sustainabilityMetrics[0]?.value ?? 'unavailable'} of recent verified commits.`}
          </p>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-900">Missing data</p>
        {section.missingData.length > 0 ? (
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-900">
            {section.missingData.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-amber-900">No missing contributor fields are affecting the current Sustainability view.</p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Later sustainability signals</p>
        <p className="mt-1 text-sm text-slate-600">This first slice scores contributor concentration. Broader sustainability signals land next in grouped areas.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {groupedSignals.map((group) => (
            <div key={group.label} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{group.label}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {group.signals.map((signal) => (
                  <span key={signal} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function groupPlaceholderSignals(signals: string[]) {
  const groups = [
    {
      label: 'Maintainership',
      items: ['Maintainer count'],
    },
    {
      label: 'Contributor continuity',
      items: [
        'Inactive contributors',
        'Occasional contributors',
        'No contributions in the last 6 months',
        'New contributors (90d)',
        'New vs. returning contributor ratio per release cycle',
      ],
    },
    {
      label: 'Contribution shape',
      items: ['Types of contributions'],
    },
    {
      label: 'Organization risk',
      items: [
        'Organizational diversity',
        'Organization-level contribution heatmap',
        'Unique employer/org count among contributors',
        'Single-vendor dependency ratio',
        'Elephant Factor',
      ],
    },
  ]

  return groups
    .map((group) => ({
      label: group.label,
      signals: group.items.filter((item) => signals.includes(item)),
    }))
    .filter((group) => group.signals.length > 0)
}
