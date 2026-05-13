import { getHealthScore } from '../lib/scoring/health-score'
import type { AnalysisResult } from '../lib/analyzer/analysis-result'

const TOKEN = process.env.GITHUB_TOKEN_1 ?? ''
const BASE_URL = 'http://localhost:3000'

const repos: string[] = [
  'wxo15/UCSC-bayesian-statistics-coursera',
  'wkratos77/C_UCSC',
  'mdcovarr/distributed-kvs',
  'shawfdong/hyades',
  'aravindnairtech/Event-Driven-Simulator-UCSC-Bus-Routes-',
  'SMARTlab-Purdue/ros2-foxy-wearable-biosensors',
  'LeifAndersen/PLGradSchools',
  'adamnovak/ucscthesis',
  'UCSC-REAL/DS2',
  'UCSC-REAL/TokenCleaning',
]

const DIMENSIONS = ['Activity', 'Responsiveness', 'Contributors', 'Documentation', 'Security']

function pct(val: number | null | undefined): string {
  return val == null ? '  N/A' : `${val.toString().padStart(3)}th`
}

async function main() {
  console.log(`Analyzing ${repos.length} UCSC repos via repo-pulse...\n`)

  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repos, token: TOKEN }),
  })

  const data = await res.json() as { results: AnalysisResult[], failures: {repo: string, reason: string}[] }

  if (data.failures?.length) {
    console.log('Failures:')
    for (const f of data.failures) console.log(`  ✗ ${f.repo}: ${f.reason}`)
    console.log()
  }

  const scored = data.results.map(r => {
    const score = getHealthScore(r)
    return { repo: r.repo, stars: r.stars ?? 0, score }
  })

  scored.sort((a, b) => (b.score.percentile ?? 0) - (a.score.percentile ?? 0))

  const header = [
    'Repository'.padEnd(45),
    'Stars'.padStart(6),
    'Overall'.padStart(8),
    ...DIMENSIONS.map(d => d.padStart(14)),
  ].join('  ')

  console.log(header)
  console.log('-'.repeat(header.length))

  for (const { repo, stars, score } of scored) {
    const bucketMap = Object.fromEntries(score.buckets.map(b => [b.name, b.percentile]))
    const row = [
      repo.padEnd(45),
      stars.toString().padStart(6),
      pct(score.percentile).padStart(8),
      ...DIMENSIONS.map(d => pct(bucketMap[d]).padStart(14)),
    ].join('  ')
    console.log(row)
  }

  console.log()
  console.log(`Analyzed: ${data.results.length}  Failed: ${data.failures?.length ?? 0}`)
}

main().catch(console.error)
