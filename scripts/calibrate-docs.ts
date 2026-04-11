/**
 * Lightweight documentation scoring scan for calibration repos.
 *
 * Reads the repo list from docs/calibrate-repos.md, checks doc file
 * presence via GraphQL object() aliases (10 repos per query), and
 * updates calibration-data.json with documentationScore percentiles.
 *
 * Usage:
 *   npx tsx scripts/calibrate-docs.ts
 */

import { loadEnvConfig } from '@next/env'
import { readFileSync, writeFileSync } from 'fs'

loadEnvConfig(process.cwd())

// ─── Token pool ──────────────────────────────────────────────────────────────

function collectTokens(): string[] {
  const numbered: string[] = []
  for (let i = 1; i <= 20; i++) {
    const token = process.env[`GITHUB_TOKEN_${i}`] ?? process.env[`GITHUB_TOKENS_${i}`]
    if (token) numbered.push(token.trim())
  }
  if (numbered.length > 0) return numbered

  const csv = process.env.GITHUB_TOKENS
  if (csv) return csv.split(',').map((t) => t.trim()).filter(Boolean)

  const single = process.env.GITHUB_TOKEN
  if (single) return [single.trim()]

  console.error('No GITHUB_TOKEN found — add it to .env.local')
  process.exit(1)
}

const rawTokens = collectTokens()
console.log(`Using ${rawTokens.length} token(s)`)

let tokenIndex = 0
function nextToken(): string {
  const token = rawTokens[tokenIndex % rawTokens.length]!
  tokenIndex++
  return token
}

// ─── Repo list ───────────────────────────────────────────────────────────────

const REPO_LIST_PATH = 'docs/calibrate-repos.md'
const CALIBRATION_DATA_PATH = 'lib/scoring/calibration-data.json'

interface BracketRepos {
  key: string
  repos: string[]
}

function readRepoList(): BracketRepos[] {
  const content = readFileSync(REPO_LIST_PATH, 'utf-8')
  const brackets: BracketRepos[] = []
  let currentKey = ''

  for (const line of content.split('\n')) {
    const bracketMatch = line.match(/^## (Emerging|Growing|Established|Popular)/)
    if (bracketMatch) {
      currentKey = bracketMatch[1]!.toLowerCase()
      brackets.push({ key: currentKey, repos: [] })
      continue
    }
    const repoMatch = line.match(/^\- \[([^\]]+)\]/)
    if (repoMatch && brackets.length > 0) {
      brackets[brackets.length - 1]!.repos.push(repoMatch[1]!)
    }
  }

  return brackets
}

// ─── GraphQL ─────────────────────────────────────────────────────────────────

const BATCH_SIZE = 10

function buildDocQuery(repos: string[]): string {
  const aliases = repos.map((fullName, i) => {
    const [owner, name] = fullName.split('/')
    return `
      repo${i}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) {
        readmeMd: object(expression: "HEAD:README.md") { ... on Blob { text } }
        readmeLower: object(expression: "HEAD:readme.md") { ... on Blob { text } }
        readmeRst: object(expression: "HEAD:README.rst") { ... on Blob { text } }
        readmeTxt: object(expression: "HEAD:README.txt") { ... on Blob { text } }
        readmePlain: object(expression: "HEAD:README") { ... on Blob { text } }
        license: object(expression: "HEAD:LICENSE") { ... on Blob { oid } }
        licenseMd: object(expression: "HEAD:LICENSE.md") { ... on Blob { oid } }
        licenseTxt: object(expression: "HEAD:LICENSE.txt") { ... on Blob { oid } }
        copying: object(expression: "HEAD:COPYING") { ... on Blob { oid } }
        contributing: object(expression: "HEAD:CONTRIBUTING.md") { ... on Blob { oid } }
        contributingRst: object(expression: "HEAD:CONTRIBUTING.rst") { ... on Blob { oid } }
        contributingTxt: object(expression: "HEAD:CONTRIBUTING.txt") { ... on Blob { oid } }
        codeOfConduct: object(expression: "HEAD:CODE_OF_CONDUCT.md") { ... on Blob { oid } }
        security: object(expression: "HEAD:SECURITY.md") { ... on Blob { oid } }
        changelog: object(expression: "HEAD:CHANGELOG.md") { ... on Blob { oid } }
        changelogPlain: object(expression: "HEAD:CHANGELOG") { ... on Blob { oid } }
        changes: object(expression: "HEAD:CHANGES.md") { ... on Blob { oid } }
        history: object(expression: "HEAD:HISTORY.md") { ... on Blob { oid } }
        news: object(expression: "HEAD:NEWS.md") { ... on Blob { oid } }
      }`
  }).join('\n')

  return `{ ${aliases} }`
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fetch(url, init)
    } catch (err) {
      if (attempt === retries - 1) throw err
      console.warn(`  Fetch error (attempt ${attempt + 1}/${retries}), retrying...`)
      await sleep(2000 * (attempt + 1))
    }
  }
  throw new Error('Unreachable')
}

interface DocBlob { text?: string; oid?: string }
interface DocRepoData {
  readmeMd?: DocBlob | null
  readmeLower?: DocBlob | null
  readmeRst?: DocBlob | null
  readmeTxt?: DocBlob | null
  readmePlain?: DocBlob | null
  license?: DocBlob | null
  licenseMd?: DocBlob | null
  licenseTxt?: DocBlob | null
  copying?: DocBlob | null
  contributing?: DocBlob | null
  contributingRst?: DocBlob | null
  contributingTxt?: DocBlob | null
  codeOfConduct?: DocBlob | null
  security?: DocBlob | null
  changelog?: DocBlob | null
  changelogPlain?: DocBlob | null
  changes?: DocBlob | null
  history?: DocBlob | null
  news?: DocBlob | null
}

async function runGraphQL(query: string, token: string): Promise<Record<string, DocRepoData | null>> {
  const res = await fetchWithRetry('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    if (res.status === 403 || res.status === 429) {
      const wait = Number(res.headers.get('Retry-After') ?? '60')
      console.log(`Rate limited. Waiting ${wait}s...`)
      await sleep(wait * 1000)
      return runGraphQL(query, token)
    }
    throw new Error(`GraphQL ${res.status}: ${await res.text()}`)
  }

  const body = (await res.json()) as { data?: Record<string, DocRepoData | null>; errors?: unknown[] }
  if (body.errors) {
    console.warn('  GraphQL partial errors (continuing)')
  }
  return body.data ?? {}
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

const FILE_WEIGHTS: Record<string, number> = {
  readme: 0.25, license: 0.20, contributing: 0.15,
  code_of_conduct: 0.10, security: 0.15, changelog: 0.15,
}

const SECTION_WEIGHTS: Record<string, number> = {
  description: 0.25, installation: 0.25, usage: 0.25,
  contributing: 0.15, license: 0.10,
}

function rstAndMdPatterns(keyword: RegExp): RegExp[] {
  return [
    new RegExp(`^#+\\s*${keyword.source}`, 'im'),
    new RegExp(`^(${keyword.source})[^\\n]*\\n[=\\-~^"]+$`, 'im'),
  ]
}

const SECTION_PATTERNS: Array<{ name: string; patterns: RegExp[] }> = [
  { name: 'description', patterns: rstAndMdPatterns(/(?:about|overview|description|introduction|what is|features)/) },
  { name: 'installation', patterns: rstAndMdPatterns(/(?:install(?:ation|ing)?|setup|getting\s*started|quick\s*start)/) },
  { name: 'usage', patterns: rstAndMdPatterns(/(?:usage|examples?|how\s*to\s*use|tutorial|demo)/) },
  { name: 'contributing', patterns: rstAndMdPatterns(/(?:contribut(?:ing|e|ors?)|how\s*to\s*contribute)/) },
  { name: 'license', patterns: rstAndMdPatterns(/licen[sc]e/) },
]

function computeDocScore(repo: DocRepoData): number {
  const has = (blob: DocBlob | null | undefined) => blob != null
  const any = (...blobs: (DocBlob | null | undefined)[]) => blobs.some(has)

  // File presence (60%)
  let fileScore = 0
  if (any(repo.readmeMd, repo.readmeLower, repo.readmeRst, repo.readmeTxt, repo.readmePlain)) fileScore += FILE_WEIGHTS.readme!
  if (any(repo.license, repo.licenseMd, repo.licenseTxt, repo.copying)) fileScore += FILE_WEIGHTS.license!
  if (any(repo.contributing, repo.contributingRst, repo.contributingTxt)) fileScore += FILE_WEIGHTS.contributing!
  if (has(repo.codeOfConduct)) fileScore += FILE_WEIGHTS.code_of_conduct!
  if (has(repo.security)) fileScore += FILE_WEIGHTS.security!
  if (any(repo.changelog, repo.changelogPlain, repo.changes, repo.history, repo.news)) fileScore += FILE_WEIGHTS.changelog!

  // README quality (40%)
  const readmeBlob = repo.readmeMd ?? repo.readmeLower ?? repo.readmeRst ?? repo.readmeTxt ?? repo.readmePlain
  const content = readmeBlob?.text ?? null
  let sectionScore = 0

  if (content) {
    for (const { name, patterns } of SECTION_PATTERNS) {
      if (name === 'description') {
        const hasHeading = patterns.some((p) => p.test(content))
        const firstPara = content.split('\n').find((l) => l.trim().length > 0 && !l.startsWith('#'))
        if (hasHeading || (firstPara && firstPara.trim().length > 20)) {
          sectionScore += SECTION_WEIGHTS[name]!
        }
      } else if (patterns.some((p) => p.test(content))) {
        sectionScore += SECTION_WEIGHTS[name]!
      }
    }
  }

  return fileScore * 0.6 + sectionScore * 0.4
}

// ─── Percentile computation ──────────────────────────────────────────────────

function computePercentiles(values: number[]): { p25: number; p50: number; p75: number; p90: number } {
  const sorted = [...values].sort((a, b) => a - b)
  const at = (p: number) => {
    const idx = (p / 100) * (sorted.length - 1)
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    if (lo === hi) return sorted[lo]!
    return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo)
  }
  return {
    p25: Math.round(at(25) * 1000) / 1000,
    p50: Math.round(at(50) * 1000) / 1000,
    p75: Math.round(at(75) * 1000) / 1000,
    p90: Math.round(at(90) * 1000) / 1000,
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const bracketRepos = readRepoList()
  console.log(`Scanning ${bracketRepos.reduce((s, b) => s + b.repos.length, 0)} repos across ${bracketRepos.length} brackets\n`)

  const bracketScores: Record<string, number[]> = {}

  for (const bracket of bracketRepos) {
    console.log(`\n── ${bracket.key} (${bracket.repos.length} repos) ──`)
    const scores: number[] = []

    for (let i = 0; i < bracket.repos.length; i += BATCH_SIZE) {
      const batch = bracket.repos.slice(i, i + BATCH_SIZE)
      const query = buildDocQuery(batch)
      const token = nextToken()

      try {
        const data = await runGraphQL(query, token)

        for (let j = 0; j < batch.length; j++) {
          const repoData = data[`repo${j}`]
          if (!repoData) continue
          scores.push(computeDocScore(repoData))
        }

        process.stdout.write(`  Batch [${i + 1}–${Math.min(i + BATCH_SIZE, bracket.repos.length)}/${bracket.repos.length}] ✓ (${scores.length} scored)\r`)
      } catch (err) {
        console.warn(`  Batch error at ${i}: ${err}`)
      }

      await sleep(300)
    }

    console.log(`\n  ${scores.length} repos scored`)
    bracketScores[bracket.key] = scores
  }

  // Update calibration data
  const calData = JSON.parse(readFileSync(CALIBRATION_DATA_PATH, 'utf-8'))

  for (const [bracket, scores] of Object.entries(bracketScores)) {
    if (scores.length === 0) continue
    const ps = computePercentiles(scores)
    calData.brackets[bracket].documentationScore = ps
    console.log(`\n${bracket}: p25=${ps.p25} p50=${ps.p50} p75=${ps.p75} p90=${ps.p90}`)
  }

  writeFileSync(CALIBRATION_DATA_PATH, JSON.stringify(calData, null, 2) + '\n')
  console.log(`\nCalibration data updated at ${CALIBRATION_DATA_PATH}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
