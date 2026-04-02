'use client'

import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import { buildActivitySections } from '@/lib/activity/view-model'

interface ActivityViewProps {
  results: AnalysisResult[]
}

export function ActivityView({ results }: ActivityViewProps) {
  const sections = buildActivitySections(results)

  if (sections.length === 0) {
    return null
  }

  return (
    <section aria-label="Activity view" className="space-y-6">
      {sections.map((section) => (
        <article key={section.repo} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{section.repo}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Recent repository activity and delivery flow derived from verified public GitHub data.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {section.metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  )
}
