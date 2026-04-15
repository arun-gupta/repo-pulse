import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Constitution §IV: the analyzer module boundary requires lib/org-aggregation/
 * to be framework-agnostic. It must not import from React, Next.js, or any
 * components/* path. This gate fails if any .ts (non-test) file under
 * lib/org-aggregation/ violates the rule.
 *
 * Data-model invariant 7: `OrgAggregationRun` and derived views live in
 * lib/org-aggregation/ and import nothing from react, next/*, or components/*.
 */

const ROOT = resolve(__dirname)
const FORBIDDEN_PATTERNS = [
  /from ['"]react['"]/,
  /from ['"]react\//,
  /from ['"]next['"]/,
  /from ['"]next\//,
  /from ['"]@\/components\//,
  /from ['"]\.{1,2}\/.*\/components\//,
]

function* walkTsFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const s = statSync(full)
    if (s.isDirectory()) {
      yield* walkTsFiles(full)
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      // Skip test files — they may legitimately mock React-adjacent modules.
      if (entry.includes('.test.')) continue
      yield full
    }
  }
}

describe('lib/org-aggregation/ framework isolation (constitution §IV)', () => {
  it('does not import from react, next/*, or components/*', () => {
    const violations: string[] = []
    for (const file of walkTsFiles(ROOT)) {
      const source = readFileSync(file, 'utf8')
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(source)) {
          violations.push(`${relative(ROOT, file)} matches ${pattern}`)
        }
      }
    }
    expect(violations, violations.join('\n')).toEqual([])
  })
})
