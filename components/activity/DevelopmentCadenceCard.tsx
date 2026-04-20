'use client'

import { useState } from 'react'
import { HelpLabel } from '@/components/shared/HelpLabel'
import { MetricValue } from '@/components/shared/MetricValue'
import type { ActivityWindowDays, AnalysisResult, TrendComparisonMode } from '@/lib/analyzer/analysis-result'
import { buildDevelopmentCadenceCard } from '@/lib/activity/view-model'
import { DevelopmentCadenceChart } from './development-cadence-chart'

interface DevelopmentCadenceCardProps {
  result: AnalysisResult
  windowDays: ActivityWindowDays
}

export function DevelopmentCadenceCard({ result, windowDays }: DevelopmentCadenceCardProps) {
  const card = buildDevelopmentCadenceCard(result, windowDays)
  const [showCommitCounts, setShowCommitCounts] = useState(false)
  const [selectedTrendMode, setSelectedTrendMode] = useState<TrendComparisonMode>('month')

  if (!card) return null
  const cadence = result.activityCadenceByWindow?.[windowDays]
  const activeTrend = card.trendModes[selectedTrendMode] ?? card.trendModes[card.defaultTrendMode]
  const defaultBranchLabel =
    typeof result.defaultBranchName === 'string' && result.defaultBranchName !== 'unavailable'
      ? `the default branch (${result.defaultBranchName})`
      : 'the default branch'

  const activeWeeksTooltip =
    cadence &&
    typeof cadence.totalWeeks === 'number' &&
    Array.isArray(cadence.weeklyCommitCounts)
      ? `An active week is any week in the selected ${windowDays === 365 ? '12 months' : `${windowDays}d`} window with at least 1 verified commit. This value is calculated as active weeks divided by total weeks: ${cadence.weeklyCommitCounts.filter((count) => count > 0).length} of ${cadence.totalWeeks} weeks.`
      : `An active week is any week in the selected ${windowDays === 365 ? '12 months' : `${windowDays}d`} window with at least 1 verified commit. This value is calculated as active weeks divided by total weeks in that window.`
  const weekendWeekdayTooltip =
    cadence &&
    typeof cadence.weekendCommitCount === 'number' &&
    typeof cadence.weekdayCommitCount === 'number' &&
    typeof cadence.weekendToWeekdayRatio === 'number'
      ? `In the selected ${windowDays === 365 ? '12 months' : `${windowDays}d`} window, this repo had ${new Intl.NumberFormat('en-US').format(cadence.weekendCommitCount)} weekend commits and ${new Intl.NumberFormat('en-US').format(cadence.weekdayCommitCount)} weekday commits. Weekend activity made up ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format((cadence.weekendCommitCount / Math.max(1, cadence.weekendCommitCount + cadence.weekdayCommitCount)) * 100)}% of all commits. The weekend-to-weekday ratio was ${cadence.weekendToWeekdayRatio.toFixed(2)}x, which means weekend activity was ${cadence.weekendToWeekdayRatio < 1 ? 'lower than' : cadence.weekendToWeekdayRatio > 1 ? 'higher than' : 'equal to'} weekday activity. This is descriptive only and is not treated as inherently better or worse.`
      : `Weekend commits divided by weekday commits in the selected ${windowDays === 365 ? '12 months' : `${windowDays}d`} window. Values below 1.0x mean activity happened more often on weekdays; values above 1.0x mean activity happened more often on weekends. This describes work rhythm only and is not treated as inherently better or worse.`

  return (
    <section
      aria-label={`Development cadence for ${card.repo}`}
      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:col-span-2 xl:col-span-2 dark:border-slate-700 dark:bg-slate-800/60"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Development cadence</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Weekly rhythm, consistency, weekend share, and recent momentum.</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Based on commit history from {defaultBranchLabel}.
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{card.regularityLabel}</p>
          {card.regularityPercentileLabel ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{card.regularityPercentileLabel}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <DevelopmentCadenceChart bars={card.chartBars} windowDays={windowDays} showCommitCounts={showCommitCounts} />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            aria-pressed={showCommitCounts}
            onClick={() => setShowCommitCounts((current) => !current)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              showCommitCounts
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white'
            }`}
          >
            {showCommitCounts ? 'Hide commit counts' : 'Show commit counts'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricBlock
          label="Active weeks"
          labelHelpText={activeWeeksTooltip}
          value={card.activeWeeksValue}
          detail={card.activeWeeksPercentileLabel}
        />
        <MetricBlock label="Longest gap" value={card.longestGapValue} detail={card.longestGapHighlighted ? 'Unusually long gap' : null} highlight={card.longestGapHighlighted} />
        <MetricBlock
          label="Weekend Flow"
          labelHelpText={weekendWeekdayTooltip}
          value={card.weekendWeekdayValue}
          detail="Informational only"
        />
      </div>

      <TrendModule
        className="mt-4"
        selectedMode={selectedTrendMode}
        onSelectMode={setSelectedTrendMode}
        trend={activeTrend}
      />
    </section>
  )
}

function MetricBlock({
  label,
  labelHelpText,
  value,
  detail,
  highlight = false,
}: {
  label: string
  labelHelpText?: string
  value: string
  detail?: string | null
  highlight?: boolean
}) {
  return (
    <div className={`min-w-0 rounded-xl border px-3 py-3 ${highlight ? 'border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/20' : 'border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/40'}`}>
      <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {labelHelpText ? <HelpLabel label={label} helpText={labelHelpText} /> : label}
      </p>
      <p className="mt-1 break-words text-base leading-tight"><MetricValue value={value} /></p>
      {detail ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p> : null}
    </div>
  )
}

function TrendModule({
  className,
  selectedMode,
  onSelectMode,
  trend,
}: {
  className?: string
  selectedMode: TrendComparisonMode
  onSelectMode: (mode: TrendComparisonMode) => void
  trend: {
    label: string
    helperText: string
    trendLabel: 'Accelerating' | 'Decelerating' | 'Flat' | 'Insufficient verified public data'
    trendDeltaValue: string | null
    currentPeriodLabel: string
    currentPeriodValue: string
    previousPeriodLabel: string
    previousPeriodValue: string
  }
}) {
  const { symbol, className: trendClassName } = getTrendPresentation(trend.trendLabel)
  const trendAriaLabel = `Trend: ${trend.trendLabel}${trend.trendDeltaValue ? ` (${trend.trendDeltaValue})` : ''}`

  return (
    <div className={`rounded-xl border border-slate-200 bg-white/70 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40 ${className ?? ''}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
            <HelpLabel label="Trend" helpText={trend.helperText} />
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{trend.label}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{trend.helperText}</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={selectedMode === mode}
              onClick={() => onSelectMode(mode)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                selectedMode === mode
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                  : 'border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white'
              }`}
            >
              {mode === 'month' ? 'Month' : mode === 'week' ? 'Week' : 'Day'}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,2fr)] lg:items-center">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/60">
          <div aria-label={trendAriaLabel} className={`text-2xl leading-none ${trendClassName}`}>
            <span aria-hidden="true">{symbol}</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{trend.trendLabel}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <MetricValue value={trend.trendDeltaValue ?? '—'} />
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TrendColumn label={trend.previousPeriodLabel} value={trend.previousPeriodValue} />
          <TrendColumn label={trend.currentPeriodLabel} value={trend.currentPeriodValue} />
        </div>
      </div>
    </div>
  )
}

function getTrendPresentation(trend: 'Accelerating' | 'Decelerating' | 'Flat' | 'Insufficient verified public data') {
  switch (trend) {
    case 'Accelerating':
      return { symbol: '↗', className: 'text-emerald-600 dark:text-emerald-400' }
    case 'Decelerating':
      return { symbol: '↘', className: 'text-amber-600 dark:text-amber-400' }
    case 'Flat':
      return { symbol: '→', className: 'text-slate-600 dark:text-slate-300' }
    default:
      return { symbol: '—', className: 'text-slate-400 dark:text-slate-500' }
  }
}

function TrendColumn({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 text-base"><MetricValue value={value} /></p>
    </div>
  )
}
