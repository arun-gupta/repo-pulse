/**
 * Fixture generator for the /demo route (issue #213).
 *
 * Runs the analyzer against a locked roster of 6 repos + 1 org and writes
 * JSON fixtures to fixtures/demo/. Each fixture embeds a `generatedAt`
 * timestamp (ISO 8601) consumed by the in-app "Demo data · generated …"
 * banner.
 *
 * Usage:
 *   tsx scripts/generate-demo-fixtures.ts
 *
 * Env vars (tried in order):
 *   GITHUB_TOKEN_1, GITHUB_TOKEN_2, ...   (numbered — rotated)
 *   GITHUB_TOKENS                         (comma-separated)
 *   GITHUB_TOKEN                          (single)
 *   DEV_GITHUB_PAT                        (calibration scripts' PAT)
 */

import { loadEnvConfig } from '@next/env'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

loadEnvConfig(process.cwd())

import { analyze } from '../lib/analyzer/analyze'
import { analyzeOrgInventory } from '../lib/analyzer/org-inventory'

export const DEMO_REPOS = [
  'simonw/llm-echo',
  '333fred/compiler-developer-sdk',
  'ossf/security-insights-spec',
  'fluxcd/helm-controller',
  'projectcalico/calico',
  'prometheus/prometheus',
] as const

export const DEMO_ORG = 'ossf'

const OUTPUT_DIR = join(process.cwd(), 'fixtures', 'demo')

function firstToken(): string {
  for (const [key, value] of Object.entries(process.env)) {
    if (/^GITHUB_TOKENS?_\d+$/i.test(key) && value?.trim()) return value.trim()
  }
  if (process.env.GITHUB_TOKENS) {
    const t = process.env.GITHUB_TOKENS.split(',').map((x) => x.trim()).filter(Boolean)
    if (t.length) return t[0]!
  }
  if (process.env.GITHUB_TOKEN?.trim()) return process.env.GITHUB_TOKEN.trim()
  if (process.env.DEV_GITHUB_PAT?.trim()) return process.env.DEV_GITHUB_PAT.trim()
  throw new Error('No GitHub token found. Set GITHUB_TOKEN_1..N, GITHUB_TOKENS, GITHUB_TOKEN, or DEV_GITHUB_PAT in .env.local.')
}

function slugFromRepo(repo: string): string {
  return repo.replace('/', '__')
}

async function main() {
  const token = firstToken()
  mkdirSync(OUTPUT_DIR, { recursive: true })
  const generatedAt = new Date().toISOString()

  // Repos — one analyze() call with all 6 so shape matches the /api/analyze response
  console.log(`[demo-fixtures] analyzing ${DEMO_REPOS.length} repos`)
  const reposResponse = await analyze({ repos: [...DEMO_REPOS], token })
  const reposPayload = { generatedAt, ...reposResponse }
  writeFileSync(
    join(OUTPUT_DIR, 'repositories.json'),
    JSON.stringify(reposPayload, null, 2) + '\n',
  )
  console.log(`[demo-fixtures] wrote repositories.json (${reposResponse.results.length} ok, ${reposResponse.failures.length} failed)`)

  // Org
  console.log(`[demo-fixtures] analyzing org "${DEMO_ORG}"`)
  const orgResponse = await analyzeOrgInventory({ org: DEMO_ORG, token })
  const orgPayload = { generatedAt, ...orgResponse }
  writeFileSync(
    join(OUTPUT_DIR, `org-${DEMO_ORG}.json`),
    JSON.stringify(orgPayload, null, 2) + '\n',
  )
  console.log(`[demo-fixtures] wrote org-${DEMO_ORG}.json (${orgResponse.results.length} repos)`)

  // Manifest indexing what we just wrote
  const manifest = {
    generatedAt,
    repos: DEMO_REPOS.map((repo) => ({ repo, slug: slugFromRepo(repo) })),
    org: DEMO_ORG,
  }
  writeFileSync(join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log(`[demo-fixtures] wrote manifest.json`)
}

main().catch((error) => {
  console.error('[demo-fixtures] failed:', error)
  process.exit(1)
})
