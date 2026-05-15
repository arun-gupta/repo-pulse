#!/usr/bin/env npx tsx
/**
 * Reads each {slug}-scored.json from the repofinder exports directory,
 * computes aggregate stats (score buckets, per-metric medians, bands),
 * and writes {slug}-summary.json (~2KB each) alongside the scored files.
 *
 * Usage:
 *   npx tsx scripts/summarize-university.ts [--repofinder-dir ../repofinder]
 */

import fs from 'fs'
import path from 'path'
import type { AnalysisResult } from '../lib/analyzer/analysis-result'
import { getHealthScore } from '../lib/scoring/health-score'
import { getDocumentationScore } from '../lib/documentation/score-config'
import { getSecurityScore } from '../lib/security/score-config'

import type { UniversitySummary } from '../lib/university/university-summary'
export type { UniversitySummary }

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid]
}

function computeSummary(
  slug: string,
  university: string,
  totalRepos: number,
  generatedAt: string,
  results: AnalysisResult[]
): UniversitySummary {
  const scores: number[] = []
  let activeRepos = 0
  let maintainedRepos = 0
  let communityRepos = 0
  const documentation: number[] = []
  const security: number[] = []

  for (const r of results) {
    const health = getHealthScore(r).percentile
    if (health === null) continue
    scores.push(health)

    if (typeof r.commits90d === 'number' && r.commits90d > 0) activeRepos++

    if (
      (typeof r.issuesClosed90d === 'number' && r.issuesClosed90d > 0) ||
      (typeof r.prsMerged90d === 'number' && r.prsMerged90d > 0)
    ) maintainedRepos++

    if (typeof r.uniqueCommitAuthors90d === 'number' && r.uniqueCommitAuthors90d > 1) communityRepos++

    const doc = r.documentationResult !== 'unavailable'
      ? getDocumentationScore(r.documentationResult, r.licensingResult, r.stars, r.inclusiveNamingResult).percentile
      : null
    if (doc !== null) documentation.push(doc)

    const sec = r.securityResult !== 'unavailable'
      ? getSecurityScore(r.securityResult, r.stars).percentile
      : null
    if (sec !== null) security.push(sec)
  }

  const buckets = Array<number>(10).fill(0)
  for (const s of scores) {
    const idx = Math.min(9, Math.floor(s / 10))
    buckets[idx]++
  }

  const high = scores.filter((s) => s >= 67).length
  const medium = scores.filter((s) => s >= 34 && s < 67).length
  const low = scores.filter((s) => s < 34).length
  const total = scores.length || 1

  return {
    slug,
    university,
    generatedAt,
    totalRepos,
    scoredRepos: results.length,
    medianScore: median(scores),
    scoreBands: {
      high: Math.round((high / total) * 100) / 100,
      medium: Math.round((medium / total) * 100) / 100,
      low: Math.round((low / total) * 100) / 100,
    },
    scoreBuckets: buckets,
    metrics: {
      activity: Math.round((activeRepos / (scores.length || 1)) * 100),
      maintenance: Math.round((maintainedRepos / (scores.length || 1)) * 100),
      community: Math.round((communityRepos / (scores.length || 1)) * 100),
      documentation: median(documentation),
      security: median(security),
    },
  }
}

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag: string, def: string) => {
    const i = args.indexOf(flag)
    return i !== -1 ? args[i + 1] : def
  }
  return { repofinderDir: get('--repofinder-dir', '../repofinder') }
}

async function main() {
  const { repofinderDir } = parseArgs()
  const exportsDir = path.resolve(repofinderDir, 'exports', 'universities')

  const manifestPath = path.join(exportsDir, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found at ${manifestPath}`)
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Array<{
    slug: string
    university: string
    totalRepos: number
    generatedAt: string
  }>

  for (const entry of manifest) {
    const scoredPath = path.join(exportsDir, `${entry.slug}-scored.json`)
    if (!fs.existsSync(scoredPath)) {
      console.warn(`Skipping ${entry.slug} — scored file not found`)
      continue
    }

    process.stdout.write(`Computing summary for ${entry.slug}...`)
    const fixture = JSON.parse(fs.readFileSync(scoredPath, 'utf-8')) as {
      results: AnalysisResult[]
      totalRepos: number
      generatedAt: string
    }

    const summary = computeSummary(
      entry.slug,
      entry.university,
      fixture.totalRepos,
      fixture.generatedAt,
      fixture.results
    )

    const outPath = path.join(exportsDir, `${entry.slug}-summary.json`)
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2))
    console.log(` done (medianScore=${summary.medianScore}, ${summary.scoredRepos} repos)`)
  }

  console.log('\nAll summaries written. Next: push exports/universities/*-summary.json to repo-pulse-integration')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
