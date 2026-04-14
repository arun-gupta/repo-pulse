import { describe, expect, it } from 'vitest'
import {
  COMMUNITY_DOC_FILES,
  COMMUNITY_CONTRIBUTORS_METRICS,
  COMMUNITY_ACTIVITY_ITEMS,
  isCommunityItem,
} from './community'

describe('lib/tags/community', () => {
  it('exposes three disjoint domain sets', () => {
    const doc = new Set(COMMUNITY_DOC_FILES)
    const contrib = new Set(COMMUNITY_CONTRIBUTORS_METRICS)
    const activity = new Set(COMMUNITY_ACTIVITY_ITEMS)

    for (const key of doc) {
      expect(contrib.has(key)).toBe(false)
      expect(activity.has(key)).toBe(false)
    }
    for (const key of contrib) {
      expect(activity.has(key)).toBe(false)
    }
  })

  it('classifies Documentation community signals', () => {
    expect(isCommunityItem('code_of_conduct', 'doc_file')).toBe(true)
    expect(isCommunityItem('issue_templates', 'doc_file')).toBe(true)
    expect(isCommunityItem('pull_request_template', 'doc_file')).toBe(true)
    expect(isCommunityItem('governance', 'doc_file')).toBe(true)
  })

  it('classifies Contributors community signals', () => {
    expect(isCommunityItem('CODEOWNERS', 'contributors_metric')).toBe(true)
    expect(isCommunityItem('Funding disclosure', 'contributors_metric')).toBe(true)
  })

  it('classifies Activity community signals', () => {
    expect(isCommunityItem('discussions', 'activity_item')).toBe(true)
  })

  it('returns false for unknown keys', () => {
    expect(isCommunityItem('not_a_real_key', 'doc_file')).toBe(false)
    expect(isCommunityItem('readme', 'doc_file')).toBe(false)
    expect(isCommunityItem('random', 'contributors_metric')).toBe(false)
    expect(isCommunityItem('random', 'activity_item')).toBe(false)
  })
})
