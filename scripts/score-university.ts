#!/usr/bin/env npx tsx
/**
 * Fetches the university repo list from the repofinder fork, runs health
 * scoring in batches via /api/analyze, and writes the scored fixture to the
 * repofinder fork's exports/universities/ directory so repo-pulse can fetch
 * it at runtime without bundling large JSON files.
 *
 * Usage:
 *   GITHUB_TOKEN_1=ghp_... npx tsx scripts/score-university.ts \
 *     [--slug ucsc] [--limit N] [--batch-size 25] \
 *     [--repofinder-dir ../repofinder]
 */

import fs from 'fs'
import path from 'path'
import type { AnalysisResult, AnalyzeResponse } from '../lib/analyzer/analysis-result'

const REPOFINDER_RAW_BASE =
  'https://raw.githubusercontent.com/arun-gupta/repofinder/repo-pulse-integration/exports/universities'
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const TOKEN = process.env.GITHUB_TOKEN_1 ?? ''

interface UniversityRepo {
  full_name: string
  university: string
  affiliation_score: number
}

interface UniversityFixture extends AnalyzeResponse {
  university: string
  slug: string
  totalRepos: number
  generatedAt: string
}

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag: string, def: string) => {
    const i = args.indexOf(flag)
    return i !== -1 ? args[i + 1] : def
  }

  const limitValue = parseInt(get('--limit', '0'), 10)
  if (!Number.isFinite(limitValue) || !Number.isInteger(limitValue) || limitValue < 0) {
    throw new Error('--limit must be a non-negative integer')
  }

  const batchSizeValue = parseInt(get('--batch-size', '25'), 10)
  if (!Number.isFinite(batchSizeValue) || !Number.isInteger(batchSizeValue) || batchSizeValue <= 0) {
    throw new Error('--batch-size must be a positive integer')
  }

  const offsetValue = parseInt(get('--offset', '0'), 10)
  if (!Number.isFinite(offsetValue) || !Number.isInteger(offsetValue) || offsetValue < 0) {
    throw new Error('--offset must be a non-negative integer')
  }

  const discoveryThresholdRaw = get('--discovery-threshold', '')
  const discoveryThreshold = discoveryThresholdRaw ? parseFloat(discoveryThresholdRaw) : undefined
  if (discoveryThreshold !== undefined && (!Number.isFinite(discoveryThreshold) || discoveryThreshold < 0 || discoveryThreshold > 1)) {
    throw new Error('--discovery-threshold must be a number between 0 and 1')
  }

  return {
    slug: get('--slug', 'ucsc'),
    limit: limitValue,
    offset: offsetValue,
    batchSize: batchSizeValue,
    repofinderDir: get('--repofinder-dir', '../repofinder'),
    discoveryThreshold,
  }
}

interface ManifestEntry {
  slug: string
  university: string
  totalRepos: number
  analyzedRepos: number
  generatedAt: string
  discoveryThreshold?: number
}

function updateManifest(exportsDir: string, entry: ManifestEntry) {
  const manifestPath = path.join(exportsDir, 'manifest.json')
  let entries: ManifestEntry[] = []
  if (fs.existsSync(manifestPath)) {
    entries = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as ManifestEntry[]
  }
  const idx = entries.findIndex((e) => e.slug === entry.slug)
  if (idx >= 0) entries[idx] = entry
  else entries.push(entry)
  entries.sort((a, b) => a.university.localeCompare(b.university))
  fs.writeFileSync(manifestPath, JSON.stringify(entries, null, 2))
}

async function fetchRepoList(slug: string): Promise<UniversityRepo[]> {
  const url = `${REPOFINDER_RAW_BASE}/${slug}.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch repo list for "${slug}": HTTP ${res.status}`)
  return res.json() as Promise<UniversityRepo[]>
}

async function analyzeBatch(repos: string[], token: string): Promise<AnalyzeResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 300_000) // 5 min per batch
  try {
    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repos, token }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`/api/analyze failed: HTTP ${res.status}`)
    return res.json() as Promise<AnalyzeResponse>
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const { slug, limit, offset, batchSize, repofinderDir, discoveryThreshold } = parseArgs()

  if (!TOKEN) {
    console.error('Error: GITHUB_TOKEN_1 environment variable is required')
    process.exit(1)
  }

  console.log(`Fetching repo list for "${slug}" from repofinder fork...`)
  const allRepos = await fetchRepoList(slug)
  const universityName = allRepos[0]?.university ?? slug
  const sliced = allRepos.slice(offset)
  const repos = limit > 0 ? sliced.slice(0, limit) : sliced

  console.log(`Scoring ${repos.length} repos (offset ${offset}, limit ${limit || 'none'}) of ${allRepos.length} total in batches of ${batchSize}...\n`)

  const results: AnalysisResult[] = []
  const failures: AnalyzeResponse['failures'] = []

  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize).map((r) => r.full_name)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(repos.length / batchSize)
    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} repos)...`)

    try {
      const response = await analyzeBatch(batch, TOKEN)
      results.push(...response.results)
      failures.push(...(response.failures ?? []))
      console.log(` done (${response.results.length} ok, ${response.failures?.length ?? 0} failed)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(` batch error: ${msg}`)
      failures.push(...batch.map((repo) => ({ repo, reason: msg, code: 'BATCH_ERROR' })))
      // Give the server time to finish the in-flight GitHub API calls so its
      // connection pool drains before we send the next batch.
      await new Promise((resolve) => setTimeout(resolve, 90_000))
    }
  }

  const generatedAt = new Date().toISOString()
  const exportsDir = path.resolve(repofinderDir, 'exports', 'universities')
  fs.mkdirSync(exportsDir, { recursive: true })
  const outPath = path.join(exportsDir, `${slug}-scored.json`)

  // Merge with existing scored results so --offset runs accumulate
  let existingResults: AnalysisResult[] = []
  let existingFailures: AnalyzeResponse['failures'] = []
  if (fs.existsSync(outPath)) {
    const existing = JSON.parse(fs.readFileSync(outPath, 'utf-8')) as UniversityFixture
    existingResults = existing.results ?? []
    existingFailures = existing.failures ?? []
  }
  const existingRepos = new Set(existingResults.map((r) => r.repo))
  const mergedResults = [...existingResults, ...results.filter((r) => !existingRepos.has(r.repo))]
  const mergedFailures = [...existingFailures, ...failures]

  const fixture: UniversityFixture = {
    university: universityName,
    slug,
    totalRepos: allRepos.length,
    generatedAt,
    results: mergedResults,
    failures: mergedFailures,
    rateLimit: null,
  }

  fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2))
  updateManifest(exportsDir, {
    slug,
    university: universityName,
    totalRepos: allRepos.length,
    analyzedRepos: mergedResults.length,
    generatedAt,
    ...(discoveryThreshold !== undefined && { discoveryThreshold }),
  })

  console.log(`\nDone: ${results.length} new scored, ${failures.length} failed (${mergedResults.length} total)`)
  console.log(`Written to ${outPath}`)
  console.log(`Manifest updated at ${path.join(exportsDir, 'manifest.json')}`)
  console.log(`\nNext: cd ${repofinderDir} && git add exports/universities/ && git push`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
