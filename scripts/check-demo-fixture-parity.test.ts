import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { extractGovernanceInterfaceKeys, extractGovernanceGeneratorKeys } from './check-demo-fixture-parity'

const root = process.cwd()

// --- parsing unit tests ---

describe('extractGovernanceInterfaceKeys', () => {
  it('extracts keys from a multi-line governance interface block', () => {
    const src = `
interface OrgFixture {
  governance: {
    twoFactor: TwoFactorSection | null
    staleAdmins: StaleAdminsSection | null
    memberPermission: MemberPermissionSection | null
  }
}
`
    expect(extractGovernanceInterfaceKeys(src)).toEqual(['twoFactor', 'staleAdmins', 'memberPermission'])
  })

  it('returns null when no governance block is present', () => {
    expect(extractGovernanceInterfaceKeys('interface Foo { bar: string }')).toBeNull()
  })
})

describe('extractGovernanceGeneratorKeys', () => {
  it('extracts shorthand property names from a single-line governance object', () => {
    const src = `const payload = { governance: { twoFactor, staleAdmins, memberPermission }, other: 1 }`
    expect(extractGovernanceGeneratorKeys(src)).toEqual(['twoFactor', 'staleAdmins', 'memberPermission'])
  })

  it('returns null when no governance assignment is present', () => {
    expect(extractGovernanceGeneratorKeys('const x = { foo: 1 }')).toBeNull()
  })
})

describe('parity detection', () => {
  it('reports no missing keys when interface and generator match', () => {
    const interfaceKeys = extractGovernanceInterfaceKeys(`
interface OrgFixture {
  governance: {
    twoFactor: Foo | null
    staleAdmins: Bar | null
  }
}
`)!
    const generatorKeys = extractGovernanceGeneratorKeys(
      `const p = { governance: { twoFactor, staleAdmins } }`,
    )!
    expect(interfaceKeys.filter((k) => !generatorKeys.includes(k))).toEqual([])
  })

  it('reports the field missing from the generator', () => {
    const interfaceKeys = extractGovernanceInterfaceKeys(`
interface OrgFixture {
  governance: {
    twoFactor: Foo | null
    newSignal: Bar | null
  }
}
`)!
    const generatorKeys = extractGovernanceGeneratorKeys(
      `const p = { governance: { twoFactor } }`,
    )!
    expect(interfaceKeys.filter((k) => !generatorKeys.includes(k))).toEqual(['newSignal'])
  })
})

// --- artifact presence tests ---

describe('CI workflow', () => {
  it('demo-fixture-parity.yml exists', () => {
    expect(existsSync(join(root, '.github/workflows/demo-fixture-parity.yml'))).toBe(true)
  })

  it('runs the parity check command', () => {
    const src = readFileSync(join(root, '.github/workflows/demo-fixture-parity.yml'), 'utf8')
    expect(src).toContain('npm run demo:check-parity')
  })
})

describe('constitution §XII DoD', () => {
  it('contains the governance fixture generator parity item', () => {
    const src = readFileSync(join(root, '.specify/memory/constitution.md'), 'utf8')
    expect(src).toContain('generate-demo-fixtures.ts')
    expect(src).toContain('npm run demo:fixtures')
  })
})

describe('docs/DEVELOPMENT.md', () => {
  it('contains the governance fixture rule section', () => {
    const src = readFileSync(join(root, 'docs/DEVELOPMENT.md'), 'utf8')
    expect(src).toContain('Adding an org governance signal')
    expect(src).toContain('npm run demo:check-parity')
    expect(src).toContain('npm run demo:fixtures')
  })
})
