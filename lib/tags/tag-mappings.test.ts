import { describe, expect, it } from 'vitest'
import {
  SUPPLY_CHAIN_SCORECARD_CHECKS,
  SUPPLY_CHAIN_DIRECT_CHECKS,
  QUICK_WIN_DOC_FILES,
  COMPLIANCE_DOC_FILES,
  COMPLIANCE_SCORECARD_CHECKS,
  COMPLIANCE_DIRECT_CHECKS,
  LICENSING_IS_COMPLIANCE,
  CONTRIB_EX_README_SECTIONS,
  CONTRIB_EX_RESPONSIVENESS_PANES,
  CONTRIB_EX_ACTIVITY_CARDS,
  getDocFileTags,
  getReadmeSectionTags,
  getScorecardCheckTags,
  getDirectCheckTags,
} from './tag-mappings'

describe('getDocFileTags', () => {
  it('license gets quick-win and compliance tags', () => {
    const tags = getDocFileTags('license')
    expect(tags).toContain('quick-win')
    expect(tags).toContain('compliance')
  })

  it('contributing gets quick-win and contrib-ex tags', () => {
    const tags = getDocFileTags('contributing')
    expect(tags).toContain('quick-win')
    expect(tags).toContain('contrib-ex')
  })

  it('code_of_conduct gets quick-win and contrib-ex tags', () => {
    const tags = getDocFileTags('code_of_conduct')
    expect(tags).toContain('quick-win')
    expect(tags).toContain('contrib-ex')
  })

  it('security gets only quick-win tag', () => {
    const tags = getDocFileTags('security')
    expect(tags).toContain('quick-win')
    expect(tags).not.toContain('compliance')
    expect(tags).not.toContain('contrib-ex')
  })

  it('returns empty array for unknown doc file name', () => {
    expect(getDocFileTags('nonexistent')).toEqual([])
  })

  it('never includes supply-chain tag', () => {
    for (const name of QUICK_WIN_DOC_FILES) {
      expect(getDocFileTags(name)).not.toContain('supply-chain')
    }
  })
})

describe('getReadmeSectionTags', () => {
  it('returns contrib-ex for installation', () => {
    expect(getReadmeSectionTags('installation')).toEqual(['contrib-ex'])
  })

  it('returns contrib-ex for contributing', () => {
    expect(getReadmeSectionTags('contributing')).toEqual(['contrib-ex'])
  })

  it('returns empty array for unknown section', () => {
    expect(getReadmeSectionTags('nonexistent')).toEqual([])
  })

  it('every section in CONTRIB_EX_README_SECTIONS returns contrib-ex', () => {
    for (const name of CONTRIB_EX_README_SECTIONS) {
      expect(getReadmeSectionTags(name)).toContain('contrib-ex')
    }
  })
})

describe('getScorecardCheckTags', () => {
  it('Binary-Artifacts gets supply-chain tag', () => {
    expect(getScorecardCheckTags('Binary-Artifacts')).toContain('supply-chain')
  })

  it('CI-Tests gets quick-win tag', () => {
    expect(getScorecardCheckTags('CI-Tests')).toContain('quick-win')
  })

  it('Security-Policy gets quick-win and compliance tags', () => {
    const tags = getScorecardCheckTags('Security-Policy')
    expect(tags).toContain('quick-win')
    expect(tags).toContain('compliance')
  })

  it('returns empty array for unknown Scorecard check', () => {
    expect(getScorecardCheckTags('UnknownCheck')).toEqual([])
  })

  it('every check in SUPPLY_CHAIN_SCORECARD_CHECKS returns supply-chain', () => {
    for (const name of SUPPLY_CHAIN_SCORECARD_CHECKS) {
      expect(getScorecardCheckTags(name)).toContain('supply-chain')
    }
  })
})

describe('getDirectCheckTags', () => {
  it('dependabot gets supply-chain and quick-win tags', () => {
    const tags = getDirectCheckTags('dependabot')
    expect(tags).toContain('supply-chain')
    expect(tags).toContain('quick-win')
  })

  it('security_policy gets quick-win and compliance tags', () => {
    const tags = getDirectCheckTags('security_policy')
    expect(tags).toContain('quick-win')
    expect(tags).toContain('compliance')
  })

  it('returns empty array for unknown direct check', () => {
    expect(getDirectCheckTags('nonexistent')).toEqual([])
  })

  it('every check in SUPPLY_CHAIN_DIRECT_CHECKS returns supply-chain', () => {
    for (const name of SUPPLY_CHAIN_DIRECT_CHECKS) {
      expect(getDirectCheckTags(name)).toContain('supply-chain')
    }
  })
})

describe('constants', () => {
  it('LICENSING_IS_COMPLIANCE is true', () => {
    expect(LICENSING_IS_COMPLIANCE).toBe(true)
  })

  it('COMPLIANCE_DOC_FILES includes license', () => {
    expect(COMPLIANCE_DOC_FILES.has('license')).toBe(true)
  })

  it('COMPLIANCE_SCORECARD_CHECKS includes Security-Policy and License', () => {
    expect(COMPLIANCE_SCORECARD_CHECKS.has('Security-Policy')).toBe(true)
    expect(COMPLIANCE_SCORECARD_CHECKS.has('License')).toBe(true)
  })

  it('COMPLIANCE_DIRECT_CHECKS includes security_policy', () => {
    expect(COMPLIANCE_DIRECT_CHECKS.has('security_policy')).toBe(true)
  })

  it('CONTRIB_EX_RESPONSIVENESS_PANES includes Issue & PR response time', () => {
    expect(CONTRIB_EX_RESPONSIVENESS_PANES.has('Issue & PR response time')).toBe(true)
  })

  it('CONTRIB_EX_ACTIVITY_CARDS includes Issues', () => {
    expect(CONTRIB_EX_ACTIVITY_CARDS.has('Issues')).toBe(true)
  })
})
