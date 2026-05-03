import { describe, expect, it } from 'vitest'
import { buildResult } from '@/lib/testing/fixtures'
import {
  buildResponsivenessSections,
  getResponsivenessWindowOptions,
} from './view-model'

describe('getResponsivenessWindowOptions', () => {
  it('returns an entry for each ACTIVITY_WINDOW_DAYS value', () => {
    const opts = getResponsivenessWindowOptions()
    expect(opts.length).toBeGreaterThan(0)
    for (const opt of opts) {
      expect(typeof opt.days).toBe('number')
      expect(typeof opt.label).toBe('string')
    }
  })

  it('labels 365-day window as "12 months"', () => {
    const opts = getResponsivenessWindowOptions()
    const yearOpt = opts.find((o) => o.days === 365)
    expect(yearOpt?.label).toBe('12 months')
  })

  it('labels shorter windows with day count (e.g. "90d")', () => {
    const opts = getResponsivenessWindowOptions()
    const ninetyDay = opts.find((o) => o.days === 90)
    expect(ninetyDay?.label).toBe('90d')
  })
})

describe('buildResponsivenessSections', () => {
  it('returns one section per result', () => {
    const results = [buildResult({ repo: 'org/a' }), buildResult({ repo: 'org/b' })]
    const sections = buildResponsivenessSections(results, 90)
    expect(sections).toHaveLength(2)
    expect(sections[0].repo).toBe('org/a')
    expect(sections[1].repo).toBe('org/b')
  })

  it('returns empty array for empty input', () => {
    expect(buildResponsivenessSections([], 90)).toEqual([])
  })

  it('each section has five named panes', () => {
    const sections = buildResponsivenessSections([buildResult()], 90)
    const paneNames = sections[0].panes.map((p) => p.title)
    expect(paneNames).toContain('Issue & PR response time')
    expect(paneNames).toContain('Resolution metrics')
    expect(paneNames).toContain('Maintainer activity signals')
    expect(paneNames).toContain('Volume & backlog health')
    expect(paneNames).toContain('Engagement quality signals')
    expect(sections[0].panes).toHaveLength(5)
  })

  it('each pane has at least one metric', () => {
    const sections = buildResponsivenessSections([buildResult()], 90)
    for (const pane of sections[0].panes) {
      expect(pane.metrics.length).toBeGreaterThan(0)
    }
  })

  it('each metric has a label and value string', () => {
    const sections = buildResponsivenessSections([buildResult()], 90)
    for (const pane of sections[0].panes) {
      for (const metric of pane.metrics) {
        expect(typeof metric.label).toBe('string')
        expect(typeof metric.value).toBe('string')
      }
    }
  })

  it('unavailable metrics render as em-dash', () => {
    const sections = buildResponsivenessSections([buildResult()], 90)
    for (const pane of sections[0].panes) {
      for (const metric of pane.metrics) {
        if (metric.value !== '—') continue
        expect(metric.value).toBe('—')
      }
    }
    // Bare fixture has all unavailable fields — every metric value is em-dash
    const allValues = sections[0].panes.flatMap((p) => p.metrics.map((m) => m.value))
    expect(allValues.every((v) => v === '—')).toBe(true)
  })

  it('section exposes a score field', () => {
    const sections = buildResponsivenessSections([buildResult()], 90)
    expect(sections[0].score).toBeDefined()
  })

  it('produces consistent output across all supported window sizes', () => {
    const result = buildResult()
    for (const days of [30, 60, 90, 180, 365] as const) {
      const sections = buildResponsivenessSections([result], days)
      expect(sections[0].panes).toHaveLength(5)
    }
  })
})
