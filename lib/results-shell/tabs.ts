import type { ResultTabDefinition } from '@/specs/006-results-shell/contracts/results-shell-props'

export const resultTabs: ResultTabDefinition[] = [
  {
    id: 'overview',
    label: 'Overview',
    status: 'implemented',
    description: 'Current analysis summary, ecosystem profile, and shared status',
  },
  {
    id: 'metrics',
    label: 'Metrics',
    status: 'placeholder',
    description: 'Evolution metrics and scoring are coming soon.',
  },
  {
    id: 'responsiveness',
    label: 'Responsiveness',
    status: 'placeholder',
    description: 'Responsiveness metrics are coming soon.',
  },
  {
    id: 'sustainability',
    label: 'Sustainability',
    status: 'placeholder',
    description: 'Sustainability metrics are coming soon.',
  },
  {
    id: 'comparison',
    label: 'Comparison',
    status: 'placeholder',
    description: 'Comparison view is coming later in Phase 1.',
  },
]
