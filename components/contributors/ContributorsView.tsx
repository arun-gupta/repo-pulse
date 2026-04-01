'use client'

import type { AnalysisResult } from '@/lib/analyzer/analysis-result'
import { buildContributorsViewModels } from '@/lib/contributors/view-model'
import { CoreContributorsPane } from './CoreContributorsPane'
import { SustainabilityPane } from './SustainabilityPane'

interface ContributorsViewProps {
  results: AnalysisResult[]
}

export function ContributorsView({ results }: ContributorsViewProps) {
  const sections = buildContributorsViewModels(results)

  return (
    <section aria-label="Contributors view" className="space-y-6">
      {sections.map((section) => (
        <article key={section.repo} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{section.repo}</h2>
            <p className="mt-1 text-sm text-slate-600">Contributor health and sustainability signals derived from verified public repository activity.</p>
          </div>
          <CoreContributorsPane metrics={section.coreMetrics} heatmap={section.heatmap} />
          <SustainabilityPane section={section} />
        </article>
      ))}
    </section>
  )
}
