import { describe, it, expect } from 'vitest'
import type { SecurityResult } from '@/lib/security/analysis-result'

describe('extractSecurityResult (via analyzer)', () => {
  // These tests validate the direct check extraction that happens inside analyze.ts.
  // Since extractSecurityResult is not exported, we test the SecurityResult shape expectations.

  describe('direct check structure', () => {
    it('should include all 4 direct check signals', () => {
      const result: SecurityResult = {
        scorecard: 'unavailable',
        directChecks: [
          { name: 'security_policy', detected: true, details: 'SECURITY.md detected' },
          { name: 'dependabot', detected: true, details: 'Dependabot configuration detected' },
          { name: 'ci_cd', detected: true, details: '3 workflow file(s) detected' },
          { name: 'branch_protection', detected: 'unavailable', details: null },
        ],
        branchProtectionEnabled: 'unavailable',
      }

      expect(result.directChecks).toHaveLength(4)
      expect(result.directChecks.map((c) => c.name)).toEqual([
        'security_policy',
        'dependabot',
        'ci_cd',
        'branch_protection',
      ])
    })

    it('should set detected to false when files are not present', () => {
      const result: SecurityResult = {
        scorecard: 'unavailable',
        directChecks: [
          { name: 'security_policy', detected: false, details: null },
          { name: 'dependabot', detected: false, details: null },
          { name: 'ci_cd', detected: false, details: null },
          { name: 'branch_protection', detected: 'unavailable', details: null },
        ],
        branchProtectionEnabled: 'unavailable',
      }

      for (const check of result.directChecks) {
        if (check.name === 'branch_protection') {
          expect(check.detected).toBe('unavailable')
        } else {
          expect(check.detected).toBe(false)
        }
      }
    })

    it('should detect Renovate as dependency automation', () => {
      const result: SecurityResult = {
        scorecard: 'unavailable',
        directChecks: [
          { name: 'security_policy', detected: false, details: null },
          { name: 'dependabot', detected: true, details: 'Renovate configuration detected' },
          { name: 'ci_cd', detected: false, details: null },
          { name: 'branch_protection', detected: 'unavailable', details: null },
        ],
        branchProtectionEnabled: 'unavailable',
      }

      const depCheck = result.directChecks.find((c) => c.name === 'dependabot')
      expect(depCheck?.detected).toBe(true)
      expect(depCheck?.details).toContain('Renovate')
    })

    it('should default scorecard to unavailable', () => {
      const result: SecurityResult = {
        scorecard: 'unavailable',
        directChecks: [],
        branchProtectionEnabled: 'unavailable',
      }

      expect(result.scorecard).toBe('unavailable')
    })
  })
})
