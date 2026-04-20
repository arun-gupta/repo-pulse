'use client'

import { useMemo, useState } from 'react'
import type { ActivityWindowDays } from '@/lib/analyzer/analysis-result'
import type { WeeklyCommitBar } from '@/lib/activity/view-model'

interface DevelopmentCadenceChartProps {
  bars: WeeklyCommitBar[] | null
  windowDays: ActivityWindowDays
  showCommitCounts?: boolean
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function DevelopmentCadenceChart({ bars, windowDays, showCommitCounts = false }: DevelopmentCadenceChartProps) {
  const [zoomIndex, setZoomIndex] = useState(0)
  const now = useMemo(() => new Date(), [])
  const barCount = bars?.length ?? 0
  const zoomWidths = useMemo(() => getZoomWidths(barCount), [barCount])

  if (!bars || bars.length === 0) {
    return <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">No cadence data</div>
  }

  const clampedZoomIndex = Math.min(zoomIndex, zoomWidths.length - 1)
  const zoomWidth = zoomWidths[clampedZoomIndex] ?? 0
  const isZoomedIn = zoomWidth > 0
  const max = Math.max(...bars.map((bar) => bar.commitCount), 1)
  const tickIndexes = getTickIndexes(bars.length)
  const countBars = getCountBars(bars, tickIndexes)
  const w1StartDate = formatDate(getWeekStartDate(0, windowDays, now))
  const finalWeek = bars[bars.length - 1]
  const finalWeekEndDate = finalWeek ? formatDate(getWeekEndDate(getWeekIndex(finalWeek), windowDays, now)) : null
  const trackStyle = isZoomedIn
    ? { gridTemplateColumns: `repeat(${bars.length}, ${zoomWidth}px)` }
    : { gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }

  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40" aria-label="Weekly commit rhythm">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          W1 starts {w1StartDate}. The chart runs left-to-right from oldest to most recent week.
        </p>
        {zoomWidths.length > 1 ? (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoomIndex((current) => Math.min(current + 1, zoomWidths.length - 1))}
              disabled={clampedZoomIndex >= zoomWidths.length - 1}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoomIndex((current) => Math.max(current - 1, 0))}
              disabled={clampedZoomIndex === 0}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
            >
              −
            </button>
          </div>
        ) : null}
      </div>
      <div className={isZoomedIn ? 'overflow-x-auto pb-1' : ''}>
        <div className="grid items-end gap-1" style={trackStyle}>
          {bars.map((bar) => (
            <div
              key={bar.weekLabel}
              className={`w-full rounded-t-sm ${bar.isActive ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-200 dark:bg-slate-700'}`}
              style={{ height: `${Math.max(8, Math.round((bar.commitCount / max) * 48))}px` }}
              title={formatBarTooltip(bar, windowDays, now)}
              aria-label={`${bar.weekLabel}: ${bar.commitCount} commits`}
            />
          ))}
        </div>
        <div className="mt-2 grid gap-1 text-[10px] text-slate-400 dark:text-slate-500" style={trackStyle}>
          {bars.map((bar, index) => (
            <span key={`${bar.weekLabel}-tick`} className="min-w-0 text-center">
              {tickIndexes.includes(index) ? bar.weekLabel : ''}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
        {finalWeekEndDate ? `The selected window currently spans ${w1StartDate} to ${finalWeekEndDate}.` : null}
        {isZoomedIn ? ' Scroll horizontally to move through the timeline.' : ''}
      </p>
      {showCommitCounts ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3 text-[11px] text-slate-600 dark:border-slate-700 dark:text-slate-300">
          {countBars.map((bar) => (
            <span
              key={`${bar.weekLabel}-count`}
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800/60"
              aria-label={`${bar.weekLabel} count: ${bar.commitCount} ${bar.commitCount === 1 ? 'commit' : 'commits'}`}
            >
              {bar.weekLabel}: {bar.commitCount}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function getZoomWidths(barCount: number): number[] {
  if (barCount <= 8) return [barCount]
  if (barCount <= 20) return [0, 28]
  return [0, 18, 28]
}

function getTickIndexes(barCount: number): number[] {
  if (barCount <= 6) return Array.from({ length: barCount }, (_, index) => index)

  const tickCount = Math.min(5, barCount)
  const maxIndex = barCount - 1
  const indexes = new Set<number>()

  for (let tick = 0; tick < tickCount; tick += 1) {
    indexes.add(Math.round((maxIndex * tick) / (tickCount - 1)))
  }

  return Array.from(indexes).sort((a, b) => a - b)
}

function getCountBars(bars: WeeklyCommitBar[], tickIndexes: number[]): WeeklyCommitBar[] {
  if (bars.length <= 13) return bars
  return tickIndexes.map((index) => bars[index]!)
}

function getWeekIndex(bar: WeeklyCommitBar): number {
  return Math.max(0, Number.parseInt(bar.weekLabel.replace(/^W/, ''), 10) - 1)
}

function getWeekStartDate(weekIndex: number, windowDays: ActivityWindowDays, now: Date): Date {
  return new Date(now.getTime() - windowDays * MS_PER_DAY + weekIndex * 7 * MS_PER_DAY)
}

function getWeekEndDate(weekIndex: number, windowDays: ActivityWindowDays, now: Date): Date {
  const weekStart = getWeekStartDate(weekIndex, windowDays, now)
  return new Date(Math.min(now.getTime(), weekStart.getTime() + 7 * MS_PER_DAY - 1))
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function formatBarTooltip(bar: WeeklyCommitBar, windowDays: ActivityWindowDays, now: Date): string {
  const weekIndex = getWeekIndex(bar)
  const weekStart = formatDate(getWeekStartDate(weekIndex, windowDays, now))
  const weekEnd = formatDate(getWeekEndDate(weekIndex, windowDays, now))
  return `${bar.weekLabel} (${weekStart} to ${weekEnd}): ${new Intl.NumberFormat('en-US').format(bar.commitCount)} ${bar.commitCount === 1 ? 'commit' : 'commits'}`
}
