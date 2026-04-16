import { describe, expect, it } from 'vitest'
import { extractDocumentationResult, extractSecurityResult } from './analyze'

// Minimal shape for testing — matches RepoOverviewResponse['repository'] structurally.
// We only populate the fields under test; other required fields are cast via `as any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function repoFixture(overrides: Record<string, unknown>): any {
  return {
    name: 'test', description: '', createdAt: '', primaryLanguage: null,
    stargazerCount: 0, forkCount: 0, watchers: { totalCount: 0 },
    issues: { totalCount: 0 },
    ...overrides,
  }
}

describe('SECURITY.md path coverage (issue #309)', () => {
  describe('extractDocumentationResult — file:security signal', () => {
    it.each([
      ['docSecurity', 'SECURITY.md'],
      ['docSecurityLower', 'security.md'],
      ['docSecurityRst', 'SECURITY.rst'],
      ['docSecurityGithub', '.github/SECURITY.md'],
      ['docSecurityGithubLower', '.github/security.md'],
      ['docSecurityDocs', 'docs/SECURITY.md'],
      ['docSecurityDocsLower', 'docs/security.md'],
      ['docSecurityContacts', 'SECURITY_CONTACTS'],
    ])('marks security as found when %s exists (path: %s)', (field, expectedPath) => {
      const result = extractDocumentationResult(repoFixture({ [field]: { oid: 'abc' } }))
      if (result === 'unavailable') throw new Error('expected non-unavailable result')
      const securityCheck = result.fileChecks.find((c) => c.name === 'security')
      expect(securityCheck?.found).toBe(true)
      expect(securityCheck?.path).toBe(expectedPath)
    })

    it('marks security as not found when no security file exists at any path', () => {
      const result = extractDocumentationResult(repoFixture({}))
      if (result === 'unavailable') throw new Error('expected non-unavailable result')
      const securityCheck = result.fileChecks.find((c) => c.name === 'security')
      expect(securityCheck?.found).toBe(false)
      expect(securityCheck?.path).toBeNull()
    })

    it('prefers root SECURITY.md over other locations when multiple exist', () => {
      const result = extractDocumentationResult(repoFixture({
        docSecurity: { oid: 'a' },
        docSecurityGithub: { oid: 'b' },
        docSecurityContacts: { oid: 'c' },
      }))
      if (result === 'unavailable') throw new Error('expected non-unavailable result')
      const securityCheck = result.fileChecks.find((c) => c.name === 'security')
      expect(securityCheck?.path).toBe('SECURITY.md')
    })
  })

  describe('extractSecurityResult — security_policy direct check', () => {
    it.each([
      ['docSecurity', 'SECURITY.md detected'],
      ['docSecurityLower', 'security.md detected'],
      ['docSecurityRst', 'SECURITY.rst detected'],
      ['docSecurityGithub', '.github/SECURITY.md detected'],
      ['docSecurityGithubLower', '.github/security.md detected'],
      ['docSecurityDocs', 'docs/SECURITY.md detected'],
      ['docSecurityDocsLower', 'docs/security.md detected'],
    ])('detects security_policy when %s exists', (field, expectedDetails) => {
      const result = extractSecurityResult(repoFixture({ [field]: { oid: 'abc' } }))
      if (result === 'unavailable') throw new Error('expected non-unavailable result')
      const sec = result.directChecks.find((c) => c.name === 'security_policy')
      expect(sec?.detected).toBe(true)
      expect(sec?.details).toBe(expectedDetails)
    })

    it('detects security_policy when SECURITY_CONTACTS exists and notes the convention', () => {
      const result = extractSecurityResult(repoFixture({ docSecurityContacts: { oid: 'abc' } }))
      if (result === 'unavailable') throw new Error('expected non-unavailable result')
      const sec = result.directChecks.find((c) => c.name === 'security_policy')
      expect(sec?.detected).toBe(true)
      expect(sec?.details).toMatch(/SECURITY_CONTACTS/)
      expect(sec?.details).toMatch(/promoting to SECURITY\.md/)
    })

    it('does not detect security_policy when no security file exists', () => {
      const result = extractSecurityResult(repoFixture({}))
      if (result === 'unavailable') throw new Error('expected non-unavailable result')
      const sec = result.directChecks.find((c) => c.name === 'security_policy')
      expect(sec?.detected).toBe(false)
      expect(sec?.details).toBeNull()
    })
  })
})
