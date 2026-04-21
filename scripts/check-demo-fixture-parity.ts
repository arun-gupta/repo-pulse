/**
 * Checks that every governance key declared in the OrgFixture interface
 * (app/demo/organization/page.tsx) is also written by the fixture generator
 * (scripts/generate-demo-fixtures.ts).
 *
 * Exits 1 when fields are missing so CI catches the gap before merge.
 *
 * Usage:
 *   tsx scripts/check-demo-fixture-parity.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const root = process.cwd()

export function extractGovernanceInterfaceKeys(src: string): string[] | null {
  // Match the governance block inside the OrgFixture interface definition.
  // The block has no nested braces (only union types like `Foo | null`).
  const match = src.match(/governance:\s*\{([^}]+)\}/)
  if (!match) return null
  return [...match[1].matchAll(/^\s+(\w+)\s*:/gm)].map((m) => m[1])
}

export function extractGovernanceGeneratorKeys(src: string): string[] | null {
  // Match the governance shorthand object in the fixture generator's orgPayload.
  const match = src.match(/governance:\s*\{([^}]+)\}/)
  if (!match) return null
  return [...match[1].matchAll(/\b(\w+)\b/g)].map((m) => m[1])
}

const pageSrc = readFileSync(join(root, 'app/demo/organization/page.tsx'), 'utf8')
const generatorSrc = readFileSync(join(root, 'scripts/generate-demo-fixtures.ts'), 'utf8')

const interfaceKeys = extractGovernanceInterfaceKeys(pageSrc)
if (!interfaceKeys) {
  console.error('[demo-parity] Could not locate `governance: { ... }` block in OrgFixture interface')
  process.exit(1)
}

const generatorKeys = extractGovernanceGeneratorKeys(generatorSrc)
if (!generatorKeys) {
  console.error('[demo-parity] Could not locate `governance: { ... }` assignment in generate-demo-fixtures.ts')
  process.exit(1)
}

const missing = interfaceKeys.filter((k) => !generatorKeys.includes(k))

if (missing.length > 0) {
  console.error('[demo-parity] FAIL: governance field(s) in OrgFixture are missing from generate-demo-fixtures.ts:')
  missing.forEach((k) => console.error(`  - ${k}`))
  console.error(
    '\nFix: add each missing field to the `governance:` object in scripts/generate-demo-fixtures.ts, ' +
      'then regenerate fixtures with: npm run demo:fixtures',
  )
  process.exit(1)
}

console.log(
  `[demo-parity] OK: all ${interfaceKeys.length} governance field(s) present in generate-demo-fixtures.ts` +
    ` (${interfaceKeys.join(', ')})`,
)
