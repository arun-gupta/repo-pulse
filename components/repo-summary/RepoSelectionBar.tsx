import { MAX_REPOS_PER_REQUEST } from '@/app/api/analyze/route'

interface Props {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClear: () => void
  onAnalyzeSelected: () => void
  analyzeAllCount?: number
  onAnalyzeAll?: () => void
}

export function RepoSelectionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClear,
  onAnalyzeSelected,
  analyzeAllCount,
  onAnalyzeAll,
}: Props) {
  const overLimit = selectedCount > MAX_REPOS_PER_REQUEST

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {selectedCount} of {totalCount} selected
          {overLimit && (
            <span className="ml-1 text-amber-600 dark:text-amber-400">
              · max {MAX_REPOS_PER_REQUEST} for analysis
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onSelectAll}
          className="text-xs text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
        >
          Select all
        </button>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onAnalyzeAll !== undefined && analyzeAllCount !== undefined && (
          <button
            type="button"
            disabled={analyzeAllCount === 0}
            onClick={onAnalyzeAll}
            className="rounded border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 transition enabled:hover:border-sky-400 enabled:hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
          >
            Analyze all ({analyzeAllCount})
          </button>
        )}
        <button
          type="button"
          disabled={selectedCount === 0 || overLimit}
          onClick={onAnalyzeSelected}
          className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition enabled:hover:border-slate-400 enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
        >
          Analyze selected ({selectedCount})
        </button>
      </div>
    </div>
  )
}
