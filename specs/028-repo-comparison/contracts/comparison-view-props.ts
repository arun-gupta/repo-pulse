export type ComparisonSectionId =
  | 'overview'
  | 'contributors'
  | 'activity'
  | 'responsiveness'
  | 'health-ratios'

export type ComparisonDirection = 'higher-is-better' | 'lower-is-better' | 'neutral'

export interface ComparisonAttributeDefinition {
  id: string
  sectionId: ComparisonSectionId
  label: string
  helpText: string
  direction: ComparisonDirection
}

export interface ComparisonCellViewModel {
  repo: string
  displayValue: string
  deltaDisplay?: string
  status: 'better' | 'worse' | 'same' | 'neutral' | 'unavailable'
}

export interface ComparisonRowViewModel {
  attributeId: string
  label: string
  helpText: string
  medianDisplay?: string
  cells: ComparisonCellViewModel[]
}

export interface ComparisonSectionViewModel {
  id: ComparisonSectionId
  label: string
  description: string
  rows: ComparisonRowViewModel[]
}

export interface ComparisonViewProps {
  repos: string[]
  anchorRepo: string
  sections: ComparisonSectionViewModel[]
  showMedianColumn: boolean
  maxRepos: number
}
