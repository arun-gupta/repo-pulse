import { describe, expect, it } from 'vitest'
import {
  GOVERNANCE_DOC_FILES,
  GOVERNANCE_SCORECARD_CHECKS,
  GOVERNANCE_DIRECT_CHECKS,
  GOVERNANCE_CONTRIBUTORS_METRICS,
  LICENSING_IS_GOVERNANCE,
  isGovernanceItem,
} from './governance'

describe('GOVERNANCE_DOC_FILES', () => {
  it('includes expected governance document files', () => {
    expect(GOVERNANCE_DOC_FILES.has('license')).toBe(true)
    expect(GOVERNANCE_DOC_FILES.has('contributing')).toBe(true)
    expect(GOVERNANCE_DOC_FILES.has('code_of_conduct')).toBe(true)
    expect(GOVERNANCE_DOC_FILES.has('security')).toBe(true)
    expect(GOVERNANCE_DOC_FILES.has('changelog')).toBe(true)
    expect(GOVERNANCE_DOC_FILES.has('governance')).toBe(true)
  })

  it('does not include non-governance files', () => {
    expect(GOVERNANCE_DOC_FILES.has('readme')).toBe(false)
    expect(GOVERNANCE_DOC_FILES.has('issue_templates')).toBe(false)
  })
})

describe('GOVERNANCE_SCORECARD_CHECKS', () => {
  it('includes expected Scorecard checks', () => {
    expect(GOVERNANCE_SCORECARD_CHECKS.has('Branch-Protection')).toBe(true)
    expect(GOVERNANCE_SCORECARD_CHECKS.has('Code-Review')).toBe(true)
    expect(GOVERNANCE_SCORECARD_CHECKS.has('Security-Policy')).toBe(true)
    expect(GOVERNANCE_SCORECARD_CHECKS.has('License')).toBe(true)
  })

  it('does not include non-governance Scorecard checks', () => {
    expect(GOVERNANCE_SCORECARD_CHECKS.has('CI-Tests')).toBe(false)
  })
})

describe('GOVERNANCE_DIRECT_CHECKS', () => {
  it('includes expected direct security checks', () => {
    expect(GOVERNANCE_DIRECT_CHECKS.has('branch_protection')).toBe(true)
    expect(GOVERNANCE_DIRECT_CHECKS.has('security_policy')).toBe(true)
  })

  it('does not include non-governance direct checks', () => {
    expect(GOVERNANCE_DIRECT_CHECKS.has('dependabot')).toBe(false)
  })
})

describe('GOVERNANCE_CONTRIBUTORS_METRICS', () => {
  it('includes Maintainer count', () => {
    expect(GOVERNANCE_CONTRIBUTORS_METRICS.has('Maintainer count')).toBe(true)
  })
})

describe('LICENSING_IS_GOVERNANCE', () => {
  it('is true', () => {
    expect(LICENSING_IS_GOVERNANCE).toBe(true)
  })
})

describe('isGovernanceItem', () => {
  it('classifies governance doc_file signals as true', () => {
    expect(isGovernanceItem('license', 'doc_file')).toBe(true)
    expect(isGovernanceItem('contributing', 'doc_file')).toBe(true)
    expect(isGovernanceItem('security', 'doc_file')).toBe(true)
  })

  it('classifies non-governance doc_file signals as false', () => {
    expect(isGovernanceItem('readme', 'doc_file')).toBe(false)
    expect(isGovernanceItem('issue_templates', 'doc_file')).toBe(false)
  })

  it('classifies governance Scorecard checks as true', () => {
    expect(isGovernanceItem('Branch-Protection', 'scorecard')).toBe(true)
    expect(isGovernanceItem('Code-Review', 'scorecard')).toBe(true)
  })

  it('classifies non-governance Scorecard checks as false', () => {
    expect(isGovernanceItem('CI-Tests', 'scorecard')).toBe(false)
  })

  it('classifies governance direct_check signals as true', () => {
    expect(isGovernanceItem('branch_protection', 'direct_check')).toBe(true)
    expect(isGovernanceItem('security_policy', 'direct_check')).toBe(true)
  })

  it('classifies non-governance direct_check signals as false', () => {
    expect(isGovernanceItem('dependabot', 'direct_check')).toBe(false)
  })

  it('classifies governance contributors_metric signals as true', () => {
    expect(isGovernanceItem('Maintainer count', 'contributors_metric')).toBe(true)
  })

  it('classifies unknown keys in any domain as false', () => {
    expect(isGovernanceItem('nonexistent', 'doc_file')).toBe(false)
    expect(isGovernanceItem('nonexistent', 'scorecard')).toBe(false)
    expect(isGovernanceItem('nonexistent', 'direct_check')).toBe(false)
    expect(isGovernanceItem('nonexistent', 'contributors_metric')).toBe(false)
  })
})
